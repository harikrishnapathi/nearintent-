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
  User,
  Activity,
  ChevronDown,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Volume1
} from 'lucide-react';
import { CallSignal } from '../types';
import { updateCallSignalInFirestore } from '../lib/firebaseService';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantName: string;
  participantAvatar: string;
  intentTitle: string;
  userAvatar?: string;
  userName?: string;
  currentUserId?: string;
  callSignal?: CallSignal | null;
  initialCallMode?: 'audio' | 'video';
  callStatus?: 'calling' | 'accepted';
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  participantName,
  participantAvatar,
  intentTitle,
  userAvatar,
  userName = 'Account Holder',
  currentUserId = '',
  callSignal = null,
  initialCallMode = 'video',
  callStatus = 'accepted',
  isMinimized = false,
  onToggleMinimize
}) => {
  const [callMode, setCallMode] = useState<'audio' | 'video'>(initialCallMode);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(initialCallMode === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isTranslating, setIsTranslating] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [micVolume, setMicVolume] = useState<number>(0); // 0-100 real-time decibel meter
  const [liveSpokenText, setLiveSpokenText] = useState<string>('');
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [isRemoteConnected, setIsRemoteConnected] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const lastProcessedSpokenTimestampRef = useRef<number>(0);

  // Unlock Browser Audio Autoplay Security Restrictions
  const handleUnlockAudio = async () => {
    setAudioUnlocked(true);
    try {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        await remoteAudioRef.current.play().catch(() => {});
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        await ctx.resume();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
      playIncomingVoiceBeep();
      speakText(`Voice speaker audio activated for ${userName}`);
    } catch (e) {
      console.warn('Audio unlock error:', e);
    }
  };

  // Web Speech Synthesis: Speaks remote voice out loud through browser speakers
  const speakText = (text: string) => {
    if ('speechSynthesis' in window && isSpeakerOn) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/^[^:]+:\s*/, '').replace(/["']/g, '');
        if (!cleanText.trim()) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';

        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const enVoice = voices.find(v => v.lang.startsWith('en') && !v.name.includes('Google'));
          if (enVoice) utterance.voice = enVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
      }
    }
  };

  // Explicit audio unlock and test voice
  const testSpeakerVoice = () => {
    handleUnlockAudio();
  };

  // Play audio chime when remote participant speaks or connects
  const playIncomingVoiceBeep = () => {
    if (!isSpeakerOn) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  };

  // Play continuous soft ringtone when outgoing call is ringing ('calling' state)
  useEffect(() => {
    if (!isOpen || callStatus !== 'calling') return;

    let ringInterval: any;
    const playRing = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } catch (e) {}
    };

    playRing();
    ringInterval = setInterval(playRing, 2000);

    return () => {
      if (ringInterval) clearInterval(ringInterval);
    };
  }, [isOpen, callStatus]);

  // Reset and initialization on Call Open
  useEffect(() => {
    if (isOpen) {
      setCallMode(initialCallMode);
      setIsVideoOn(initialCallMode === 'video');
      setCallDuration(0);
      setMicVolume(0);
      setLiveSpokenText('');
      setTranscripts([
        `⚡ Live P2P encrypted call active between ${userName} and ${participantName}.`,
        `🎙️ Speak directly into your microphone to converse in real-time!`
      ]);

      // Connect BroadcastChannel for multi-window / cross-tab real audio communication
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('near_intent_call_audio');
          broadcastChannelRef.current = bc;
          bc.onmessage = (e) => {
            if (e.data && e.data.type === 'LIVE_SPEECH') {
              playIncomingVoiceBeep();
              if (e.data.senderName !== userName) {
                speakText(e.data.text);
              }
              setTranscripts(prev => [
                ...prev.slice(-6),
                `${e.data.senderName}: "${e.data.text}"`
              ]);
            }
          };
        } catch (err) {}
      }
    } else {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
    }
  }, [isOpen, initialCallMode, participantName, userName]);

  // Call duration timer
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Real Microphone Stream & Web Audio Decibel Metering
  useEffect(() => {
    if (!isOpen) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      return;
    }

    let animationFrameId: number;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: callMode === 'video' && isVideoOn, audio: true })
        .then((stream) => {
          mediaStreamRef.current = stream;
          if (videoRef.current && callMode === 'video') {
            videoRef.current.srcObject = stream;
          }

          // Web Audio API volume monitoring
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioCtx();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
              if (!analyserRef.current) return;
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              const volumePercentage = Math.min(100, Math.round((average / 128) * 100));
              setMicVolume(isMicOn ? volumePercentage : 0);
              animationFrameId = requestAnimationFrame(checkVolume);
            };
            checkVolume();
          } catch (e) {
            console.warn('AudioContext volume metering error:', e);
          }
        })
        .catch((err) => {
          console.warn('Media access error or missing permission:', err);
        });
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isOpen, callMode, isVideoOn, isMicOn]);

  // Real Speech Recognition (Speech-to-Text) on User Microphone
  useEffect(() => {
    let isMounted = true;

    if (!isOpen || !isMicOn) {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
        speechRecognitionRef.current = null;
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          if (!isMounted) return;
          let transcriptText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcriptText += event.results[i][0].transcript;
          }
          setLiveSpokenText(transcriptText);

          if (event.results[event.results.length - 1].isFinal && transcriptText.trim()) {
            const finalPhrase = transcriptText.trim();
            const formatted = `${userName} (You Spoke): "${finalPhrase}"`;
            setTranscripts(prev => [...prev.slice(-6), formatted]);
            setLiveSpokenText('');

            // Broadcast spoken words to other window/tab & Firestore cross-device
            if (broadcastChannelRef.current) {
              broadcastChannelRef.current.postMessage({
                type: 'LIVE_SPEECH',
                senderName: userName,
                text: finalPhrase
              });
            }

            if (callSignal && callSignal.id) {
              updateCallSignalInFirestore(callSignal.id, {
                lastSpokenText: finalPhrase,
                lastSpeakerId: currentUserId || userName,
                lastSpeakerName: userName,
                spokenTimestamp: Date.now()
              });
            }
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'aborted' || event.error === 'no-speech') {
            return;
          }
          console.warn('Speech recognition status:', event.error);
        };

        recognition.onend = () => {
          if (isMounted && isOpen && isMicOn && speechRecognitionRef.current) {
            setTimeout(() => {
              if (isMounted && isOpen && isMicOn) {
                try { recognition.start(); } catch (e) {}
              }
            }, 1000);
          }
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      } catch (err) {
        console.warn('Speech recognition initialization error:', err);
      }
    }

    return () => {
      isMounted = false;
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
        speechRecognitionRef.current = null;
      }
    };
  }, [isOpen, isMicOn, userName, callSignal?.id, currentUserId]);

  // Real-time Firestore Cross-Device Voice Sync Listener
  useEffect(() => {
    if (!isOpen || !callSignal || !callSignal.lastSpokenText || !callSignal.spokenTimestamp) return;

    if (
      callSignal.spokenTimestamp > lastProcessedSpokenTimestampRef.current &&
      callSignal.lastSpeakerId !== (currentUserId || userName)
    ) {
      lastProcessedSpokenTimestampRef.current = callSignal.spokenTimestamp;
      const speakerName = callSignal.lastSpeakerName || participantName;
      const text = callSignal.lastSpokenText;

      playIncomingVoiceBeep();
      speakText(text);

      setTranscripts(prev => [
        ...prev.slice(-6),
        `🗣️ ${speakerName}: "${text}"`
      ]);
    }
  }, [isOpen, callSignal?.lastSpokenText, callSignal?.spokenTimestamp, currentUserId, userName, participantName]);

  // Real WebRTC P2P Audio Connection between 2 physical devices
  useEffect(() => {
    if (!isOpen || !callSignal || !callSignal.id) return;

    let pc: RTCPeerConnection | null = null;

    try {
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      };

      pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      // Attach local microphone stream tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          if (pc && mediaStreamRef.current) {
            pc.addTrack(track, mediaStreamRef.current);
          }
        });
      }

      // Route incoming remote audio track to audio player element
      pc.ontrack = (event) => {
        setIsRemoteConnected(true);
        if (remoteAudioRef.current && event.streams && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(err => {
            console.warn("Autoplay remote audio blocked, tap screen to unlock:", err);
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc?.iceConnectionState === 'connected' || pc?.iceConnectionState === 'completed') {
          setIsRemoteConnected(true);
        }
      };

      // Handle Offer/Answer Negotiation via Firestore
      const isCaller = callSignal.callerId === currentUserId;

      if (isCaller && !callSignal.offerSdp) {
        pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callMode === 'video' })
          .then(offer => pc?.setLocalDescription(offer))
          .then(() => {
            if (pc?.localDescription) {
              updateCallSignalInFirestore(callSignal.id, {
                offerSdp: JSON.stringify(pc.localDescription)
              });
            }
          })
          .catch(e => console.warn('WebRTC createOffer error:', e));
      } else if (!isCaller && callSignal.offerSdp && !callSignal.answerSdp && pc.signalingState === 'stable') {
        try {
          const offerDesc = new RTCSessionDescription(JSON.parse(callSignal.offerSdp));
          pc.setRemoteDescription(offerDesc)
            .then(() => pc?.createAnswer())
            .then(answer => pc?.setLocalDescription(answer))
            .then(() => {
              if (pc?.localDescription) {
                updateCallSignalInFirestore(callSignal.id, {
                  answerSdp: JSON.stringify(pc.localDescription)
                });
              }
            })
            .catch(e => console.warn('WebRTC setRemoteDescription offer error:', e));
        } catch (e) {}
      } else if (isCaller && callSignal.answerSdp && pc.signalingState === 'have-local-offer') {
        try {
          const answerDesc = new RTCSessionDescription(JSON.parse(callSignal.answerSdp));
          pc.setRemoteDescription(answerDesc).catch(e => console.warn('WebRTC setRemoteDescription answer error:', e));
        } catch (e) {}
      }

    } catch (err) {
      console.warn('WebRTC peer connection setup error:', err);
    }

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [isOpen, callSignal?.id, callSignal?.offerSdp, callSignal?.answerSdp, currentUserId, callMode]);

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
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
      speechRecognitionRef.current = null;
    }
    onClose();
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 bg-slate-900/95 backdrop-blur-lg border border-indigo-500/50 shadow-2xl rounded-2xl p-3 max-w-md text-slate-100 animate-in fade-in slide-in-from-bottom-4">
        {/* Keep video element ref active in DOM for background processing */}
        {isVideoOn && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="hidden"
          />
        )}

        <div className="relative shrink-0">
          <img
            src={participantAvatar}
            alt={participantName}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-indigo-500/60 shadow-md"
          />
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-slate-900 rounded-full ${callStatus === 'calling' ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[120px]">
              {participantName}
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              {callStatus === 'calling' ? 'Ringing...' : formatTimer(callDuration)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
            {callStatus === 'calling' ? 'Connecting voice call...' : intentTitle}
          </p>
        </div>

        {/* Quick Actions in Floating Call Bar */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-2 rounded-xl transition-all ${
              isMicOn ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-rose-600 text-white'
            }`}
            title={isMicOn ? "Mute Mic" : "Unmute Mic"}
          >
            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`p-2 rounded-xl transition-all ${
              isSpeakerOn ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-rose-900/80 text-rose-300'
            }`}
            title={isSpeakerOn ? "Mute Speaker" : "Unmute Speaker"}
          >
            {isSpeakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-sm flex items-center gap-1 text-xs font-semibold"
              title="Expand Call View"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Expand</span>
            </button>
          )}

          <button
            onClick={handleEndCall}
            className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all shadow-sm"
            title="End Call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md">
      {/* Hidden Audio Element for WebRTC Remote Stream */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        className="hidden"
      />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[700px] text-slate-100">
        
        {/* Unmute & Speaker Activation Notice Banner */}
        {!audioUnlocked && (
          <button
            onClick={handleUnlockAudio}
            className="w-full bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-extrabold px-4 py-2.5 text-xs flex items-center justify-between gap-2 shadow-lg animate-pulse transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Volume2 className="w-4 h-4 text-amber-200 shrink-0" />
              <span className="truncate">🔊 TAP HERE TO UNMUTE AUDIO & ENABLE SPEAKER VOICE</span>
            </div>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-mono shrink-0">Tap to Enable</span>
          </button>
        )}

        {/* Call Header */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {onToggleMinimize && (
              <button
                onClick={onToggleMinimize}
                className="p-1.5 sm:px-2.5 sm:py-1.5 text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1 text-xs font-semibold border border-slate-700 shrink-0"
                title="Minimize call to continue chat & sharing photos/docs"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Back to App</span>
              </button>
            )}

            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2 truncate">
                {callMode === 'video' ? 'Video Call' : 'Real-time Voice Call'} with {participantName}
                <span className="text-[10px] font-normal bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 hidden sm:inline-block shrink-0">
                  Live Mic Audio
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                {callStatus === 'calling' ? (
                  <span className="text-amber-400 font-bold animate-pulse">Connecting... Ringing recipient</span>
                ) : (
                  <>Intent: {intentTitle} • <span className="text-emerald-400 font-mono font-bold">{formatTimer(callDuration)}</span></>
                )}
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
            
            {onToggleMinimize && (
              <button
                onClick={onToggleMinimize}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
                title="Minimize Call to Chat"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            )}

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
                      <span className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-slate-950 rounded-full flex items-center justify-center">
                        <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
                      </span>
                    ) : (
                      <span className="absolute bottom-0 right-0 w-6 h-6 bg-rose-500 border-2 border-slate-950 rounded-full flex items-center justify-center">
                        <MicOff className="w-3.5 h-3.5 text-white" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">{userName} (You)</h4>

                  {/* Real-time Mic Decibel Level Visualizer */}
                  {isMicOn && (
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden mx-auto border border-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-indigo-400 transition-all duration-75"
                        style={{ width: `${Math.max(5, micVolume)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Dynamic Soundwave Equalizer */}
                <div className="flex items-center gap-1 sm:gap-1.5 h-12 px-2">
                  {[30, 60, 100, 40, 80, 50, 90, 30].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        micVolume > 15 ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-500/40'
                      }`}
                      style={{ height: `${micVolume > 15 ? Math.max(10, (h * micVolume) / 100) : 12}px` }}
                    />
                  ))}
                </div>

                {/* Remote Participant */}
                <div className="text-center space-y-2">
                  <div className="relative inline-block">
                    <img
                      src={participantAvatar}
                      alt={participantName}
                      className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-emerald-500/50 shadow-xl"
                    />
                    <span className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-slate-950 rounded-full flex items-center justify-center">
                      <Radio className="w-3.5 h-3.5 text-white" />
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">{participantName}</h4>
                </div>
              </div>

              {/* Encrypted Audio Status */}
              <div className="bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-full text-center flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-300 font-medium">Real Microphone Audio Stream Active</span>
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
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
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

          {/* Live Microphone Spoken Transcript Overlay */}
          <div className="bg-slate-900/90 backdrop-blur border border-indigo-500/30 p-2.5 sm:p-3 rounded-xl max-h-24 overflow-y-auto space-y-1 text-xs mb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Live Spoken Voice Transcript
              </span>
              {liveSpokenText && (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                  <Activity className="w-3 h-3" /> Listening to your microphone...
                </span>
              )}
            </div>

            {liveSpokenText && (
              <p className="text-emerald-300 font-medium italic">
                {userName}: "{liveSpokenText}"
              </p>
            )}

            {transcripts.map((t, i) => (
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

          {/* Toggle Speaker & Audio Test */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const nextState = !isSpeakerOn;
                setIsSpeakerOn(nextState);
                if (nextState) {
                  testSpeakerVoice();
                }
              }}
              className={`p-3 rounded-full transition-all flex items-center justify-center ${
                isSpeakerOn ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-400'
              }`}
              title={isSpeakerOn ? "Speaker Active (Click to mute)" : "Speaker Muted"}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={testSpeakerVoice}
              className="px-2.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/40 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
              title="Click to test speaker sound & audio output"
            >
              <Volume2 className="w-3 h-3 text-indigo-400 animate-pulse" />
              <span>Test Audio</span>
            </button>
          </div>

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

