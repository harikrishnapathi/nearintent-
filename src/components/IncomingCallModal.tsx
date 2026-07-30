import React from 'react';
import { Phone, PhoneOff, Video, ShieldCheck, Sparkles } from 'lucide-react';
import { CallSignal } from '../types';

interface IncomingCallModalProps {
  call: CallSignal | null;
  onAccept: (call: CallSignal) => void;
  onDecline: (call: CallSignal) => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  onAccept,
  onDecline
}) => {
  if (!call || call.status !== 'calling') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl text-center text-white space-y-6 animate-bounce-subtle">
        
        {/* Ringing Indicator */}
        <div className="relative inline-block">
          <div className="absolute -inset-3 bg-indigo-500/20 rounded-full animate-ping" />
          <img
            src={call.callerAvatar}
            alt={call.callerName}
            className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500 shadow-xl relative z-10 mx-auto"
          />
          <span className="absolute bottom-0 right-0 z-20 bg-emerald-500 p-2 rounded-full border-2 border-slate-900 shadow-lg">
            {call.type === 'video' ? <Video className="w-4 h-4 text-white" /> : <Phone className="w-4 h-4 text-white" />}
          </span>
        </div>

        {/* Call Info */}
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Incoming {call.type === 'video' ? 'Video' : 'Voice'} Call
          </span>
          <h3 className="text-xl font-black text-white">{call.callerName}</h3>
          <p className="text-xs text-indigo-300 font-medium truncate max-w-xs mx-auto">
            Intent: "{call.intentTitle}"
          </p>
        </div>

        {/* Security Badge */}
        <div className="bg-slate-950/80 border border-slate-800 py-2 px-4 rounded-xl text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encrypted Near Intent P2P Connection</span>
        </div>

        {/* Accept / Decline Action Buttons */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onDecline(call)}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <PhoneOff className="w-4 h-4" />
            Decline
          </button>

          <button
            onClick={() => onAccept(call)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 animate-pulse"
          >
            <Phone className="w-4 h-4" />
            Accept Call
          </button>
        </div>

      </div>
    </div>
  );
};
