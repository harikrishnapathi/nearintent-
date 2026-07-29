import React, { useState } from 'react';
import {
  Shield,
  Users,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  DollarSign
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [usersList, setUsersList] = useState([
    { id: 'u1', name: 'Marcus Chen', role: 'Collaborator', trust: 96, status: 'Pending Verification', flagged: false },
    { id: 'u2', name: 'Dr. Priya Sharma', role: 'Healthcare Hero', trust: 100, status: 'Verified', flagged: false },
    { id: 'u3', name: 'Devon Vance', role: 'Developer', trust: 94, status: 'Verified', flagged: false },
    { id: 'u4', name: 'Spam Bot AI', role: 'Unknown', trust: 12, status: 'Flagged Fraud', flagged: true }
  ]);

  const handleApprove = (id: string) => {
    setUsersList(prev => prev.map(u => u.id === id ? { ...u, status: 'Verified', flagged: false } : u));
  };

  const handleBlock = (id: string) => {
    setUsersList(prev => prev.map(u => u.id === id ? { ...u, status: 'Blocked', flagged: true } : u));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-bold text-white">Governance & Moderation Dashboard</h1>
        </div>
        <p className="text-xs text-slate-400">
          Monitor platform intent integrity, identity verifications, fraud detection, and overall ecosystem health.
        </p>
      </div>

      {/* High-level Platform Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Active Real-Time Intents</span>
          <div className="text-2xl font-black text-indigo-400 mt-1">1,420</div>
          <span className="text-[10px] text-emerald-400 font-medium">↑ 18% this week</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Intent Resolution Rate</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">98.4%</div>
          <span className="text-[10px] text-slate-400">Avg resolution: 14 mins</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Protected Escrow Volume</span>
          <div className="text-2xl font-black text-amber-400 mt-1">$142,500</div>
          <span className="text-[10px] text-slate-400">0 dispute interventions</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Fraud Detection Flags</span>
          <div className="text-2xl font-black text-rose-400 mt-1">1 Flagged</div>
          <span className="text-[10px] text-slate-400">Auto-isolated by AI</span>
        </div>

      </div>

      {/* Moderation & Verification Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          Pending User Identity Verifications & Fraud Review
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Trust Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-100">{u.name}</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">{u.trust}%</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      u.status === 'Verified'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : u.flagged
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleApprove(u.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-semibold"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleBlock(u.id)}
                      className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded text-xs font-semibold"
                    >
                      Block
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
