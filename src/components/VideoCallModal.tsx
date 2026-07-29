import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Sparkles,
  Languages,
  Phone,
  Volume2,
  VolumeX,
  ShieldCheck,
  Radio,
  User
} from 'lucide-react';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantName: string;
  participantAvatar: string;
  intentTitle: string;
  userAvatar?: string;
  userName?: string;
  initialCallMode?: 'audio' | 'video';
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  participantName,
  participantAvatar,
  intentTitle,
  userAvatar,
  userName = 'Account Holder',
  initialCallMode = 'video'
}) => {
  const [callMode, setCallMode] = useState<'audio' | 'video'>(initialCallMode);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(initialCallMode === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isTranslating, setIsTranslating] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Sync initial mode
  useEffect(() => {
    if (isOpen) {
      setCallMode(initialCallMode);
      setIsVideoOn(initialCallMode === 'video');
      setCallDuration(0);
      setTranscripts([
        `${userName}: Connected to encrypted call with ${participantName}.`,
        `${participantName}: Hello! Ready to discuss ${intentTitle}.`
      ]);
    }
  }, [isOpen, initialCallMode, participantName, intentTitle, userName]);

  // Call duration timer
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Handle webcam video stream
  useEffect(() => {
    if (!isOpen) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      return;
    }

    if (callMode === 'video' && isVideoOn) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then((stream) => {
            mediaStreamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch((err) => {
            console.warn('Camera access not granted or unavailable:', err);
          });
      }
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isOpen, callMode, isVideoOn]);

  // AI Subtitle Generator simulation
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const phrases = [
        `${participantName}: I can help execute the tasks outlined in ${intentTitle}.`,
        `${userName}: Sounds great! Let's align on scope and escrow terms.`,
        `${participantName}: Agreed! Let's get started.`,
        `[AI Subtitle Translated]: "¡Perfecto! Todo está listo para comenzar la colaboración."`
      ];
      setTranscripts(prev => {
        if (prev.length >= 6) return prev;
        return [...prev, phrases[prev.length - 2] || `${participantName}: Audio feed active and clear.`];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, participantName, intentTitle, userName]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[700px] text-slate-100">
        
        {/* Call Header */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2 truncate">
                {callMode === 'video' ? 'Video Call' : 'Voice Call'} with {participantName}
                <span className="text-[10px] font-normal bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 hidden sm:inline-block shrink-0">
                  Secure Call
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                Intent: {intentTitle} • <span className="text-emerald-400 font-mono font-bold">{formatTimer(callDuration)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mode Toggle Switch */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
              <button
                onClick={() => {
                  setCallMode('audio');
                  setIsVideoOn(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  callMode === 'audio' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Voice</span>
              </button>
              <button
                onClick={() => {
                  setCallMode('video');
                  setIsVideoOn(true);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  callMode === 'video' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Video</span>
              </button>
            </div>

            <button
              onClick={() => setIsTranslating(!isTranslating)}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                isTranslating
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Languages className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Translation</span>
            </button>
            
            <button onClick={handleEndCall} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Call View */}
        <div className="flex-1 bg-slate-950 p-3 sm:p-4 relative flex flex-col justify-between overflow-hidden">
          
          {callMode === 'audio' ? (
            /* VOICE CALL INTERFACE */
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 my-auto">
              {/* Participant Avatars in Ring */}
              <div className="flex items-center justify-center gap-8 sm:gap-12 relative">
                
                {/* Local User */}
                <div className="text-center space-y-2">
                  <div className="relative inline-block">
                    <img
                      src={userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}
                      alt={userName}
                      className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-indigo-500/50 shadow-xl"
                    />
                    {isMicOn ? (
                      <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-slate-950 rounded-full flex items-center justify-center">
                        <Mic className="w-3 h-3 text-white" />
                      </span>
                    ) : (
                      <span className="absolute bottom-0 right-0 w-5 h-5 bg-rose-500 border-2 border-slate-950 rounded-full flex items-center justify-center">
                        <MicOff className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">{userName} (You)</h4>
                </div>

                {/* Animated Connecting Soundwave Pulse */}
                <div className="flex items-center gap-1 sm:gap-1.5 h-12 px-2">
                  <div className="w-1.5 bg-indigo-500 rounded-full h-8 animate-bounce" />
                  <div className="w-1.5 bg-indigo-400 rounded-full h-12 animate-pulse" />
                  <div className="w-1.5 bg-purple-500 rounded-full h-6 animate-bounce" />
                  <div className="w-1.5 bg-indigo-500 rounded-full h-10 animate-pulse" />
                  <div className="w-1.5 bg-indigo-400 rounded-full h-7 animate-bounce" />
                </div>

                {/* Remote Participant */}
                <div className="text-center space-y-2">
                  <div className="relative inline-block">
                    <img
                      src={participantAvatar}
                      alt={participantName}
                      className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-emerald-500/50 shadow-xl"
                    />
                    <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-slate-950 rounded-full flex items-center justify-center">
                      <Radio className="w-3 h-3 text-white" />
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">{participantName}</h4>
                </div>
              </div>

              {/* Encrypted Audio Status */}
              <div className="bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-full text-center flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-300 font-medium">Near Intent HD Voice • Low Latency Audio</span>
              </div>
            </div>
          ) : (
            /* VIDEO CALL INTERFACE */
            <div className="flex-1 relative grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-hidden mb-12">
              
              {/* Remote Participant Video Feed */}
              <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center group">
                <img
                  src={participantAvatar}
                  alt={participantName}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-800 text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {participantName} (Remote)
                </div>
              </div>

              {/* Local User Video Feed */}
              <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {isVideoOn ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <img
                      src={userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}
                      className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-indigo-500"
                    />
                    <span className="text-xs text-slate-400 block font-medium">Camera turned off</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-800 text-white">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  {userName} (You)
                </div>
              </div>

            </div>
          )}

          {/* Live AI Subtitles & Transcript Overlay */}
          <div className="bg-slate-900/90 backdrop-blur border border-indigo-500/30 p-2.5 sm:p-3 rounded-xl max-h-20 overflow-y-auto space-y-1 text-xs mb-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Call Transcript & Subtitles
            </span>
            {transcripts.slice(-2).map((t, i) => (
              <p key={i} className="text-slate-200 text-xs font-sans">
                {t}
              </p>
            ))}
          </div>

        </div>

        {/* Call Controls Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-3 sm:gap-6">
          
          {/* Mute/Unmute Mic */}
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-3 rounded-full transition-all flex items-center justify-center ${
              isMicOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
            }`}
            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Toggle Video Camera */}
          <button
            onClick={() => {
              if (callMode === 'audio') {
                setCallMode('video');
                setIsVideoOn(true);
              } else {
                setIsVideoOn(!isVideoOn);
              }
            }}
            className={`p-3 rounded-full transition-all flex items-center justify-center ${
              isVideoOn && callMode === 'video'
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
            }`}
            title={isVideoOn ? "Turn Off Camera" : "Turn On Camera"}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Toggle Speaker */}
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`p-3 rounded-full transition-all flex items-center justify-center ${
              isSpeakerOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-amber-600 text-white'
            }`}
            title={isSpeakerOn ? "Mute Speaker" : "Unmute Speaker"}
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>

        </div>

      </div>
    </div>
  );
};

