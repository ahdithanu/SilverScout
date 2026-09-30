import { UserRole } from '../types';

export interface EnterpriseDocument {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  allowedRoles: UserRole[];
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface DocumentChunk {
  chunkId: string;
  docId: string;
  tenantId: string;
  title: string;
  text: string;
  tokenCount: number;
  chunkIndex: number;
  totalChunks: number;
  allowedRoles: UserRole[];
  metadata?: Record<string, any>;
  denseEmbedding?: number[];
}

export interface RetrievalQuery {
  query: string;
  tenantId: string;
  callerRole: UserRole;
  topKCandidates?: number; // K1 (initial recall pool, default 20)
  topKFinal?: number; // K2 (re-ranked precision pool, default 3)
}

export interface ScoredChunk {
  chunk: DocumentChunk;
  denseRank?: number;
  denseScore?: number;
  sparseRank?: number;
  sparseScore?: number;
  rrfScore: number;
  reRankScore?: number;
}

export interface GroundedContextResult {
  formattedContext: string;
  citedChunks: ScoredChunk[];
  groundingInstruction: string;
  systemPrompt: string;
  metrics: {
    totalCandidatesRetrieved: number;
    finalChunksCount: number;
    retrievalLatencyMs: number;
    contextTokenCount: number;
    aclRejectedCount: number;
  };
}

/**
 * 1. RECURSIVE SEMANTIC CHUNKER
 * Splits enterprise documents along semantic boundaries (markdown headers, paragraphs, lists)
 * maintaining a target token window (300-500 tokens / 1200-2000 chars) with 10-15% overlap.
 */
export class RecursiveSemanticChunker {
  private targetTokens: number;
  private overlapTokens: number;

  constructor(targetTokens = 350, overlapTokens = 45) {
    this.targetTokens = targetTokens;
    this.overlapTokens = overlapTokens;
  }

  // Approximation: ~4 chars per token for English text
  private tokensToChars(tokens: number): number {
    return tokens * 4;
  }

  public chunkDocument(doc: EnterpriseDocument): DocumentChunk[] {
    const targetChars = this.tokensToChars(this.targetTokens);
    const overlapChars = this.tokensToChars(this.overlapTokens);

    // Split on major structural boundaries: headers, double newlines, list items
    const rawSections = doc.content.split(/(?=\n#{1,4} |\n\n)/g);
    const textBlocks: string[] = [];

    let currentBlock = '';

    for (const section of rawSections) {
      const trimmed = section.trim();
      if (!trimmed) continue;

      if ((currentBlock.length + trimmed.length) <= targetChars) {
        currentBlock += (currentBlock ? '\n\n' : '') + trimmed;
      } else {
        if (currentBlock) {
          textBlocks.push(currentBlock);
        }

        if (trimmed.length > targetChars) {
          // Sub-divide oversized section by sentences
          const sentences = trimmed.split(/(?<=[.?!])\s+/);
          let subBlock = '';
          for (const sentence of sentences) {
            if ((subBlock.length + sentence.length) <= targetChars) {
              subBlock += (subBlock ? ' ' : '') + sentence;
            } else {
              if (subBlock) textBlocks.push(subBlock);
              subBlock = sentence;
            }
          }
          currentBlock = subBlock;
        } else {
          currentBlock = trimmed;
        }
      }
    }

    if (currentBlock) {
      textBlocks.push(currentBlock);
    }

    // Apply sliding window overlap and generate typed chunks
    const chunks: DocumentChunk[] = [];
    for (let i = 0; i < textBlocks.length; i++) {
      let chunkText = textBlocks[i];

      // Prepend trailing overlap from previous chunk if available
      if (i > 0 && overlapChars > 0) {
        const prev = textBlocks[i - 1];
        const overlapSlice = prev.slice(-overlapChars);
        const firstSpace = overlapSlice.indexOf(' ');
        const cleanOverlap = firstSpace !== -1 ? overlapSlice.slice(firstSpace + 1) : overlapSlice;
        chunkText = `...${cleanOverlap}\n` + chunkText;
      }

      const approxTokens = Math.ceil(chunkText.length / 4);

      chunks.push({
        chunkId: `${doc.id}-chk-${String(i + 1).padStart(3, '0')}`,
        docId: doc.id,
        tenantId: doc.tenantId,
        title: doc.title,
        text: chunkText,
        tokenCount: approxTokens,
        chunkIndex: i,
        totalChunks: textBlocks.length,
        allowedRoles: doc.allowedRoles,
        metadata: doc.metadata
      });
    }

    return chunks;
  }
}

/**
 * 2. SPARSE LEXICAL INDEX (BM25)
 * Essential for enterprise retrieval to match exact SKUs, deal IDs, phone numbers, and license keys.
 */
export class BM25SparseIndex {
  private k1: number;
  private b: number;
  private chunks: DocumentChunk[] = [];
  private docLengths: number[] = [];
  private avgDocLength = 0;
  private docFrequencies: Map<string, number> = new Map();
  private invertedIndex: Map<string, Array<{ chunkIndex: number; tf: number }>> = new Map();

  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\-]/g, ' ')
      .split(/\s+/)
      .map(w => w.replace(/^[\.\-]+|[\.\-]+$/g, ''))
      .filter(w => w.length > 1 && !['the', 'and', 'for', 'with', 'that', 'this'].includes(w));
  }

  public indexChunks(chunks: DocumentChunk[]): void {
    this.chunks = chunks;
    this.docLengths = [];
    this.docFrequencies.clear();
    this.invertedIndex.clear();

    let totalLength = 0;

    for (let i = 0; i < chunks.length; i++) {
      const tokens = this.tokenize(chunks[i].text);
      this.docLengths.push(tokens.length);
      totalLength += tokens.length;

      const termCounts = new Map<string, number>();
      for (const token of tokens) {
        termCounts.set(token, (termCounts.get(token) || 0) + 1);
      }

      for (const [term, tf] of termCounts.entries()) {
        this.docFrequencies.set(term, (this.docFrequencies.get(term) || 0) + 1);
        if (!this.invertedIndex.has(term)) {
          this.invertedIndex.set(term, []);
        }
        this.invertedIndex.get(term)!.push({ chunkIndex: i, tf });
      }
    }

    this.avgDocLength = chunks.length > 0 ? totalLength / chunks.length : 1;
  }

  public search(query: string, topK = 20): Array<{ chunk: DocumentChunk; score: number }> {
    const queryTokens = this.tokenize(query);
    const N = this.chunks.length;
    if (N === 0 || queryTokens.length === 0) return [];

    const scores = new Map<number, number>();

    for (const token of queryTokens) {
      const postings = this.invertedIndex.get(token);
      if (!postings) continue;

      const df = this.docFrequencies.get(token) || 1;
      // Robertson-Spärck Jones IDF formula
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));

      for (const { chunkIndex, tf } of postings) {
        const docLen = this.docLengths[chunkIndex] || 1;
        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength));
        const termScore = idf * (numerator / denominator);

        scores.set(chunkIndex, (scores.get(chunkIndex) || 0) + termScore);
      }
    }

    return Array.from(scores.entries())
      .map(([index, score]) => ({ chunk: this.chunks[index], score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

/**
 * 3. DENSE VECTOR INDEX & SIMILARITY
 * Generates semantic representations and calculates cosine similarity.
 */
export class DenseVectorIndex {
  private chunks: DocumentChunk[] = [];

  // Deterministic 128-dimensional dense vector generator for local testing / production embedding projection
  public static generateEmbedding(text: string): number[] {
    const dim = 128;
    const vec = new Array(dim).fill(0);
    const clean = text.toLowerCase();

    for (let i = 0; i < clean.length; i++) {
      const charCode = clean.charCodeAt(i);
      const slot = (charCode * 31 + i * 17) % dim;
      vec[slot] += (charCode % 10) + 1;
    }

    // Normalize to unit vector
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vec.map(v => v / norm);
  }

  public static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  public indexChunks(chunks: DocumentChunk[]): void {
    this.chunks = chunks.map(chunk => ({
      ...chunk,
      denseEmbedding: chunk.denseEmbedding || DenseVectorIndex.generateEmbedding(chunk.text)
    }));
  }

  public search(query: string, topK = 20): Array<{ chunk: DocumentChunk; score: number }> {
    const queryVec = DenseVectorIndex.generateEmbedding(query);

    return this.chunks
      .map(chunk => ({
        chunk,
        score: DenseVectorIndex.cosineSimilarity(queryVec, chunk.denseEmbedding!)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

/**
 * 4. HYBRID RAG RETRIEVER WITH RECIPROCAL RANK FUSION (RRF) & ACL GUARD
 */
export class EnterpriseHybridRAGRetriever {
  private chunker: RecursiveSemanticChunker;
  private sparseIndex: BM25SparseIndex;
  private denseIndex: DenseVectorIndex;
  private allChunks: DocumentChunk[] = [];

  constructor(targetTokens = 350, overlapTokens = 45) {
    this.chunker = new RecursiveSemanticChunker(targetTokens, overlapTokens);
    this.sparseIndex = new BM25SparseIndex();
    this.denseIndex = new DenseVectorIndex();
  }

  public ingestDocument(doc: EnterpriseDocument): DocumentChunk[] {
    const chunks = this.chunker.chunkDocument(doc);
    this.allChunks.push(...chunks);
    this.rebuildIndexes();
    return chunks;
  }

  public ingestDocuments(docs: EnterpriseDocument[]): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    for (const doc of docs) {
      chunks.push(...this.chunker.chunkDocument(doc));
    }
    this.allChunks.push(...chunks);
    this.rebuildIndexes();
    return chunks;
  }

  private rebuildIndexes(): void {
    this.sparseIndex.indexChunks(this.allChunks);
    this.denseIndex.indexChunks(this.allChunks);
  }

  /**
   * Reciprocal Rank Fusion (RRF) algorithm:
   * Score(d) = 1 / (60 + Rank_dense) + 1 / (60 + Rank_sparse)
   */
  public retrieve(queryParams: RetrievalQuery): GroundedContextResult {
    const startTime = Date.now();
    const { query, tenantId, callerRole, topKCandidates = 20, topKFinal = 3 } = queryParams;

    // 1. Pre-Retrieval ACL and Multi-Tenant Isolation
    let aclRejectedCount = 0;
    const authorizedChunks = this.allChunks.filter(chunk => {
      const tenantMatch = chunk.tenantId === tenantId;
      const roleMatch = callerRole === 'admin' || chunk.allowedRoles.includes(callerRole);
      if (!tenantMatch || !roleMatch) {
        aclRejectedCount++;
        return false;
      }
      return true;
    });

    if (authorizedChunks.length === 0) {
      return {
        formattedContext: 'NO_AUTHORIZED_DOCUMENTS_FOUND',
        citedChunks: [],
        groundingInstruction: 'No authorized documents exist for this tenant and role.',
        systemPrompt: '',
        metrics: {
          totalCandidatesRetrieved: 0,
          finalChunksCount: 0,
          retrievalLatencyMs: Date.now() - startTime,
          contextTokenCount: 0,
          aclRejectedCount
        }
      };
    }

    // 2. Multi-Index Retrieval (Candidate Generation Pool K1)
    const sparseResults = this.sparseIndex.search(query, topKCandidates);
    const denseResults = this.denseIndex.search(query, topKCandidates);

    // 3. Reciprocal Rank Fusion (RRF)
    const rrfMap = new Map<string, ScoredChunk>();
    const RRF_CONSTANT = 60;

    denseResults.forEach((item, index) => {
      // Must pass ACL
      if (!authorizedChunks.some(c => c.chunkId === item.chunk.chunkId)) return;

      const denseRank = index + 1;
      const rrfContribution = 1 / (RRF_CONSTANT + denseRank);
      rrfMap.set(item.chunk.chunkId, {
        chunk: item.chunk,
        denseRank,
        denseScore: Number(item.score.toFixed(4)),
        rrfScore: rrfContribution
      });
    });

    sparseResults.forEach((item, index) => {
      if (!authorizedChunks.some(c => c.chunkId === item.chunk.chunkId)) return;

      const sparseRank = index + 1;
      const rrfContribution = 1 / (RRF_CONSTANT + sparseRank);
      const existing = rrfMap.get(item.chunk.chunkId);

      if (existing) {
        existing.sparseRank = sparseRank;
        existing.sparseScore = Number(item.score.toFixed(4));
        existing.rrfScore += rrfContribution;
      } else {
        rrfMap.set(item.chunk.chunkId, {
          chunk: item.chunk,
          sparseRank,
          sparseScore: Number(item.score.toFixed(4)),
          rrfScore: rrfContribution
        });
      }
    });

    // 4. Cross-Encoder / Precision Re-ranking (Simulated High-Precision Top K2)
    const rankedCandidates = Array.from(rrfMap.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, topKFinal);

    // 5. Grounded Context Construction with Strict Source Citations
    const formattedContext = rankedCandidates
      .map((entry, idx) => {
        return `[Source ${idx + 1} | ChunkID: ${entry.chunk.chunkId} | Doc: "${entry.chunk.title}"]\n${entry.chunk.text}`;
      })
      .join('\n\n---\n\n');

    const totalContextTokens = rankedCandidates.reduce((sum, c) => sum + c.chunk.tokenCount, 0);

    const systemPrompt = `You are an extractive institutional intelligence agent.
You must answer the user query strictly using the provided authorized Sources below.
CRITICAL CONSTRAINTS:
1. Do not use outside knowledge or assumptions.
2. If the answer cannot be directly determined from the provided Sources, respond ONLY with:
   "I cannot find this information in the authorized enterprise knowledge base."
3. Every factual assertion must be attributed with its source citation in brackets (e.g. [ChunkID: ...]).`;

    return {
      formattedContext,
      citedChunks: rankedCandidates,
      groundingInstruction: 'Answer strictly using cited chunks with zero hallucination.',
      systemPrompt,
      metrics: {
        totalCandidatesRetrieved: rrfMap.size,
        finalChunksCount: rankedCandidates.length,
        retrievalLatencyMs: Date.now() - startTime,
        contextTokenCount: totalContextTokens,
        aclRejectedCount
      }
    };
  }
}
