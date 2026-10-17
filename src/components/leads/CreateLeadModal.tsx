'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/context/app-context';
import { Lead, DuplicateCheckResult, OutreachChannel } from '@/types/crm';
import { COUNTRY_CODES, CountryCode, detectCountryFromPhone, formatWithCountryCode } from '@/lib/country-codes';
import { 
  X, 
  AlertTriangle, 
  ExternalLink, 
  Mail, 
  Phone, 
  Globe, 
  Check, 
  ShieldAlert,
  MessageCircle,
  FileText,
  ChevronDown
} from 'lucide-react';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  editLead?: Lead | null;
}

export function CreateLeadModal({ isOpen, onClose, editLead }: CreateLeadModalProps) {
  const { checkDuplicate, createLead, updateLead, setSelectedLead, setIsLeadDrawerOpen, currentUser } = useApp();

  const [companyWebsite, setCompanyWebsite] = useState('');
  const [email, setEmail] = useState('');
  
  // Phone & Country Code
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]); // Default Bangladesh (+880)
  const [rawPhoneNumber, setRawPhoneNumber] = useState('');
  const [initialNote, setInitialNote] = useState('');
  
  // Fail-Safe Lock state
  const [allowDuplicateAnyway, setAllowDuplicateAnyway] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Real-time deduplication check state
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult>({
    isDuplicate: false,
    matches: [],
    offendingFields: {}
  });
  const [isChecking, setIsChecking] = useState(false);

  // Computed Full E.164 Phone number
  const fullPhoneNumber = useMemo(() => {
    return formatWithCountryCode(selectedCountry.dial_code, rawPhoneNumber);
  }, [selectedCountry.dial_code, rawPhoneNumber]);

  // Auto-detect channel based on whether phone or only email is provided
  const autoChannel: OutreachChannel = useMemo(() => {
    if (rawPhoneNumber.trim()) {
      return 'whatsapp';
    }
    return 'email';
  }, [rawPhoneNumber]);

  // Auto-detect country code as user types or pastes phone
  const handlePhoneChange = (val: string) => {
    setRawPhoneNumber(val);
    
    // Check if user pasted/typed a number with country code like +880, +1, +44, 00880
    const detected = detectCountryFromPhone(val);
    if (detected) {
      setSelectedCountry(detected);
    }
  };

  // Initialize or reset form
  useEffect(() => {
    if (editLead) {
      setCompanyWebsite(editLead.website || editLead.company_name || '');
      setEmail(editLead.email || '');
      setRawPhoneNumber(editLead.phone || '');
      setInitialNote('');

      if (editLead.phone) {
        const detected = detectCountryFromPhone(editLead.phone);
        if (detected) setSelectedCountry(detected);
      }
    } else {
      setCompanyWebsite('');
      setEmail('');
      setRawPhoneNumber('');
      setSelectedCountry(COUNTRY_CODES[0]); // Bangladesh (+880) default
      setInitialNote('');
    }
    setAllowDuplicateAnyway(false);
    setSubmitError(null);
    setDuplicateResult({ isDuplicate: false, matches: [], offendingFields: {} });
  }, [editLead, isOpen]);

  // Real-time debounced deduplication scanner as user types
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      const phoneToCheck = fullPhoneNumber.trim();
      const emailToCheck = email.trim();
      const companyToCheck = companyWebsite.trim();

      if (phoneToCheck || emailToCheck || companyToCheck.length >= 3) {
        setIsChecking(true);
        const res = await checkDuplicate(phoneToCheck, emailToCheck, companyToCheck, editLead?.id);
        setDuplicateResult(res);
        setIsChecking(false);
      } else {
        setDuplicateResult({ isDuplicate: false, matches: [], offendingFields: {} });
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [fullPhoneNumber, email, companyWebsite, isOpen, editLead?.id, checkDuplicate]);

  if (!isOpen) return null;

  const isDuplicateActive = duplicateResult.isDuplicate;
  const isSubmitDisabled = isDuplicateActive && !allowDuplicateAnyway;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validation: Company Website is required
    if (!companyWebsite.trim()) {
      setSubmitError('Please enter the Company Website.');
      return;
    }

    // Validation: EITHER WhatsApp Phone OR Email must be provided!
    if (!rawPhoneNumber.trim() && !email.trim()) {
      setSubmitError('Please provide at least one contact channel: WhatsApp Phone or Email Address.');
      return;
    }

    const finalWebsite = companyWebsite.trim();
    const finalCompanyName = companyWebsite.trim();
    const finalContactName = editLead?.contact_name || 'Brand Lead';
    const finalPhone = rawPhoneNumber.trim() ? fullPhoneNumber : '';

    if (editLead) {
      updateLead(editLead.id, {
        company_name: finalCompanyName,
        contact_name: finalContactName,
        email: email.trim(),
        phone: finalPhone,
        website: finalWebsite,
        channel: autoChannel,
        deal_value: editLead.deal_value || 25000
      });
      onClose();
    } else {
      const result = createLead(
        {
          company_name: finalCompanyName,
          contact_name: finalContactName,
          email: email.trim(),
          phone: finalPhone,
          website: finalWebsite,
          channel: autoChannel,
          deal_value: 25000,
          original_hunter_id: currentUser.id
        },
        allowDuplicateAnyway,
        initialNote.trim() || undefined
      );

      if (result.success) {
        onClose();
      } else if (result.error) {
        setSubmitError(result.error);
      }
    }
  };

  const handleDeepLinkToExisting = (matchId: string) => {
    onClose();
    setSelectedLead({ id: matchId } as any);
    setIsLeadDrawerOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {editLead ? 'Edit Outreach Lead' : 'Create New Outreach Lead'}
              </h2>
              <p className="text-xs text-slate-400">
                Upload via WhatsApp or Email with smart country code auto-detection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 flex items-start space-x-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Company Website */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Company Website *</span>
              </label>
              {duplicateResult.offendingFields.company && (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/50">
                  <span>⚠️ Duplicate</span>
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              placeholder="e.g. https://nexusathletics.com or brand.com"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                duplicateResult.offendingFields.company
                  ? 'border-amber-500/80 ring-2 ring-amber-500/30'
                  : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
              }`}
            />
          </div>

          {/* Phone (WhatsApp) with Smart Country Code Selector & Auto-Detection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Phone Number (Upload via WhatsApp)</span>
              </label>
              {duplicateResult.offendingFields.phone && (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/50">
                  <span>⚠️ Duplicate</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Country Code Dropdown */}
              <div className="relative shrink-0">
                <select
                  value={selectedCountry.code}
                  onChange={(e) => {
                    const found = COUNTRY_CODES.find(c => c.code === e.target.value);
                    if (found) setSelectedCountry(found);
                  }}
                  className="px-2.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold appearance-none pr-7 focus:outline-none focus:border-emerald-500"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.dial_code} ({c.name})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Number Input */}
              <input
                type="text"
                value={rawPhoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="e.g. 01712345678 or +8801712..."
                className={`flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-mono ${
                  duplicateResult.offendingFields.phone
                    ? 'border-amber-500/80 ring-2 ring-amber-500/30'
                    : 'border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                }`}
              />
            </div>

            <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Auto-detects country code if typed with +, or uses selected country prefix.</span>
              {rawPhoneNumber.trim() && (
                <span className="font-mono text-emerald-400 font-bold">
                  Formatted: {fullPhoneNumber}
                </span>
              )}
            </p>
          </div>

          {/* Email Address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Email Address (Upload via Email)</span>
              </label>
              {duplicateResult.offendingFields.email && (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/50">
                  <span>⚠️ Duplicate</span>
                </span>
              )}
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jessica@luminaryathletics.com"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                duplicateResult.offendingFields.email
                  ? 'border-amber-500/80 ring-2 ring-amber-500/30'
                  : 'border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              }`}
            />
          </div>

          {/* AUTO-ROUTED CHANNEL INDICATOR PILL */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              Outreach Channel Assignment:
            </span>
            {autoChannel === 'whatsapp' ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-xs font-bold">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>⚡ Auto: 💬 WhatsApp Lead</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/60 text-cyan-300 text-xs font-bold">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>⚡ Auto: 📧 Email Lead</span>
              </span>
            )}
          </div>

          {/* DEDICATED NOTE / CONTEXT SECTION */}
          <div>
            <label className="font-semibold text-slate-300 flex items-center space-x-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Outreach Note / Context (Optional)</span>
            </label>
            <textarea
              rows={3}
              value={initialNote}
              onChange={(e) => setInitialNote(e.target.value)}
              placeholder="Write any note about this lead (e.g. Sourced from TikTok Ads, scaling $30k/mo, looking for creative injection hooks, special requirements)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-100 placeholder-slate-500 text-xs focus:outline-none transition-all leading-relaxed"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              This note will automatically appear at the top of the Lead Activity Timeline.
            </p>
          </div>

          {/* DEDUPLICATION ALERT CARD */}
          {isDuplicateActive && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/60 text-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
                <span>⚠️ Duplicate Lead Found in Pipeline</span>
              </div>

              {/* Matching Lead Previews */}
              <div className="space-y-2">
                {duplicateResult.matches.map((m) => (
                  <div key={m.id} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{m.company_name}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        Stage: {m.stage.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3">
                      <span>Contact: <strong className="text-slate-200">{m.contact_name}</strong></span>
                      <span>Hunter: <strong className="text-slate-200">{m.hunter_name}</strong></span>
                    </div>

                    {/* Matching Reason Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.match_reasons.map((reason, idx) => (
                        <span key={idx} className="text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md">
                          Match: {reason}
                        </span>
                      ))}
                    </div>

                    {/* Deep Link to View Lead */}
                    <div className="pt-1.5">
                      <button
                        type="button"
                        onClick={() => handleDeepLinkToExisting(m.id)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center space-x-1 hover:underline"
                      >
                        <span>🔍 View Existing Lead in Pipeline</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* FAIL-SAFE LOCK TOGGLE */}
              <div className="pt-2 border-t border-amber-900/60">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allowDuplicateAnyway}
                    onChange={(e) => setAllowDuplicateAnyway(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-900"
                  />
                  <span className="text-xs text-amber-200 font-medium">
                    [ ] Allow adding duplicate record anyway (Override Lock)
                  </span>
                </label>
              </div>

            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg ${
                isSubmitDisabled
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 active:scale-95'
              }`}
            >
              {isSubmitDisabled ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚠️ Duplicate Warning Active</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{editLead ? 'Save Changes' : 'Create Lead & Submit'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
