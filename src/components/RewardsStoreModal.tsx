import React from 'react';
import { X, Coins, Zap, Crown, ShieldCheck, Cpu, CheckCircle2 } from 'lucide-react';
import { RedeemItem } from '../types';

interface RewardsStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoins: number;
  items: RedeemItem[];
  onRedeem: (item: RedeemItem) => void;
}

export const RewardsStoreModal: React.FC<RewardsStoreModalProps> = ({
  isOpen,
  onClose,
  userCoins,
  items,
  onRedeem
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl text-slate-100 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Near Coins Store</h2>
              <p className="text-xs text-slate-400">
                You have <strong className="text-emerald-400 font-bold">{userCoins} Near Coins</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          {items.map((item) => {
            const canAfford = userCoins >= item.coinCost;
            return (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3 hover:border-emerald-500/40 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {item.badgeTag}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      {item.coinCost} NC
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-100">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                </div>

                <button
                  onClick={() => onRedeem(item)}
                  disabled={!canAfford}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    canAfford
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {canAfford ? 'Redeem Item' : 'Insufficient Coins'}
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
