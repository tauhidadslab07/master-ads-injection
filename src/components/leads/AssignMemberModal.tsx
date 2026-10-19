'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/app-context';
import { OutreachChannel, TeamMember } from '@/types/crm';
import { 
  Users, 
  X, 
  Search, 
  Check, 
  MessageSquare, 
  Mail, 
  Sparkles, 
  Crown, 
  UserCheck, 
  ArrowRight,
  ShieldCheck,
  Flame,
  Lock
} from 'lucide-react';

interface AssignMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadIds: string[];
  mode: 'audit' | 'sales';
  onSuccess: (msg: string) => void;
}

export function AssignMemberModal({
  isOpen,
  onClose,
  leadIds,
  mode,
  onSuccess
}: AssignMemberModalProps) {
  const { currentUser, teamMembers, bulkAssignAuditor, bulkAssignLead, leads } = useApp();
  const [searchMember, setSearchMember] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<OutreachChannel>('whatsapp');

  if (!isOpen || leadIds.length === 0) return null;

  // Strict Leader-Only Guard
  if (currentUser.role !== 'team_leader') {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden p-6 text-center space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">🔒 শুধুমাত্র টিম লিডারের পারমিশন রয়েছে</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              লিড স্টোর বা অডিটেড লিড থেকে কোনো মেম্বারকে অডিট বা সেলসের জন্য এসাইন করার ক্ষমতা শুধুমাত্র টিম লিডার (তৌহিদ)-এর রয়েছে।
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    );
  }

  // Selected leads companies for quick visual confirmation
  const selectedLeads = leads.filter(l => leadIds.includes(l.id));

  // Filter members
  const filteredMembers = teamMembers.filter(m => {
    if (!searchMember.trim()) return true;
    const q = searchMember.toLowerCase().trim();
    return m.full_name.toLowerCase().includes(q) || m.username.toLowerCase().includes(q);
  });

  const handleAssignToMember = (member: TeamMember) => {
    const count = leadIds.length;
    if (mode === 'audit') {
      bulkAssignAuditor(leadIds, member.id);
      onSuccess(`🔍 ${count}টি লিড সফলভাবে ${member.full_name}-কে অডিটের জন্য এসাইন করা হয়েছে এবং "2. Audited Lead" সেকশনে পাঠানো হয়েছে!`);
    } else {
      bulkAssignLead(leadIds, member.id, selectedChannel);
      onSuccess(`🚀 ${count}টি অডিটকৃত লিড সফলভাবে ${member.full_name}-কে ${selectedChannel.toUpperCase()} মেসেজ পাঠানোর জন্য হস্তান্তর করা হয়েছে! মেম্বারের ড্যাশবোর্ডে লাইভ দেখতে পাবেন।`);
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-5 border-b border-slate-800 flex items-center justify-between ${
          mode === 'audit' ? 'bg-amber-950/30' : 'bg-emerald-950/30'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-lg ${
              mode === 'audit' 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-amber-950/50' 
                : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-emerald-950/50'
            }`}>
              <UserCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center space-x-2">
                <span>
                  {mode === 'audit' 
                    ? 'অডিটর নির্ধারণ করুন (Assign Auditor)' 
                    : 'সেলস মেম্বার নির্বাচন করুন (Assign for Sales)'}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                  mode === 'audit' 
                    ? 'bg-amber-500 text-slate-950' 
                    : 'bg-emerald-500 text-slate-950'
                }`}>
                  {leadIds.length} Leads
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'audit'
                  ? 'সিলেক্ট করা লিডগুলোর অডিট শেষ করার জন্য যেকোনো মেম্বারকে নির্ধারণ করুন।'
                  : 'অডিট কমপ্লিট লিডগুলোতে WhatsApp বা Email পাঠাতে সেলস মেম্বার নির্বাচন করুন।'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Leads Badges Preview */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-xs">
          <span className="font-bold text-slate-400 shrink-0 text-[11px] uppercase tracking-wider">সিলেক্টেড লিড:</span>
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
            {selectedLeads.slice(0, 5).map(l => (
              <span key={l.id} className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs shrink-0 font-medium">
                {l.company_name}
              </span>
            ))}
            {selectedLeads.length > 5 && (
              <span className="text-xs text-slate-400 shrink-0 font-bold">
                +{selectedLeads.length - 5} more
              </span>
            )}
          </div>
        </div>

        {/* Channel Selection (Only for Sales mode) */}
        {mode === 'sales' && (
          <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">মেসেজিং চ্যানেল নির্ধারণ করুন:</span>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold space-x-1">
              <button
                type="button"
                onClick={() => setSelectedChannel('whatsapp')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                  selectedChannel === 'whatsapp'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp 💬</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedChannel('email')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                  selectedChannel === 'email'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email ✉️</span>
              </button>
            </div>
          </div>
        )}

        {/* Member Search */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              placeholder="মেম্বারের নাম লিখে খুঁজুন (Search team member)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
            />
          </div>
        </div>

        {/* Member Cards Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 max-h-[50vh]">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              onClick={() => handleAssignToMember(member)}
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900 transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99] shadow-sm"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-black shrink-0 ${
                  member.role === 'team_leader'
                    ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                    : 'bg-slate-900 border-slate-700 text-cyan-400 group-hover:border-cyan-500'
                }`}>
                  {member.role === 'team_leader' ? (
                    <Crown className="w-5 h-5 text-amber-400" />
                  ) : (
                    member.full_name.charAt(0)
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {member.full_name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      member.role === 'team_leader'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {member.role === 'team_leader' ? '👑 Leader' : 'Specialist'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    @{member.username} • <span className="text-amber-400 font-bold inline-flex items-center"><Flame className="w-3 h-3 mr-0.5 text-amber-400" />{member.consecutive_approvals} Approvals</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssignToMember(member);
                }}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shrink-0 ml-3 ${
                  mode === 'audit'
                    ? 'bg-amber-500/20 group-hover:bg-amber-500 border border-amber-500/50 text-amber-300 group-hover:text-slate-950 shadow-amber-950/30'
                    : 'bg-emerald-500/20 group-hover:bg-emerald-500 border border-emerald-500/50 text-emerald-300 group-hover:text-slate-950 shadow-emerald-950/30'
                }`}
              >
                <span>এসাইন করুন</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>মেম্বারের নামের উপর ক্লিক করলেই সাথে সাথে এসাইন সম্পন্ন হবে।</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
