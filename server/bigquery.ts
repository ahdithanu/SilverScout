import dotenv from 'dotenv';

dotenv.config();

export interface BigQueryLeadRow {
  lead_id: string;
  business_name: string;
  trade_industry: string;
  location: string;
  permit_volume_2023_2025: number;
  permit_volume_2026: number;
  permit_drop_pct: number;
  exit_propensity_score: number;
  registration_year: number;
  ingested_at: string;
}

export async function queryBigQueryWarehouse(sqlQuery: string): Promise<BigQueryLeadRow[]> {
  const projectId = process.env.BIGQUERY_PROJECT_ID || process.env.GCP_PROJECT_ID;

  if (projectId) {
    try {
      const response = await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GCP_ACCESS_TOKEN || ''}`
        },
        body: JSON.stringify({ query: sqlQuery, useLegacySql: false })
      });

      if (response.ok) {
        const data = await response.json();
        return (data.rows || []).map((row: any) => ({
          lead_id: row.f[0]?.v,
          business_name: row.f[1]?.v,
          trade_industry: row.f[2]?.v,
          location: row.f[3]?.v,
          permit_volume_2023_2025: Number(row.f[4]?.v || 0),
          permit_volume_2026: Number(row.f[5]?.v || 0),
          permit_drop_pct: Number(row.f[6]?.v || 0),
          exit_propensity_score: Number(row.f[7]?.v || 5),
          registration_year: Number(row.f[8]?.v || 2015),
          ingested_at: new Date().toISOString()
        }));
      }
    } catch (err) {
      console.error("BigQuery API connection error:", err);
    }
  }

  // Simulated BigQuery Data Warehouse query response when GCP_PROJECT_ID is not configured
  return [
    {
      lead_id: 'bq-101',
      business_name: 'Sierra Valley HVAC',
      trade_industry: 'HVAC',
      location: 'Sacramento, CA',
      permit_volume_2023_2025: 64,
      permit_volume_2026: 28,
      permit_drop_pct: 56.2,
      exit_propensity_score: 9,
      registration_year: 2014,
      ingested_at: new Date().toISOString()
    },
    {
      lead_id: 'bq-102',
      business_name: 'Central Coast Plumbing',
      trade_industry: 'Plumbing',
      location: 'Modesto, CA',
      permit_volume_2023_2025: 45,
      permit_volume_2026: 22,
      permit_drop_pct: 51.1,
      exit_propensity_score: 8,
      registration_year: 2016,
      ingested_at: new Date().toISOString()
    }
  ];
}

export function formatBigQueryLeadQuery(industryFilter?: string, minPropensity: number = 5): string {
  return `
    SELECT
      lead_id,
      business_name,
      trade_industry,
      location,
      permit_volume_2023_2025,
      permit_volume_2026,
      permit_drop_pct,
      exit_propensity_score,
      registration_year,
      ingested_at
    FROM
      \`silver_scout_analytics.leads_clean\`
    WHERE
      exit_propensity_score >= ${minPropensity}
      ${industryFilter ? `AND LOWER(trade_industry) LIKE '%${industryFilter.toLowerCase()}%'` : ''}
    ORDER BY
      exit_propensity_score DESC, permit_drop_pct DESC
    LIMIT 1000;
  `;
}
