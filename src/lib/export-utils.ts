import * as XLSX from 'xlsx';
import { Lead } from '@/types/crm';

/**
 * Generates and downloads the branded Excel Template (.xlsx)
 * Title: "Master Ads Injection Lead Batch"
 */
export function downloadExcelTemplate(): void {
  const templateData = [
    {
      'Company Name': 'Nexus Digital Media',
      'Contact Name': 'Samantha Reed',
      'Email': 'samantha@nexusdigital.io',
      'Phone': '+1 (415) 890-1234',
      'Preferred Channel': 'WhatsApp',
      'Website / Social': 'https://nexusdigital.io',
      'Notes': 'Scale e-commerce brand looking for ROAS audit and creative injection.'
    },
    {
      'Company Name': 'Apex Flow Logistics',
      'Contact Name': 'David Sterling',
      'Email': 'd.sterling@apexflow.co',
      'Phone': '+1 (312) 555-0199',
      'Preferred Channel': 'Email',
      'Website / Social': 'https://apexflow.co',
      'Notes': 'Currently spending $40k/mo on Meta Ads with fatigued ad angles.'
    },
    {
      'Company Name': 'Vanguard Health Tech',
      'Contact Name': 'Dr. Marcus Vance',
      'Email': 'marcus@vanguardhealth.io',
      'Phone': '+44 20 7946 0912',
      'Preferred Channel': 'WhatsApp',
      'Website / Social': 'https://vanguardhealth.io',
      'Notes': 'B2B SaaS seeking outbound agency partner for LinkedIn & Meta pipeline.'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Column width hints
  worksheet['!cols'] = [
    { wch: 26 }, // Company Name
    { wch: 22 }, // Contact Name
    { wch: 28 }, // Email
    { wch: 22 }, // Phone
    { wch: 18 }, // Preferred Channel
    { wch: 30 }, // Website / Social
    { wch: 45 }  // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Ads Injection Leads');

  XLSX.writeFile(workbook, 'Master_Ads_Injection_Lead_Batch_Template.xlsx');
}

/**
 * Exports current leads to CSV file
 */
export function exportLeadsToCsv(leads: Lead[], filename: string = 'master_ads_injection_leads.csv'): void {
  const rows = leads.map(l => ({
    'ID': l.id,
    'Company': l.company_name,
    'Contact': l.contact_name,
    'Email': l.email,
    'Phone': l.phone,
    'Channel': l.channel,
    'Stage': l.stage,
    'Deal Value': l.deal_value,
    'Original Hunter': l.hunter?.full_name || l.original_hunter_id,
    'Hunter Phone': l.hunter?.phone || '',
    'Current Assignee': l.assignee?.full_name || l.current_assignee_id,
    'Cadence Step': `Step ${l.cadence_step}`,
    'Last Reaction': l.last_client_reaction,
    'DNC': l.is_dnc ? 'YES' : 'NO',
    'Created At': l.created_at
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
