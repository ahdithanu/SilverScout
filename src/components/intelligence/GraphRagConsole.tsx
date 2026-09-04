import React, { useState } from 'react';
import { Lead } from '../../types';
import { KnowledgeGraph, GraphRagResult } from '../../types/graph';
import { buildKnowledgeGraph } from '../../utils/graphBuilder';
import { executeGraphRagQuery } from '../../services/graphRagService';
import { 
  Sparkles, 
  Search, 
  GitBranch, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  Layers, 
  Clock, 
  BrainCircuit,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileCheck2
} from 'lucide-react';

interface GraphRagConsoleProps {
  leads: Lead[];
  initialQuery?: string;
  onSelectLead?: (lead: Lead) => void;
}

export const GraphRagConsole: React.FC<GraphRagConsoleProps> = ({
  leads,
  initialQuery = '',
  onSelectLead
}) => {
  const [query, setQuery] = useState(initialQuery || 'Detect hidden cross-ownership clusters and tuck-in synergy for our platform vehicles');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GraphRagResult | null>(null);

  const presetQueries = [
    "Detect hidden cross-ownership clusters across all targets",
    "Identify accretive tuck-in bolt-ons for our Apex HVAC Platform",
    "Correlate municipal permit decline with owner fatigue in Central Valley",
    "Map serial founder networks with aging entities over 20 years old"
  ];

  const handleRunQuery = async (customQuery?: string) => {
    const q = (customQuery || query).trim();
    if (!q) return;
    setIsLoading(true);
    try {
      const graph: KnowledgeGraph = buildKnowledgeGraph(leads);
      const ragResult = await executeGraphRagQuery(q, graph);
      setResult(ragResult);
    } catch (err) {
      console.error("Graph-RAG execution error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-white overflow-y-auto p-8 space-y-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto w-full text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" />
          Graph-Augmented Retrieval-Augmented Generation (Graph-RAG)
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Ontology Intelligence Engine</h1>
        <p className="text-sm text-zinc-400">
          Executes multi-hop graph traversals over ownership registries, municipal permits, and platform synergy networks.
        </p>
      </div>

      {/* Query Bar */}
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/80 p-2 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 px-3">
            <Search className="h-5 w-5 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunQuery()}
              placeholder="Ask an institutional question across the deal ontology..."
              className="flex-1 bg-transparent py-3 text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
            <button
              onClick={() => handleRunQuery()}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Traversing Graph...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Execute Graph-RAG
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preset Prompt Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 font-semibold mr-1">Institutional Presets:</span>
          {presetQueries.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(preset);
                handleRunQuery(preset);
              }}
              className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="max-w-4xl mx-auto w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 space-y-4 animate-pulse">
          <div className="h-4 w-1/3 bg-zinc-800 rounded"></div>
          <div className="h-24 bg-zinc-800/50 rounded-xl"></div>
          <div className="h-32 bg-zinc-800/50 rounded-xl"></div>
        </div>
      )}

      {/* Results Section */}
      {result && !isLoading && (
        <div className="max-w-4xl mx-auto w-full space-y-6">
          {/* Executive Summary Card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 to-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BrainCircuit className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Graph-RAG Executive Synthesis</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {result.confidenceScore}% Grounding Confidence
              </span>
            </div>

            <p className="text-sm font-medium text-emerald-200/90 leading-relaxed">
              {result.executiveSummary}
            </p>
          </div>

          {/* Subgraph Traversal Path Breadcrumbs */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <GitBranch className="h-4 w-4 text-purple-400" />
              Multi-Hop Graph Traversal Path
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {result.traversalPath.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div className="rounded-lg border border-purple-900/50 bg-purple-950/30 px-3 py-1.5 font-mono text-purple-300">
                    {step}
                  </div>
                  {idx < result.traversalPath.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Full Investment Thesis Grounded in Topology */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Topological Investment Thesis & M&A Rationale
            </h4>
            <div className="text-sm text-zinc-300 leading-relaxed space-y-3 font-sans">
              <p>{result.thesis}</p>
            </div>

            {/* Cited Graph Nodes */}
            <div className="pt-3 border-t border-zinc-800">
              <span className="text-xs font-semibold text-zinc-500 block mb-2">Verified Ontology Citations:</span>
              <div className="flex flex-wrap gap-2">
                {result.citedNodeIds.map((nodeId, idx) => {
                  const node = result.subgraph.nodes.find(n => n.id === nodeId);
                  return (
                    <div 
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      <span className="font-mono text-[11px] text-zinc-400">[{nodeId}]</span>
                      <span className="font-semibold">{node?.label || nodeId}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actionable Deal Team Next Steps */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <FileCheck2 className="h-4 w-4 text-emerald-400" />
              Prescribed M&A Next Steps
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.actionableNextSteps.map((step, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950 p-3.5 text-xs text-zinc-300"
                >
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
