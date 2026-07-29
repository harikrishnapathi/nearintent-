import React, { useState } from 'react';
import { X, Lock, CheckCircle2, ShieldCheck, DollarSign, Upload, AlertTriangle } from 'lucide-react';
import { EscrowContract, Milestone } from '../types';

interface EscrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: EscrowContract | null;
  onReleaseMilestone: (contractId: string, milestoneId: string) => void;
}

export const EscrowModal: React.FC<EscrowModalProps> = ({
  isOpen,
  onClose,
  contract,
  onReleaseMilestone
}) => {
  if (!isOpen || !contract) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl text-slate-100 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Smart Escrow Contract</h2>
              <p className="text-xs text-slate-400">Funds held securely in Near Intent Escrow Vault</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contract Summary */}
        <div className="p-6 space-y-6">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Intent Title</span>
              <h3 className="font-bold text-sm text-slate-100">{contract.intentTitle}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>Client: <strong className="text-white">{contract.clientName}</strong></span>
                <span>•</span>
                <span>Provider: <strong className="text-white">{contract.providerName}</strong></span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Escrow Total</span>
              <span className="text-2xl font-black text-emerald-400">${contract.totalAmount} {contract.currency}</span>
            </div>
          </div>

          {/* Milestones List */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-200">Milestone Deliverables</h4>
            
            {contract.milestones.map((ms) => (
              <div
                key={ms.id}
                className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4"
              >
                <div>
                  <h5 className="font-semibold text-xs text-slate-100">{ms.title}</h5>
                  {ms.deliverableNote && (
                    <p className="text-[11px] text-slate-400 italic mt-0.5">{ms.deliverableNote}</p>
                  )}
                  <span className="text-xs font-bold text-emerald-400 block mt-1">${ms.amount} USD</span>
                </div>

                <div>
                  {ms.status === 'released' ? (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" /> Released
                    </span>
                  ) : ms.status === 'submitted' ? (
                    <button
                      onClick={() => onReleaseMilestone(contract.id, ms.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-md shadow-emerald-600/20"
                    >
                      Approve & Release ${ms.amount}
                    </button>
                  ) : (
                    <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                      Funds In Vault
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
