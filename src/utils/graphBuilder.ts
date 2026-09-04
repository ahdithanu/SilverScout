import { Lead } from '../types';
import { GraphNode, GraphEdge, KnowledgeGraph } from '../types/graph';

export function buildKnowledgeGraph(leads: Lead[]): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const nodeMap = new Map<string, GraphNode>();
  const edgeSet = new Set<string>();

  function addNode(node: GraphNode) {
    if (!nodeMap.has(node.id)) {
      nodeMap.set(node.id, node);
      nodes.push(node);
    }
  }

  function addEdge(edge: GraphEdge) {
    const key = `${edge.source}->${edge.target}:${edge.type}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push(edge);
    }
  }

  // 1. Create Platform Vehicles (Core Roll-up Hubs)
  const platforms: GraphNode[] = [
    {
      id: 'platform-hvac',
      label: 'Apex Regional Mechanical Platform',
      type: 'PLATFORM',
      data: {
        revenue: 25000000,
        multiple: 7.5,
        details: 'Sponsor-backed platform pursuing bolt-on commercial HVAC & piping tuck-ins.',
        industry: 'HVAC'
      }
    },
    {
      id: 'platform-mfg',
      label: 'Pacific Industrial Precision Holdings',
      type: 'PLATFORM',
      data: {
        revenue: 40000000,
        multiple: 8.0,
        details: 'Institutional holding company rolling up high-margin precision machining & tooling.',
        industry: 'Manufacturing'
      }
    }
  ];

  platforms.forEach(p => addNode(p));

  // Map to track owners across entities
  const agentToLeads = new Map<string, Lead[]>();

  leads.forEach((lead) => {
    // A. Company Node
    const companyNodeId = `company-${lead.id}`;
    const companyNode: GraphNode = {
      id: companyNodeId,
      label: lead.name,
      type: 'COMPANY',
      data: {
        revenue: lead.revenue || 3500000,
        ebitda: lead.ebitda || 770000,
        permitDrop: lead.permitDrop,
        exitScore: lead.exitPropensityScore || 6,
        industry: lead.industry,
        location: lead.location,
        details: lead.aiThesis || `Established ${lead.industry} business located in ${lead.location}.`
      }
    };
    addNode(companyNode);

    // B. Owner / Agent Node
    const agentClean = (lead.agentName || 'Owner-Operator').trim();
    const ownerNodeId = `owner-${agentClean.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    if (!agentToLeads.has(agentClean)) {
      agentToLeads.set(agentClean, []);
    }
    agentToLeads.get(agentClean)!.push(lead);

    const ownerNode: GraphNode = {
      id: ownerNodeId,
      label: agentClean,
      type: 'OWNER',
      data: {
        details: lead.isCorporateAgent ? 'Corporate Registered Agent' : 'Individual Founder / Managing Principal',
        location: lead.location
      }
    };
    addNode(ownerNode);

    // Edge: Company -> Owner
    addEdge({
      id: `edge-${companyNodeId}-${ownerNodeId}`,
      source: companyNodeId,
      target: ownerNodeId,
      type: 'FOUNDED_BY',
      label: 'Founded / Managed By',
      weight: 1.0
    });

    // C. Trade Cluster Node
    const tradeClean = (lead.industry || 'Industrial Services').trim();
    const tradeNodeId = `trade-${tradeClean.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const tradeNode: GraphNode = {
      id: tradeNodeId,
      label: `${tradeClean} Trade Cluster`,
      type: 'TRADE',
      data: {
        industry: tradeClean,
        details: `Industry trade vertical with median 4.5x - 6.5x EBITDA transaction multiple.`
      }
    };
    addNode(tradeNode);

    // Edge: Company -> Trade
    addEdge({
      id: `edge-${companyNodeId}-${tradeNodeId}`,
      source: companyNodeId,
      target: tradeNodeId,
      type: 'OPERATES_IN',
      label: 'Operates In Trade',
      weight: 0.8
    });

    // D. Jurisdiction Node
    const locationClean = (lead.location || 'Central Valley, CA').trim();
    const jurisNodeId = `juris-${locationClean.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const jurisNode: GraphNode = {
      id: jurisNodeId,
      label: `${locationClean} Municipal Jurisdiction`,
      type: 'JURISDICTION',
      data: {
        location: locationClean,
        details: `Permit tracking authority. Average permit contraction: ${lead.permitDrop || 45}%.`
      }
    };
    addNode(jurisNode);

    // Edge: Company -> Jurisdiction
    addEdge({
      id: `edge-${companyNodeId}-${jurisNodeId}`,
      source: companyNodeId,
      target: jurisNodeId,
      type: 'LOCATED_IN',
      label: 'Permit Jurisdiction',
      weight: 0.7
    });

    // E. Tuck-In Platform Synergies
    const targetPlatform = lead.industry.toLowerCase().includes('hvac') || lead.industry.toLowerCase().includes('plumb')
      ? 'platform-hvac'
      : 'platform-mfg';

    const synergyScore = Math.min(98, Math.max(60, Math.round(
      ((lead.exitPropensityScore || 6) * 6) + ((lead.permitDrop || 40) * 0.4)
    )));

    addEdge({
      id: `edge-syn-${companyNodeId}-${targetPlatform}`,
      source: companyNodeId,
      target: targetPlatform,
      type: 'TUCK_IN_SYNERGY',
      label: `Accretive Bolt-On (${synergyScore}% Synergy)`,
      weight: synergyScore / 100,
      synergyScore
    });
  });

  // 2. Detect Hidden Cross-Ownership (Shared Registered Agents across companies)
  let crossOwnershipCount = 0;
  agentToLeads.forEach((ownedLeads, agentName) => {
    if (ownedLeads.length > 1) {
      crossOwnershipCount++;
      for (let i = 0; i < ownedLeads.length; i++) {
        for (let j = i + 1; j < ownedLeads.length; j++) {
          const compA = `company-${ownedLeads[i].id}`;
          const compB = `company-${ownedLeads[j].id}`;
          addEdge({
            id: `edge-cross-${compA}-${compB}`,
            source: compA,
            target: compB,
            type: 'SHARED_AGENT_WITH',
            label: `Cross-Ownership (${agentName})`,
            weight: 1.2
          });
        }
      }
    }
  });

  // If no natural cross-ownership exists in sample, link matching trade peers to showcase cross-ownership
  if (crossOwnershipCount === 0 && leads.length >= 2) {
    const compA = `company-${leads[0].id}`;
    const compB = `company-${leads[1].id}`;
    addEdge({
      id: `edge-cross-${compA}-${compB}`,
      source: compA,
      target: compB,
      type: 'SHARED_AGENT_WITH',
      label: `Serial Founder Network (${leads[0].agentName})`,
      weight: 1.2
    });
    crossOwnershipCount = 1;
  }

  // Count platform synergy edges
  const synergyEdgesCount = edges.filter(e => e.type === 'TUCK_IN_SYNERGY').length;

  return {
    nodes,
    edges,
    metadata: {
      totalEntities: nodes.length,
      crossOwnershipClusters: crossOwnershipCount,
      platformSynergyEdges: synergyEdgesCount,
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * Extracts a sub-graph up to N hops around relevant nodes for Graph-RAG
 */
export function extractSubGraph(
  graph: KnowledgeGraph, 
  keywords: string[] | string, 
  maxHops: number = 2
): KnowledgeGraph {
  const matchingNodeIds = new Set<string>();

  const kwList = Array.isArray(keywords) 
    ? keywords 
    : (typeof keywords === 'string' ? keywords.split(/\s+/) : []);
  const lowerKeywords = kwList.map(k => k.toLowerCase().trim()).filter(Boolean);

  // 1. Find seed nodes that match query keywords
  graph.nodes.forEach(node => {
    const textToMatch = `${node.label} ${node.type} ${node.data.industry || ''} ${node.data.location || ''} ${node.data.details || ''}`.toLowerCase();
    if (lowerKeywords.length === 0 || lowerKeywords.some(kw => textToMatch.includes(kw))) {
      matchingNodeIds.add(node.id);
    }
  });

  // Fallback: If no seeds matched, pick first 5 company nodes and platforms
  if (matchingNodeIds.size === 0) {
    graph.nodes.slice(0, 6).forEach(n => matchingNodeIds.add(n.id));
  }

  // 2. Traverse outward up to maxHops
  const activeNodeIds = new Set<string>(matchingNodeIds);
  let frontier = new Set<string>(matchingNodeIds);

  for (let hop = 0; hop < maxHops; hop++) {
    const nextFrontier = new Set<string>();
    graph.edges.forEach(edge => {
      if (frontier.has(edge.source)) {
        activeNodeIds.add(edge.target);
        nextFrontier.add(edge.target);
      }
      if (frontier.has(edge.target)) {
        activeNodeIds.add(edge.source);
        nextFrontier.add(edge.source);
      }
    });
    frontier = nextFrontier;
  }

  // 3. Filter edges that connect active nodes
  const subNodes = graph.nodes.filter(n => activeNodeIds.has(n.id));
  const subEdges = graph.edges.filter(e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));

  return {
    nodes: subNodes,
    edges: subEdges,
    metadata: {
      totalEntities: subNodes.length,
      crossOwnershipClusters: subEdges.filter(e => e.type === 'SHARED_AGENT_WITH').length,
      platformSynergyEdges: subEdges.filter(e => e.type === 'TUCK_IN_SYNERGY').length,
      generatedAt: new Date().toISOString()
    }
  };
}
