import { dbManager } from '../db/index';
import { verifyFinancialMultipleSanity } from '../financialGuard';
import { outboxManager } from '../outbox';
import { auditLedger } from '../auditLedger';
import { SalesforceAgentforceConnector } from '../../src/utils/salesforceAgentforce';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: 'initialize' | 'tools/list' | 'tools/call';
  params?: Record<string, any>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class FastMcpServer {
  private serverInfo = {
    name: 'silver-scout-fastmcp',
    version: '2.4.0',
    protocolVersion: '2025-06-18'
  };

  public getTools(): McpToolDefinition[] {
    return [
      {
        name: 'search_acquisition_leads',
        description: 'Search tenant-isolated acquisition targets by industry, minimum EBITDA, or exit propensity score.',
        inputSchema: {
          type: 'object',
          properties: {
            fundId: { type: 'string', description: 'Tenant Fund ID' },
            industry: { type: 'string', description: 'Optional industry filter (e.g., HVAC, Plumbing)' },
            minEbitda: { type: 'number', description: 'Minimum EBITDA in USD' }
          },
          required: ['fundId']
        }
      },
      {
        name: 'audit_cim_financials',
        description: 'Verify target valuation multiple and Quality of Earnings (QofE) assertions with deterministic guardrails.',
        inputSchema: {
          type: 'object',
          properties: {
            fundId: { type: 'string', description: 'Tenant Fund ID' },
            targetName: { type: 'string', description: 'Company name' },
            enterpriseValue: { type: 'string', description: 'Valuation (e.g., $4.56M)' },
            reportedEbitda: { type: 'string', description: 'Reported EBITDA (e.g., $800k)' },
            claimedMultiple: { type: 'string', description: 'Claimed multiple (e.g., 5.7x)' }
          },
          required: ['fundId', 'targetName', 'enterpriseValue', 'reportedEbitda', 'claimedMultiple']
        }
      },
      {
        name: 'sync_lead_to_salesforce_dmo',
        description: 'Map a lead to Salesforce Data Cloud Zero-Copy DMO format and enqueue a durable outbox sync job.',
        inputSchema: {
          type: 'object',
          properties: {
            fundId: { type: 'string', description: 'Tenant Fund ID' },
            leadId: { type: 'string', description: 'Lead identifier' },
            companyName: { type: 'string', description: 'Company legal name' },
            industry: { type: 'string', description: 'Primary industry' },
            location: { type: 'string', description: 'Headquarters city/state' },
            ebitda: { type: 'number', description: 'Verified EBITDA' }
          },
          required: ['fundId', 'leadId', 'companyName']
        }
      },
      {
        name: 'verify_audit_ledger_integrity',
        description: 'Verify SHA-256 cryptographic hash chain integrity for a tenant fund.',
        inputSchema: {
          type: 'object',
          properties: {
            fundId: { type: 'string', description: 'Tenant Fund ID' }
          },
          required: ['fundId']
        }
      }
    ];
  }

  public async handleRpc(request: JsonRpcRequest, authorizedFundId: string, actorId: string = 'mcp_agent'): Promise<JsonRpcResponse> {
    if (request.jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        id: request.id ?? null,
        error: { code: -32600, message: 'Invalid JSON-RPC version; expected 2.0' }
      };
    }

    if (request.method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: this.serverInfo.protocolVersion,
          serverInfo: this.serverInfo,
          capabilities: { tools: { listChanged: false } }
        }
      };
    }

    if (request.method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: { tools: this.getTools() }
      };
    }

    if (request.method === 'tools/call') {
      const toolName = request.params?.name;
      const args = request.params?.arguments || {};

      // Enforce Zero-Trust Tenant Boundary on MCP tool execution
      if (args.fundId && args.fundId !== authorizedFundId) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32001,
            message: `Cross-tenant MCP tool call blocked: token scoped to ${authorizedFundId}, requested ${args.fundId}`
          }
        };
      }

      const targetFundId = authorizedFundId;

      try {
        switch (toolName) {
          case 'search_acquisition_leads': {
            let leads = await dbManager.getLeadsByFund(targetFundId);
            if (args.industry) {
              leads = leads.filter(l => l.industry?.toLowerCase().includes(String(args.industry).toLowerCase()));
            }
            if (typeof args.minEbitda === 'number') {
              leads = leads.filter(l => (l.ebitda || 0) >= args.minEbitda);
            }
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{ type: 'text', text: JSON.stringify({ fundId: targetFundId, count: leads.length, leads }) }],
                isError: false
              }
            };
          }

          case 'audit_cim_financials': {
            const check = verifyFinancialMultipleSanity({
              enterpriseValue: String(args.enterpriseValue),
              reportedEbitda: String(args.reportedEbitda),
              claimedMultiple: String(args.claimedMultiple)
            });

            auditLedger.recordEvent({
              fundId: targetFundId,
              dealId: String(args.targetName),
              action: 'MCP_CIM_FINANCIAL_AUDIT',
              actorId,
              actorRole: 'analyst',
              payload: { targetName: args.targetName, valid: check.valid, calculatedMultiple: check.calculatedMultiple }
            });

            return {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{ type: 'text', text: JSON.stringify(check) }],
                isError: false
              }
            };
          }

          case 'sync_lead_to_salesforce_dmo': {
            const leadMock: any = {
              id: String(args.leadId),
              name: String(args.companyName),
              industry: String(args.industry || 'Commercial Services'),
              location: String(args.location || 'Austin, TX'),
              ebitda: Number(args.ebitda || 1200000),
              revenue: Number(args.ebitda || 1200000) * 4,
              exitPropensityScore: 8.7,
              status: 'qualified',
              permitDrop: -24,
              registrationDate: '1994-05-12'
            };

            const dmo = SalesforceAgentforceConnector.mapLeadToDataCloudDMO(leadMock);
            const outboxRecord = outboxManager.createOutboxRecord(
              targetFundId,
              leadMock.id,
              'SYNC_CRM_DEAL',
              { dmo, syncedBy: actorId },
              'salesforce_data_cloud'
            );

            return {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{ type: 'text', text: JSON.stringify({ dmo, outboxId: outboxRecord.outboxId, status: outboxRecord.status }) }],
                isError: false
              }
            };
          }

          case 'verify_audit_ledger_integrity': {
            const verification = auditLedger.verifyChainIntegrity(targetFundId);
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [{ type: 'text', text: JSON.stringify(verification) }],
                isError: false
              }
            };
          }

          default:
            return {
              jsonrpc: '2.0',
              id: request.id,
              error: { code: -32601, message: `Unknown MCP tool: ${toolName}` }
            };
        }
      } catch (err: any) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32603, message: err.message || 'Internal MCP tool execution error' }
        };
      }
    }

    return {
      jsonrpc: '2.0',
      id: request.id ?? null,
      error: { code: -32601, message: `Method not found: ${request.method}` }
    };
  }
}

export const fastMcpServer = new FastMcpServer();
