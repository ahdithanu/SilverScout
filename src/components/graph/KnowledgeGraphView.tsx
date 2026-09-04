import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lead } from '../../types';
import { KnowledgeGraph, GraphNode, GraphEdge } from '../../types/graph';
import { buildKnowledgeGraph } from '../../utils/graphBuilder';
import { 
  Network, 
  Building2, 
  User, 
  Compass, 
  Landmark, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  ShieldCheck, 
  ChevronRight,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface KnowledgeGraphViewProps {
  leads: Lead[];
  onSelectLead?: (lead: Lead) => void;
  onNavigateToGraphRag?: (initialQuery?: string) => void;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  leads,
  onSelectLead,
  onNavigateToGraphRag
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. Build Knowledge Graph from Leads
  const graph: KnowledgeGraph = useMemo(() => {
    return buildKnowledgeGraph(leads);
  }, [leads]);

  // 2. Position nodes systematically in a circular/orbital multi-tier force layout
  const positionedNodes = useMemo(() => {
    const width = 860;
    const height = 560;
    const centerX = width / 2;
    const centerY = height / 2;

    const companies = graph.nodes.filter(n => n.type === 'COMPANY');
    const owners = graph.nodes.filter(n => n.type === 'OWNER');
    const jurisdictions = graph.nodes.filter(n => n.type === 'JURISDICTION');
    const trades = graph.nodes.filter(n => n.type === 'TRADE');
    const platforms = graph.nodes.filter(n => n.type === 'PLATFORM');

    const result = new Map<string, { x: number; y: number }>();

    // Center: Platforms
    platforms.forEach((p, idx) => {
      const offsetX = (idx - (platforms.length - 1) / 2) * 160;
      result.set(p.id, { x: centerX + offsetX, y: centerY });
    });

    // Inner Orbit: Companies
    const companyRadius = 180;
    companies.forEach((c, idx) => {
      const angle = (idx / Math.max(1, companies.length)) * 2 * Math.PI;
      result.set(c.id, {
        x: centerX + Math.cos(angle) * companyRadius,
        y: centerY + Math.sin(angle) * companyRadius
      });
    });

    // Middle Orbit: Owners
    const ownerRadius = 260;
    owners.forEach((o, idx) => {
      const angle = ((idx + 0.5) / Math.max(1, owners.length)) * 2 * Math.PI;
      result.set(o.id, {
        x: centerX + Math.cos(angle) * ownerRadius,
        y: centerY + Math.sin(angle) * ownerRadius
      });
    });

    // Outer Orbit: Jurisdictions & Trades
    const outerRadius = 320;
    const outerNodes = [...jurisdictions, ...trades];
    outerNodes.forEach((n, idx) => {
      const angle = (idx / Math.max(1, outerNodes.length)) * 2 * Math.PI;
      result.set(n.id, {
        x: centerX + Math.cos(angle) * outerRadius,
        y: centerY + Math.sin(angle) * outerRadius
      });
    });

    return result;
  }, [graph]);

  // 3. Filtered nodes
  const filteredNodes = useMemo(() => {
    if (filterType === 'ALL') return graph.nodes;
    return graph.nodes.filter(n => n.type === filterType);
  }, [graph.nodes, filterType]);

  const activeNodeIdSet = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return graph.edges.filter(e => activeNodeIdSet.has(e.source) && activeNodeIdSet.has(e.target));
  }, [graph.edges, activeNodeIdSet]);

  // Node Color & Icon Mapping
  const getNodeVisual = (type: string) => {
    switch (type) {
      case 'PLATFORM':
        return { color: '#8b5cf6', bg: 'bg-purple-950/80', border: 'border-purple-500', icon: Landmark, label: 'Platform HoldCo' };
      case 'COMPANY':
        return { color: '#10b981', bg: 'bg-emerald-950/80', border: 'border-emerald-500', icon: Building2, label: 'Target Company' };
      case 'OWNER':
        return { color: '#f59e0b', bg: 'bg-amber-950/80', border: 'border-amber-500', icon: User, label: 'Owner / Agent' };
      case 'JURISDICTION':
        return { color: '#06b6d4', bg: 'bg-cyan-950/80', border: 'border-cyan-500', icon: Compass, label: 'Jurisdiction' };
      case 'TRADE':
        return { color: '#ec4899', bg: 'bg-pink-950/80', border: 'border-pink-500', icon: Layers, label: 'Trade Vertical' };
      default:
        return { color: '#71717a', bg: 'bg-zinc-900', border: 'border-zinc-700', icon: Network, label: 'Entity' };
    }
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Top Header / Stats Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 bg-zinc-900/50 px-6 py-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <Network className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Deal Sourcing Knowledge Graph</h2>
              <p className="text-xs text-zinc-400">Enterprise M&A Ontology mapping cross-ownership, jurisdictions & platform synergies</p>
            </div>
          </div>
        </div>

        {/* Top Metric Chips */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-zinc-400">Entities:</span>
            <span className="font-bold text-white">{graph.metadata.totalEntities}</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-1.5 text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>Cross-Ownership Networks:</span>
            <span className="font-bold">{graph.metadata.crossOwnershipClusters}</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-purple-900/50 bg-purple-950/30 px-3 py-1.5 text-purple-300">
            <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
            <span>Tuck-In Synergies:</span>
            <span className="font-bold">{graph.metadata.platformSynergyEdges}</span>
          </div>

          {onNavigateToGraphRag && (
            <button
              onClick={() => onNavigateToGraphRag("Detect hidden cross-ownership clusters across all targets")}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-emerald-500 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Query Graph-RAG →
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas & Inspector View */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Graph Canvas Container */}
        <div 
          className="relative flex-1 cursor-grab active:cursor-grabbing select-none overflow-hidden bg-zinc-950"
          onMouseDown={(e) => {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
          }}
          onMouseMove={(e) => {
            if (isDragging) {
              setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
            }
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          {/* Subtle Background Radial Grid */}
          <div 
            className="absolute inset-0 opacity-15"
            style={{ 
              backgroundImage: 'radial-gradient(#10b981 0.75px, transparent 0.75px)', 
              backgroundSize: '32px 32px' 
            }}
          />

          {/* Canvas SVG for Edges and Nodes */}
          <svg 
            className="h-full w-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out'
            }}
          >
            {/* Edges */}
            <g>
              {filteredEdges.map((edge) => {
                const srcPos = positionedNodes.get(edge.source);
                const tgtPos = positionedNodes.get(edge.target);
                if (!srcPos || !tgtPos) return null;

                const isCross = edge.type === 'SHARED_AGENT_WITH';
                const isSynergy = edge.type === 'TUCK_IN_SYNERGY';

                const strokeColor = isCross 
                  ? '#f59e0b' 
                  : isSynergy 
                    ? '#a855f7' 
                    : '#3f3f46';

                return (
                  <g key={edge.id} className="transition-opacity hover:opacity-100 opacity-60">
                    <line
                      x1={srcPos.x}
                      y1={srcPos.y}
                      x2={tgtPos.x}
                      y2={tgtPos.y}
                      stroke={strokeColor}
                      strokeWidth={isCross ? 2.5 : isSynergy ? 2.0 : 1.2}
                      strokeDasharray={isCross ? '4 3' : undefined}
                    />
                  </g>
                );
              })}
            </g>

            {/* Nodes */}
            <g>
              {filteredNodes.map((node) => {
                const pos = positionedNodes.get(node.id);
                if (!pos) return null;

                const visual = getNodeVisual(node.type);
                const isSelected = selectedNode?.id === node.id;
                const IconComponent = visual.icon;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                    className="cursor-pointer"
                  >
                    {/* Pulsing ring for selected node or platforms */}
                    {isSelected && (
                      <circle
                        r="28"
                        fill="none"
                        stroke={visual.color}
                        strokeWidth="2"
                        className="animate-ping opacity-40"
                      />
                    )}

                    {/* Node Outer Circle */}
                    <circle
                      r={node.type === 'PLATFORM' ? 24 : node.type === 'COMPANY' ? 20 : 16}
                      fill="#09090b"
                      stroke={visual.color}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all hover:scale-110"
                    />

                    {/* Node Core Icon representation */}
                    <foreignObject 
                      x={node.type === 'PLATFORM' ? -12 : -10} 
                      y={node.type === 'PLATFORM' ? -12 : -10} 
                      width="24" 
                      height="24" 
                      className="pointer-events-none"
                    >
                      <div className="flex h-full w-full items-center justify-center text-white">
                        <IconComponent style={{ color: visual.color, width: node.type === 'PLATFORM' ? 18 : 14, height: node.type === 'PLATFORM' ? 18 : 14 }} />
                      </div>
                    </foreignObject>

                    {/* Node Label Text */}
                    <text
                      y={node.type === 'PLATFORM' ? 36 : 30}
                      textAnchor="middle"
                      fill="#e4e4e7"
                      fontSize={node.type === 'PLATFORM' ? "12" : "10"}
                      fontWeight={isSelected ? "bold" : "500"}
                      className="pointer-events-none select-none drop-shadow-md"
                    >
                      {node.label.length > 20 ? `${node.label.substring(0, 18)}...` : node.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Floating Canvas Controls */}
          <div className="absolute bottom-6 left-6 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 p-2 shadow-2xl backdrop-blur-md">
            <button
              onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.4, z - 0.2))}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Reset View"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="absolute top-6 left-6 flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'All Entities' },
              { id: 'COMPANY', label: 'Target Companies' },
              { id: 'OWNER', label: 'Owners / Agents' },
              { id: 'PLATFORM', label: 'Platform Vehicles' },
              { id: 'JURISDICTION', label: 'Jurisdictions' },
              { id: 'TRADE', label: 'Trade Clusters' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filterType === f.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Node Detail Inspector Drawer */}
        {selectedNode && (
          <div className="w-80 border-l border-zinc-800 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {getNodeVisual(selectedNode.type).label}
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-zinc-400 hover:text-white text-xs"
                >
                  Close ✕
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{selectedNode.label}</h3>
                <p className="mt-1 text-xs text-zinc-400">{selectedNode.data.details || 'Enterprise entity linked within Private Equity deal ontology.'}</p>
              </div>

              {/* Data Metrics */}
              <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs">
                {selectedNode.data.revenue && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Revenue:</span>
                    <span className="font-mono font-bold text-white">${(selectedNode.data.revenue / 1000000).toFixed(2)}M</span>
                  </div>
                )}
                {selectedNode.data.ebitda && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">EBITDA:</span>
                    <span className="font-mono font-bold text-emerald-400">${(selectedNode.data.ebitda / 1000).toFixed(0)}k</span>
                  </div>
                )}
                {selectedNode.data.exitScore && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Exit Propensity:</span>
                    <span className="font-bold text-amber-400">{selectedNode.data.exitScore} / 10</span>
                  </div>
                )}
                {selectedNode.data.permitDrop !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Permit Contraction:</span>
                    <span className="font-bold text-red-400">{selectedNode.data.permitDrop}%</span>
                  </div>
                )}
                {selectedNode.data.location && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Jurisdiction:</span>
                    <span className="text-white">{selectedNode.data.location}</span>
                  </div>
                )}
              </div>

              {/* Connected Relationships list */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Connected Ontologies</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {graph.edges
                    .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map(e => {
                      const otherId = e.source === selectedNode.id ? e.target : e.source;
                      const otherNode = graph.nodes.find(n => n.id === otherId);
                      return (
                        <div 
                          key={e.id} 
                          onClick={() => otherNode && setSelectedNode(otherNode)}
                          className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs hover:border-zinc-700 cursor-pointer transition-colors"
                        >
                          <div className="truncate">
                            <p className="font-semibold text-zinc-200 truncate">{otherNode?.label}</p>
                            <p className="text-[10px] text-zinc-500">{e.label}</p>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" />
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-zinc-800 space-y-2">
              {onNavigateToGraphRag && (
                <button
                  onClick={() => onNavigateToGraphRag(`Analyze roll-up synergies and cross-ownership around [${selectedNode.label}]`)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Run Graph-RAG on Entity
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
