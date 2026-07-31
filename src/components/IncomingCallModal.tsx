import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, ShieldCheck, Sparkles, Volume2 } from 'lucide-react';
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<any>(null);

  // Synthesise incoming ringtone sound using Web Audio API
  useEffect(() => {
    if (!call || call.status !== 'calling') return;

    let isStopped = false;

    const playRingtoneChime = () => {
      if (isStopped) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtx();
        }

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.8);
        osc2.stop(ctx.currentTime + 0.8);
      } catch (e) {}
    };

    // Play chime immediately then repeat every 2 seconds
    playRingtoneChime();
    ringtoneIntervalRef.current = setInterval(playRingtoneChime, 2000);

    return () => {
      isStopped = true;
      if (ringtoneIntervalRef.current) {
        clearInterval(ringtoneIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [call?.id, call?.status]);

  if (!call || call.status !== 'calling') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl text-center text-white space-y-6 animate-bounce-subtle">
        
        {/* Ringing Indicator & Avatar */}
        <div className="relative inline-block">
          <div className="absolute -inset-4 bg-indigo-500/20 rounded-full animate-ping" />
          <div className="absolute -inset-2 bg-emerald-500/20 rounded-full animate-pulse" />
          <img
            src={call.callerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}
            alt={call.callerName}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-indigo-500 shadow-xl relative z-10 mx-auto"
          />
          <span className="absolute bottom-0 right-0 z-20 bg-emerald-500 p-2.5 rounded-full border-2 border-slate-900 shadow-lg animate-bounce">
            {call.type === 'video' ? <Video className="w-5 h-5 text-white" /> : <Phone className="w-5 h-5 text-white" />}
          </span>
        </div>

        {/* Call Info Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/40 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Incoming {call.type === 'video' ? 'Video' : 'Voice'} Call
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
              <Volume2 className="w-3 h-3 text-emerald-400 animate-pulse" /> Ringing
            </span>
          </div>
          <h3 className="text-2xl font-black text-white">{call.callerName}</h3>
          <p className="text-xs text-indigo-300 font-medium truncate max-w-xs mx-auto bg-slate-950/60 py-1.5 px-3 rounded-lg border border-slate-800">
            Intent: "{call.intentTitle}"
          </p>
        </div>

        {/* Security Badge */}
        <div className="bg-slate-950/80 border border-slate-800 py-2 px-4 rounded-xl text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encrypted Near Intent P2P WebRTC Connection</span>
        </div>

        {/* Accept / Decline Action Buttons */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onDecline(call)}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <PhoneOff className="w-4.5 h-4.5" />
            Decline
          </button>

          <button
            onClick={() => onAccept(call)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 animate-pulse"
          >
            <Phone className="w-4.5 h-4.5" />
            Accept Call
          </button>
        </div>

      </div>
    </div>
  );
};
