export type GraphNodeType = 'COMPANY' | 'OWNER' | 'TRADE' | 'JURISDICTION' | 'PLATFORM';

export type GraphEdgeType = 
  | 'FOUNDED_BY' 
  | 'SHARED_AGENT_WITH' 
  | 'OPERATES_IN' 
  | 'LOCATED_IN' 
  | 'TUCK_IN_SYNERGY';

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  data: {
    revenue?: number;
    ebitda?: number;
    permitDrop?: number;
    exitScore?: number;
    entityCount?: number;
    multiple?: number;
    details?: string;
    location?: string;
    industry?: string;
  };
  // Visualization coordinates
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  label: string;
  weight?: number;
  synergyScore?: number; // 0-100 score for tuck-in acquisition potential
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalEntities: number;
    crossOwnershipClusters: number;
    platformSynergyEdges: number;
    generatedAt: string;
  };
}

export interface GraphRagResult {
  query: string;
  subgraph: KnowledgeGraph;
  traversalPath: string[];
  citedNodeIds: string[];
  thesis: string;
  executiveSummary: string;
  actionableNextSteps: string[];
  confidenceScore: number;
}
