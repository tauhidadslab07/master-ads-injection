'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '@/lib/context/app-context';
import { Lead } from '@/types/crm';
import { downloadExcelTemplate } from '@/lib/export-utils';
import { normalizePhone } from '@/lib/phone-utils';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert,
  ArrowRight,
  ClipboardPaste,
  FileCheck
} from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  channel: 'whatsapp' | 'email';
  website: string;
  deal_value: number;
  inBatchDup: boolean;
  dbDup: boolean;
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const { leads, batchImportLeads } = useApp();

  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [autoSkipDuplicates, setAutoSkipDuplicates] = useState(true);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedDuplicates: number;
    inBatchDuplicates: number;
  } | null>(null);

  if (!isOpen) return null;

  // Process and scan parsed rows using Two-Tier deduplication engine
  const scanRows = (rows: Partial<Lead>[]) => {
    const seenPhonesInBatch = new Set<string>();
    const seenEmailsInBatch = new Set<string>();

    const processed: ParsedRow[] = rows.map((r, index) => {
      const phone_e164 = normalizePhone(r.phone || '');
      const emailLower = (r.email || '').toLowerCase().trim();
      const companyLower = (r.company_name || '').toLowerCase().trim();

      // Tier 1: In-batch repeats
      let inBatchDup = false;
      if ((phone_e164 && seenPhonesInBatch.has(phone_e164)) || (emailLower && seenEmailsInBatch.has(emailLower))) {
        inBatchDup = true;
      }
      if (phone_e164) seenPhonesInBatch.add(phone_e164);
      if (emailLower) seenEmailsInBatch.add(emailLower);

      // Tier 2: Database duplicates
      const dbDup = leads.some(l => {
        const pMatch = phone_e164 && l.phone_e164 === phone_e164;
        const eMatch = emailLower && l.email.toLowerCase().trim() === emailLower;
        const cMatch = companyLower.length >= 3 && l.company_name.toLowerCase().trim() === companyLower;
        return pMatch || eMatch || cMatch;
      });

      return {
        id: `parsed-${index}`,
        company_name: r.company_name || `Company ${index + 1}`,
        contact_name: r.contact_name || 'Contact Person',
        email: r.email || '',
        phone: r.phone || '',
        channel: (r.channel as any) === 'email' ? 'email' : 'whatsapp',
        website: r.website || '',
        deal_value: Number(r.deal_value) || 25000,
        inBatchDup,
        dbDup
      };
    });

    setParsedRows(processed);
  };

  // Handle Excel (.xlsx) file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

        const rows: Partial<Lead>[] = jsonData.map(item => ({
          company_name: item['Company Name'] || item['Company'] || item['company'] || '',
          contact_name: item['Contact Name'] || item['Contact'] || item['contact'] || item['Name'] || '',
          email: item['Email'] || item['email'] || '',
          phone: item['Phone'] || item['phone'] || '',
          channel: String(item['Preferred Channel'] || item['Channel'] || 'whatsapp').toLowerCase().includes('email') ? 'email' : 'whatsapp',
          website: item['Website / Social'] || item['Website'] || '',
          deal_value: 25000
        }));

        scanRows(rows);
      } catch (err) {
        console.error('Error parsing excel:', err);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Handle direct text/CSV paste
  const handlePasteParse = () => {
    if (!rawText.trim()) return;

    const lines = rawText.trim().split('\n');
    const rows: Partial<Lead>[] = [];

    for (const line of lines) {
      // Split by tab, comma, or semicolon
      const parts = line.split(/[\t,;]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2) {
        // Assume format: Company, Contact, Email, Phone
        rows.push({
          company_name: parts[0] || 'Unknown Company',
          contact_name: parts[1] || 'Contact',
          email: parts[2] || '',
          phone: parts[3] || '',
          channel: (parts[4] && parts[4].toLowerCase().includes('email')) ? 'email' : 'whatsapp',
          deal_value: 25000
        });
      }
    }

    scanRows(rows);
  };

  // Calculate duplicate stats
  const totalDuplicates = useMemo(() => {
    return parsedRows.filter(r => r.inBatchDup || r.dbDup).length;
  }, [parsedRows]);

  const freshRecordsCount = useMemo(() => {
    return parsedRows.filter(r => !r.inBatchDup && !r.dbDup).length;
  }, [parsedRows]);

  const handleImportSubmit = () => {
    const leadsToImport = parsedRows.map(r => ({
      company_name: r.company_name,
      contact_name: r.contact_name,
      email: r.email,
      phone: r.phone,
      channel: r.channel,
      website: r.website,
      deal_value: r.deal_value
    }));

    const result = batchImportLeads(leadsToImport, autoSkipDuplicates);
    setImportResult(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Bulk Lead & Excel Importer
              </h2>
              <p className="text-xs text-slate-400">
                Two-tier engine: In-batch repeats & database deduplication scanner
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* One-click Download Excel Template Button */}
            <button
              onClick={downloadExcelTemplate}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-cyan-300 transition-colors"
              title="Download Excel Template (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">📥 Download Template (.xlsx)</span>
              <span className="sm:hidden">Template</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Success summary if imported */}
          {importResult && (
            <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-slate-200 space-y-2 animate-in fade-in">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Batch Import Successfully Processed!</span>
              </div>
              <p className="text-xs text-emerald-200">
                ✓ <strong>{importResult.importedCount}</strong> fresh leads imported into Pending Approval queue.
                {importResult.skippedDuplicates > 0 && ` • ${importResult.skippedDuplicates} database duplicates auto-skipped.`}
                {importResult.inBatchDuplicates > 0 && ` • ${importResult.inBatchDuplicates} in-batch repeats auto-pruned.`}
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  Done & View Leads
                </button>
              </div>
            </div>
          )}

          {/* DEDUPLICATION TWO-TIER SCANNER TOP BANNER */}
          {parsedRows.length > 0 && totalDuplicates > 0 && !importResult && (
            <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/60 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center space-x-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                <div>
                  <p className="font-bold text-xs text-amber-300">
                    ⚠️ {totalDuplicates} Duplicate Contact(s) Detected
                  </p>
                  <p className="text-[11px] text-amber-200/80">
                    Found {parsedRows.filter(r => r.inBatchDup).length} in-batch repeat(s) and {parsedRows.filter(r => r.dbDup).length} database collision(s).
                  </p>
                </div>
              </div>

              {/* Auto-skip toggle */}
              <label className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-amber-500/50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoSkipDuplicates}
                  onChange={(e) => setAutoSkipDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-700 bg-slate-900"
                />
                <span className="text-xs font-semibold text-amber-300">
                  [x] Auto-skip duplicates ({freshRecordsCount} fresh records ready)
                </span>
              </label>
            </div>
          )}

          {/* Input Method Tabs / Dropzone */}
          {!importResult && parsedRows.length === 0 && (
            <div className="space-y-4">
              
              {/* File Upload Zone */}
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-8 text-center bg-slate-950/40 transition-colors">
                <FileSpreadsheet className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white mb-1">
                  Upload Excel (.xlsx) or CSV File
                </h3>
                <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">
                  Drag and drop your spreadsheet or click to browse. The two-tier scanner will automatically normalize E.164 phone numbers and flag conflicts.
                </p>
                
                <label className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95 transition-all">
                  <UploadCloud className="w-4 h-4" />
                  <span>Choose Spreadsheet File</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Or Quick Paste */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                    <ClipboardPaste className="w-3.5 h-3.5 text-slate-400" />
                    <span>Or Direct Paste (Company, Contact, Email, Phone per line)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRawText(
                        `Apex Digital Agency, Sarah Connor, sconnor@apexdigital.io, +1 (415) 890-1234, WhatsApp\n` +
                        `Nova Growth Labs, David Miller, dmiller@novagrowth.co, +1 (312) 555-0999, Email\n` +
                        `Luminary Athletic Wear, Jessica Duplicate, jessica@luminaryathletics.com, +1 (415) 890-1234, WhatsApp`
                      );
                    }}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Paste Sample Demo Data
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Apex Digital Agency, Sarah Connor, sconnor@apexdigital.io, +1 (415) 890-1234, WhatsApp"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handlePasteParse}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                >
                  Parse & Scan Pasted Records
                </button>
              </div>

            </div>
          )}

          {/* Parsed Records Table Preview */}
          {parsedRows.length > 0 && !importResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">
                  Parsed Records Preview ({parsedRows.length} total)
                </span>
                <button
                  onClick={() => setParsedRows([])}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Clear & Re-upload
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Company</th>
                      <th className="p-2.5">Contact</th>
                      <th className="p-2.5">Phone</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Channel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50 text-slate-300">
                    {parsedRows.map((row) => {
                      const isDup = row.inBatchDup || row.dbDup;
                      return (
                        <tr 
                          key={row.id} 
                          className={isDup ? 'bg-amber-950/20 text-amber-200/90' : 'hover:bg-slate-800/40'}
                        >
                          <td className="p-2.5">
                            {row.dbDup ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                ⚠️ DB Dup
                              </span>
                            ) : row.inBatchDup ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                ⚠️ Batch Repeat
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                ✨ Fresh
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-semibold text-white">{row.company_name}</td>
                          <td className="p-2.5">{row.contact_name}</td>
                          <td className="p-2.5 font-mono">{row.phone}</td>
                          <td className="p-2.5 font-mono">{row.email}</td>
                          <td className="p-2.5 capitalize">{row.channel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center space-x-1.5 active:scale-95 transition-all"
                >
                  <FileCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    Import {autoSkipDuplicates ? freshRecordsCount : parsedRows.length} Leads
                  </span>
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
