'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/app-context';
import { 
  X, 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  AlertOctagon, 
  CheckCircle2, 
  Flame, 
  Sparkles,
  Phone
} from 'lucide-react';

interface TeamRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeamRosterModal({ isOpen, onClose }: TeamRosterModalProps) {
  const { teamMembers, currentUser, toggleDeputy, triggerEmergencyLeave } = useApp();

  const [leaveConfirmId, setLeaveConfirmId] = useState<string | null>(null);
  const [reassignResult, setReassignResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const isLeader = currentUser.role === 'team_leader';

  const handleConfirmLeave = async (memberId: string) => {
    setIsProcessing(true);
    const res = await triggerEmergencyLeave(memberId);
    setIsProcessing(false);
    setLeaveConfirmId(null);
    if (res.success) {
      setReassignResult(`✅ Emergency Leave Activated! Reassigned ${res.reassignedCount} open leads round-robin across active members. Original hunter attribution strictly preserved.`);
    }
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
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Agency Team Roster & Deputy Gate
              </h2>
              <p className="text-xs text-slate-400">
                Deputy delegation, trusted hunter streaks & round-robin emergency reassignments
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {reassignResult && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{reassignResult}</span>
            </div>
          )}

          {/* Trusted Mode Legend */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-slate-300 flex items-start space-x-3">
            <Flame className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-cyan-300 text-xs">
                ⭐ Trusted Hunter Mode Policy:
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Hunters achieving <strong>20 consecutive approvals</strong> unlock automatic approval with a <strong>10% random quality review sample</strong>. Rejections reset the streak.
              </p>
            </div>
          </div>

          {/* Members Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Member</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Approval Streak</th>
                  <th className="p-3">Deputy Status</th>
                  <th className="p-3 text-right">Emergency Leave</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                {teamMembers.map((m) => {
                  const isTrusted = m.consecutive_approvals >= 20 || m.is_trusted_hunter;

                  return (
                    <tr key={m.id} className={m.on_leave ? 'opacity-40 bg-slate-950' : 'hover:bg-slate-800/30'}>
                      <td className="p-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-xs">
                            {m.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{m.full_name}</p>
                            <p className="text-[10px] text-slate-400">{m.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300">
                          {m.role.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-white text-xs">
                            {m.consecutive_approvals}
                          </span>
                          {isTrusted ? (
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-600/50 px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                              <span>⭐ Trusted</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">
                              ({20 - m.consecutive_approvals} to Trusted)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        {isLeader && m.id !== currentUser.id ? (
                          <button
                            type="button"
                            onClick={() => toggleDeputy(m.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              m.is_deputy
                                ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-sm'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {m.is_deputy ? '🛡️ Deputy Active' : '+ Make Deputy'}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">
                            {m.is_deputy ? '🛡️ Deputy' : '—'}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {m.on_leave ? (
                          <span className="text-[11px] font-bold text-rose-400">On Leave (Reassigned)</span>
                        ) : isLeader && m.id !== currentUser.id ? (
                          <button
                            type="button"
                            onClick={() => setLeaveConfirmId(m.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-950 border border-rose-800/60 text-rose-300 font-semibold text-[11px] transition-colors"
                          >
                            🚨 Emergency Leave
                          </button>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* Confirmation Modal for Emergency Leave Reassignment */}
      {leaveConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-rose-600/80 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2.5 text-rose-400 font-bold text-sm">
              <AlertOctagon className="w-5 h-5 text-rose-500" />
              <span>Confirm Emergency Leave & Lead Reassignment</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will invoke <code>trigger_emergency_leave_and_reassign</code>. All open leads assigned to this member will be distributed <strong>equally (round-robin)</strong> across all other active members.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-cyan-300">
              ✓ Strict Attribution Guarantee: <code>original_hunter_id</code> is permanently retained for commission credit.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setLeaveConfirmId(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleConfirmLeave(leaveConfirmId)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30"
              >
                {isProcessing ? 'Reassigning...' : 'Confirm & Execute Round-Robin'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
