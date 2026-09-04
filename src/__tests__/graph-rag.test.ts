import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Lead } from '../types';
import { buildKnowledgeGraph, extractSubGraph } from '../utils/graphBuilder';
import { executeGraphRagQuery } from '../services/graphRagService';

const mockLeads: Lead[] = [
  {
    id: 'lead-1',
    name: 'Stockton Precision HVAC Inc.',
    industry: 'HVAC',
    location: 'Stockton, CA',
    entityAge: 28,
    permitDrop: 42,
    exitPropensityScore: 8.8,
    status: 'qualified',
    agentName: 'Arthur Pendelton',
    revenue: 4200000,
    ebitda: 850000,
    valuationEstimate: 3825000,
    createdAt: new Date().toISOString()
  },
  {
    id: 'lead-2',
    name: 'Central Valley Refrigeration LLC',
    industry: 'HVAC',
    location: 'Stockton, CA',
    entityAge: 19,
    permitDrop: 35,
    exitPropensityScore: 7.9,
    status: 'new',
    agentName: 'Arthur Pendelton', // Shared owner with lead-1!
    revenue: 2800000,
    ebitda: 520000,
    valuationEstimate: 2340000,
    createdAt: new Date().toISOString()
  },
  {
    id: 'lead-3',
    name: 'Modesto Master Plumbing & Pipe',
    industry: 'Plumbing',
    location: 'Modesto, CA',
    entityAge: 31,
    permitDrop: 48,
    exitPropensityScore: 9.1,
    status: 'qualified',
    agentName: 'Robert Hernandez',
    revenue: 3100000,
    ebitda: 680000,
    valuationEstimate: 3060000,
    createdAt: new Date().toISOString()
  }
];

describe('Deal Knowledge Graph Construction & Ontology', () => {
  it('constructs an ontology graph with COMPANY, OWNER, JURISDICTION, TRADE, and PLATFORM nodes', () => {
    const graph = buildKnowledgeGraph(mockLeads);
    assert.ok(graph.nodes.length > 0, 'Graph should contain nodes');
    assert.ok(graph.edges.length > 0, 'Graph should contain edges');

    const companyNodes = graph.nodes.filter(n => n.type === 'COMPANY');
    assert.strictEqual(companyNodes.length, 3, 'Should create 3 company nodes');

    const ownerNodes = graph.nodes.filter(n => n.type === 'OWNER');
    assert.ok(ownerNodes.some(o => o.label === 'Arthur Pendelton'));
    assert.ok(ownerNodes.some(o => o.label === 'Robert Hernandez'));

    const platformNodes = graph.nodes.filter(n => n.type === 'PLATFORM');
    assert.ok(platformNodes.length >= 2, 'Should include default strategic PE platforms');
  });

  it('detects hidden cross-ownership (SHARED_AGENT_WITH) when companies share an agent', () => {
    const graph = buildKnowledgeGraph(mockLeads);
    const sharedAgentEdges = graph.edges.filter(e => e.type === 'SHARED_AGENT_WITH');
    
    assert.ok(sharedAgentEdges.length > 0, 'Should detect shared agent between Stockton Precision HVAC and Central Valley Refrigeration');
    const edge = sharedAgentEdges[0];
    assert.ok(edge.source.includes('lead-1') || edge.source.includes('lead-2'));
    assert.ok(edge.target.includes('lead-1') || edge.target.includes('lead-2'));
    assert.ok(edge.label.includes('Arthur Pendelton'));
  });

  it('links companies to platform roll-up vehicles via TUCK_IN_SYNERGY edges', () => {
    const graph = buildKnowledgeGraph(mockLeads);
    const synergyEdges = graph.edges.filter(e => e.type === 'TUCK_IN_SYNERGY');
    assert.ok(synergyEdges.length > 0, 'Should find tuck-in synergy edges between HVAC/Plumbing targets and platforms');
  });
});

describe('Multi-Hop Subgraph Extraction Engine', () => {
  it('extracts targeted multi-hop neighborhood for specific entity query keywords', () => {
    const graph = buildKnowledgeGraph(mockLeads);
    const subGraph = extractSubGraph(graph, 'Pendelton', 2);

    assert.ok(subGraph.nodes.length > 0, 'Subgraph should contain nodes related to Pendelton');
    const hasArthur = subGraph.nodes.some(n => n.label.includes('Pendelton'));
    assert.ok(hasArthur, 'Subgraph must contain the searched owner');
    
    // Connected companies should also be in the multi-hop subgraph
    const hasCompany = subGraph.nodes.some(n => n.type === 'COMPANY');
    assert.ok(hasCompany, 'Multi-hop expansion must include connected companies');
  });
});

describe('Graph-RAG Deterministic Reasoning Engine', () => {
  it('executes Graph-RAG query and returns structured topological citations and PE recommendations', async () => {
    const graph = buildKnowledgeGraph(mockLeads);
    const result = await executeGraphRagQuery('Detect hidden cross-ownership clusters across our pipeline', graph);

    assert.ok(result.executiveSummary.length > 0, 'Executive summary should not be empty');
    assert.ok(result.citedNodeIds.length > 0, 'Result must cite specific graph nodes');
    assert.ok(result.actionableNextSteps.length > 0, 'Must provide actionable PE next steps');
    assert.ok(result.traversalPath.length > 0, 'Must record multi-hop traversal paths');
    assert.ok(result.confidenceScore >= 80, 'Confidence score should be >= 80');
  });
});
