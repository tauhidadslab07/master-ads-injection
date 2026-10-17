'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/context/app-context';
import { Lead, DuplicateCheckResult, OutreachChannel } from '@/types/crm';
import { 
  X, 
  AlertTriangle, 
  ExternalLink, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  DollarSign, 
  Check, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  editLead?: Lead | null;
}

export function CreateLeadModal({ isOpen, onClose, editLead }: CreateLeadModalProps) {
  const { checkDuplicate, createLead, updateLead, setSelectedLead, setIsLeadDrawerOpen, currentUser } = useApp();

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [channel, setChannel] = useState<OutreachChannel>('whatsapp');
  const [dealValue, setDealValue] = useState('25000');
  
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

  // Initialize or reset form
  useEffect(() => {
    if (editLead) {
      setCompanyName(editLead.company_name);
      setContactName(editLead.contact_name);
      setEmail(editLead.email);
      setPhone(editLead.phone);
      setWebsite(editLead.website || '');
      setChannel(editLead.channel);
      setDealValue(String(editLead.deal_value || 25000));
    } else {
      setCompanyName('');
      setContactName('');
      setEmail('');
      setPhone('');
      setWebsite('');
      setChannel('whatsapp');
      setDealValue('25000');
    }
    setAllowDuplicateAnyway(false);
    setSubmitError(null);
    setDuplicateResult({ isDuplicate: false, matches: [], offendingFields: {} });
  }, [editLead, isOpen]);

  // Real-time debounced deduplication scanner as user types
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      if (phone.trim() || email.trim() || companyName.trim().length >= 3) {
        setIsChecking(true);
        const res = await checkDuplicate(phone, email, companyName, editLead?.id);
        setDuplicateResult(res);
        setIsChecking(false);
      } else {
        setDuplicateResult({ isDuplicate: false, matches: [], offendingFields: {} });
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [phone, email, companyName, isOpen, editLead?.id, checkDuplicate]);

  if (!isOpen) return null;

  const isDuplicateActive = duplicateResult.isDuplicate;
  const isSubmitDisabled = isDuplicateActive && !allowDuplicateAnyway;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!companyName.trim() || !contactName.trim() || !phone.trim() || !email.trim()) {
      setSubmitError('Please fill in all mandatory fields (Company, Contact, Phone, Email).');
      return;
    }

    if (editLead) {
      updateLead(editLead.id, {
        company_name: companyName.trim(),
        contact_name: contactName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        website: website.trim(),
        channel,
        deal_value: Number(dealValue) || 25000
      });
      onClose();
    } else {
      const result = createLead(
        {
          company_name: companyName.trim(),
          contact_name: contactName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          website: website.trim(),
          channel,
          deal_value: Number(dealValue) || 25000,
          original_hunter_id: currentUser.id
        },
        allowDuplicateAnyway
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
    // Find matching lead in state or by id and open in drawer
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
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {editLead ? 'Edit Lead Record' : 'Create New Outreach Lead'}
              </h2>
              <p className="text-xs text-slate-400">
                Real-time multi-field E.164 phone, email & brand deduplication
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
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Company Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Company / Brand Name *</span>
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
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Luminary Athletic Wear"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                duplicateResult.offendingFields.company
                  ? 'border-amber-500/80 ring-2 ring-amber-500/30'
                  : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
              }`}
            />
          </div>

          {/* Contact Person Name */}
          <div>
            <label className="font-semibold text-slate-300 flex items-center space-x-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Contact Person Name *</span>
            </label>
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Jessica Thorne"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
            />
          </div>

          {/* Phone & Email Dual Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Phone */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Phone (E.164) *</span>
                </label>
                {duplicateResult.offendingFields.phone && (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/50">
                    <span>⚠️ Duplicate</span>
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (415) 890-1234"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                  duplicateResult.offendingFields.phone
                    ? 'border-amber-500/80 ring-2 ring-amber-500/30'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                }`}
              />
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Address *</span>
                </label>
                {duplicateResult.offendingFields.email && (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/50">
                    <span>⚠️ Duplicate</span>
                  </span>
                )}
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jessica@luminaryathletics.com"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                  duplicateResult.offendingFields.email
                    ? 'border-amber-500/80 ring-2 ring-amber-500/30'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                }`}
              />
            </div>

          </div>

          {/* Outreach Channel & Est Deal Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="font-semibold text-slate-300 mb-1.5 block">
                Primary Outreach Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    channel === 'whatsapp'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>💬 WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    channel === 'email'
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>📧 Email</span>
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 flex items-center space-x-1.5 mb-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>Est. Retainer Value ($/mo)</span>
              </label>
              <input
                type="number"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                placeholder="25000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>

          </div>

          {/* Website / Ad Library URL */}
          <div>
            <label className="font-semibold text-slate-300 flex items-center space-x-1.5 mb-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Brand Website or Meta Ad Library URL</span>
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://luminaryathletics.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
            />
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
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-700 bg-slate-900"
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
                  : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25 active:scale-95'
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
