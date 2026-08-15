import { Lead } from '../types';

export function parseCSVRawText(text: string): Partial<Lead>[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return [];
  }

  const parseRow = (line: string) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let char of line) {
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase());

  const findHeaderIndex = (keys: string[]) => {
    return headers.findIndex(h => keys.some(k => h.includes(k)));
  };

  const nameIdx = findHeaderIndex(['business name', 'company name', 'name', 'company', 'business']);
  const industryIdx = findHeaderIndex(['industry', 'sector', 'type']);
  const locationIdx = findHeaderIndex(['location', 'city', 'address', 'state']);
  const revenueIdx = findHeaderIndex(['revenue', 'sales']);
  const ebitdaIdx = findHeaderIndex(['ebitda', 'earnings', 'profit']);
  const marginIdx = findHeaderIndex(['margin']);
  const dropIdx = findHeaderIndex(['permit', 'drop']);
  const agentIdx = findHeaderIndex(['agent', 'owner', 'contact']);
  const tagsIdx = findHeaderIndex(['tag', 'tags', 'category']);

  const parsed: Partial<Lead>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    const cleanVal = (idx: number) => (idx !== -1 && row[idx] !== undefined) ? row[idx] : '';

    const name = cleanVal(nameIdx) || `Imported Target #${i}`;
    const industry = cleanVal(industryIdx) || 'General Trade';
    const location = cleanVal(locationIdx) || 'California, CA';
    const revenue = parseFloat(cleanVal(revenueIdx)) || undefined;
    const ebitda = parseFloat(cleanVal(ebitdaIdx)) || undefined;
    const profitMargin = parseFloat(cleanVal(marginIdx)) || undefined;
    const permitDrop = parseFloat(cleanVal(dropIdx)) || 25;
    const agentName = cleanVal(agentIdx) || 'Business Owner';
    const rawTags = cleanVal(tagsIdx);
    const tags = rawTags ? rawTags.split(';').map(t => t.trim().toLowerCase()) : ['imported'];

    parsed.push({
      name,
      industry,
      location,
      agentName,
      isCorporateAgent: false,
      permitVolume2023_2025: 40,
      permitVolume2026: Math.round(40 * (1 - permitDrop / 100)),
      permitDrop,
      lastDigitalPostDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reviewVelocity: 0,
      exitPropensityScore: permitDrop >= 35 ? 9 : permitDrop >= 20 ? 7 : 5,
      aiThesis: `Target identified via batch CSV import. ${permitDrop}% permit volume decrease in 2026 indicating owner retirement transition opportunity.`,
      valuationEstimate: revenue ? Math.round(revenue * 0.8) : (ebitda ? Math.round(ebitda * 4.5) : 2500000),
      revenue,
      ebitda,
      profitMargin,
      tags,
      status: 'new'
    });
  }
  return parsed;
}
