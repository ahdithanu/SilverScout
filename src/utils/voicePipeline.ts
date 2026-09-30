export type VoiceAgentState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'INTERRUPTED';

export interface AudioPacket {
  sampleRate: number; // e.g. 16000 Hz
  amplitude: number; // 0.0 to 1.0 (energy level)
  durationMs: number;
  timestamp: number;
}

export interface LatencyBreakdown {
  vadDetectionMs: number;
  speechToTextMs: number;
  llmTimeFirstTokenMs: number;
  ttsAudioChunkMs: number;
  totalGlassToGlassMs: number;
}

export interface VoiceSessionTelemetry {
  sessionId: string;
  state: VoiceAgentState;
  interruptionsCount: number;
  totalTurns: number;
  latencyHistory: LatencyBreakdown[];
  averageLatencyMs: number;
}

/**
 * 1. FULL-DUPLEX REAL-TIME VOICE PIPELINE ARCHITECTURE
 * Manages VAD detection, streaming STT, sentence-split TTS, and barge-in interruptions.
 */
export class VoicePipelineManager {
  private sessionId: string;
  private state: VoiceAgentState = 'IDLE';
  private vadSilenceThresholdMs: number;
  private speechEnergyThreshold: number;
  private interruptionsCount = 0;
  private turnsCount = 0;
  private latencies: LatencyBreakdown[] = [];
  private activePlaybackBuffer: string[] = [];

  constructor(vadSilenceThresholdMs = 400, speechEnergyThreshold = 0.25) {
    this.sessionId = `v-session-${Date.now()}`;
    this.vadSilenceThresholdMs = vadSilenceThresholdMs;
    this.speechEnergyThreshold = speechEnergyThreshold;
  }

  public getState(): VoiceAgentState {
    return this.state;
  }

  public getTelemetry(): VoiceSessionTelemetry {
    const avg = this.latencies.length > 0
      ? this.latencies.reduce((acc, l) => acc + l.totalGlassToGlassMs, 0) / this.latencies.length
      : 0;

    return {
      sessionId: this.sessionId,
      state: this.state,
      interruptionsCount: this.interruptionsCount,
      totalTurns: this.turnsCount,
      latencyHistory: this.latencies,
      averageLatencyMs: Math.round(avg)
    };
  }

  /**
   * BARGE-IN INTERRUPTION HANDLER:
   * When new user speech is detected while the bot is speaking, immediately cuts audio playback.
   */
  public processIncomingAudioPacket(packet: AudioPacket): {
    isUserSpeaking: boolean;
    interrupted: boolean;
    playbackCancelled: boolean;
  } {
    const isUserSpeaking = packet.amplitude >= this.speechEnergyThreshold;

    if (this.state === 'SPEAKING' && isUserSpeaking) {
      // User started speaking while bot is talking -> BARGE-IN TRIGGERED
      this.state = 'INTERRUPTED';
      this.interruptionsCount++;
      const cancelledItemsCount = this.activePlaybackBuffer.length;
      this.activePlaybackBuffer = []; // Clear pending audio buffer immediately

      this.state = 'LISTENING';
      return {
        isUserSpeaking: true,
        interrupted: true,
        playbackCancelled: cancelledItemsCount > 0
      };
    }

    if (isUserSpeaking && this.state !== 'PROCESSING') {
      this.state = 'LISTENING';
    }

    return {
      isUserSpeaking,
      interrupted: false,
      playbackCancelled: false
    };
  }

  /**
   * TTS TEXT NORMALIZER:
   * Normalizes financial terms, acronyms, and telephone numbers so speech synthesis doesn't mispronounce them.
   */
  public static normalizeTextForSpeech(text: string): string {
    let clean = text;

    const digitWords: Record<string, string> = {
      '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
      '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine'
    };

    const convertDecimal = (str: string) => {
      const [intPart, decPart] = str.split('.');
      if (decPart !== undefined) {
        return `${intPart} point ${digitWords[decPart] || decPart}`;
      }
      return intPart;
    };

    // Currency values: "$4.5M" -> "4.5 million dollars"
    clean = clean.replace(/\$([0-9\.]+)\s*M\b/gi, (_, num) => `${num} million dollars`);
    clean = clean.replace(/\$([0-9\.]+)\s*k\b/gi, (_, num) => `${num} thousand dollars`);
    clean = clean.replace(/\$([0-9,]+)/g, (_, num) => `${num.replace(/,/g, '')} dollars`);

    // Multiples: "5.2x" -> "five point two times"
    clean = clean.replace(/\b([0-9])\.([0-9])x\b/gi, (_, a, b) => `${digitWords[a] || a} point ${digitWords[b] || b} times`);
    clean = clean.replace(/\b([0-9\.]+)x\b/gi, (_, num) => `${num} times`);

    // Private Equity & M&A Acronyms
    clean = clean.replace(/\bEBITDA\b/g, 'ee-bit-dah');
    clean = clean.replace(/\bSDE\b/g, 'S-D-E');
    clean = clean.replace(/\bLOI\b/g, 'L-O-I');
    clean = clean.replace(/\bCIM\b/g, 'sim');
    clean = clean.replace(/\bDSCR\b/g, 'D-S-C-R');
    clean = clean.replace(/\bIRR\b/g, 'I-R-R');
    clean = clean.replace(/\bMOIC\b/g, 'moy-ick');
    clean = clean.replace(/\bHVAC\b/g, 'H-vac');

    // Phone numbers: (916) 555-0199 -> "9 1 6, 5 5 5, 0 1 9 9"
    clean = clean.replace(/\((\d{3})\)\s*(\d{3})-(\d{4})/, (_, a, b, c) => {
      return `${a.split('').join(' ')}, ${b.split('').join(' ')}, ${c.split('').join(' ')}`;
    });

    return clean;
  }

  /**
   * SENTENCE-BOUNDARY SPLITTER FOR STREAMING TTS:
   * Splits LLM token stream into natural acoustic chunks (on commas, colons, and periods)
   * so first audio chunk can stream in under 120ms without waiting for entire response.
   */
  public static splitStreamingTokensIntoSpeechChunks(textStream: string): string[] {
    const chunks = textStream
      .split(/(?<=[.!?,;:])\s+/)
      .map(c => c.trim())
      .filter(c => c.length > 0);

    return chunks.length > 0 ? chunks : [textStream.trim()];
  }

  /**
   * Simulates full conversational round-trip and computes real glass-to-glass latency
   */
  public recordTurnLatency(vad = 45, stt = 180, llmTTFT = 210, ttsAudio = 115): LatencyBreakdown {
    const total = vad + stt + llmTTFT + ttsAudio;
    const latency: LatencyBreakdown = {
      vadDetectionMs: vad,
      speechToTextMs: stt,
      llmTimeFirstTokenMs: llmTTFT,
      ttsAudioChunkMs: ttsAudio,
      totalGlassToGlassMs: total
    };

    this.latencies.push(latency);
    this.turnsCount++;
    this.state = 'SPEAKING';
    return latency;
  }

  public setPlaybackBuffer(chunks: string[]): void {
    this.activePlaybackBuffer = [...chunks];
    this.state = 'SPEAKING';
  }

  public finishPlayback(): void {
    this.activePlaybackBuffer = [];
    this.state = 'IDLE';
  }
}
