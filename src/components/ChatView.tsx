import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Mic,
  Image as ImageIcon,
  Paperclip,
  Video,
  Phone,
  Languages,
  ShieldCheck,
  Sparkles,
  Bot,
  Play,
  Pause,
  Square,
  ArrowLeft,
  Download,
  FileText,
  FileCode,
  FileArchive,
  File,
  X,
  CheckCircle2,
  Volume2,
  Trash2,
  Ban,
  ShieldAlert,
  UserCheck,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import { ChatThread, ChatMessage, UserProfile, getOtherParticipant } from '../types';

interface ChatViewProps {
  user: UserProfile;
  threads: ChatThread[];
  messagesMap: Record<string, ChatMessage[]>;
  allUsers?: UserProfile[];
  onSendMessage: (
    threadId: string,
    text: string,
    type?: 'text' | 'voice' | 'image' | 'file',
    mediaUrl?: string,
    fileName?: string,
    fileSize?: string,
    voiceDurationSec?: number
  ) => void;
  onStartCall?: (receiverId: string, name: string, avatar: string, title: string, type: 'audio' | 'video') => void;
  onDeleteMessage?: (threadId: string, messageId: string) => void;
  onDeleteThread?: (threadId: string) => void;
  onToggleBlockUser?: (userId: string, userName: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  user,
  threads,
  messagesMap,
  allUsers = [],
  onSendMessage,
  onStartCall,
  onDeleteMessage,
  onDeleteThread,
  onToggleBlockUser
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string>(threads[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [callMode, setCallMode] = useState<'audio' | 'video'>('video');
  const [mobileShowThreadList, setMobileShowThreadList] = useState(true);

  // Deletion & Block modal states
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  // Audio playback state per message id
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Lightbox view for images
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // File input refs
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Voice recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const recordingSecondsRef = useRef<number>(0);

  const activeThread = threads.find(t => t.id === selectedThreadId) || threads[0];
  const activeMessages = activeThread ? messagesMap[activeThread.id] || [] : [];
  const activeOtherParticipant = activeThread ? getOtherParticipant(activeThread, user.id, allUsers) : null;
  const isUserBlocked = activeOtherParticipant ? (user.blockedUserIds || []).includes(activeOtherParticipant.id) : false;

  const handleSelectThread = (id: string) => {
    setSelectedThreadId(id);
    setMobileShowThreadList(false);
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !activeThread) return;

    onSendMessage(activeThread.id, text, 'text');
    if (!textToSend) setInputText('');
  };

  // Real Microphone Audio Recording with MediaRecorder
  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone recording is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      recordingSecondsRef.current = 1;
      setRecordingTimer(1);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const finalDuration = recordingSecondsRef.current || 1;
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          if (activeThread && base64Audio) {
            onSendMessage(
              activeThread.id,
              `🎙️ Voice Note (${finalDuration}s)`,
              'voice',
              base64Audio,
              undefined,
              undefined,
              finalDuration
            );
          }
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecordingVoice(true);

      recordingTimerRef.current = setInterval(() => {
        recordingSecondsRef.current += 1;
        setRecordingTimer(recordingSecondsRef.current);
      }, 1000);
    } catch (err) {
      console.warn('Microphone recording error:', err);
      alert('Microphone access was denied or not available.');
    }
  };

  const stopVoiceRecording = (cancel: boolean = false) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (cancel) {
        mediaRecorderRef.current.onstop = null;
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      } else {
        mediaRecorderRef.current.stop();
      }
    }
    setIsRecordingVoice(false);
  };

  const handleVoiceRecordToggle = () => {
    if (!isRecordingVoice) {
      startVoiceRecording();
    } else {
      stopVoiceRecording(false);
    }
  };

  // Handle Image Attachment Selection
  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeThread) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onSendMessage(
        activeThread.id,
        file.name,
        'image',
        dataUrl,
        file.name,
        `${(file.size / 1024).toFixed(1)} KB`
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle File / Pin Attachment Selection
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeThread) return;

    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onSendMessage(
        activeThread.id,
        file.name,
        'file',
        dataUrl,
        file.name,
        formattedSize
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Toggle Voice Note Playback
  const handleTogglePlayVoice = (msgId: string, url?: string) => {
    if (!url) return;
    if (playingVoiceId === msgId) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingVoiceId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(url);
      audioPlayerRef.current = audio;
      audio.play().catch(err => console.warn('Audio play error:', err));
      setPlayingVoiceId(msgId);
      audio.onended = () => {
        setPlayingVoiceId(null);
      };
    }
  };

  const getFileIcon = (filename?: string) => {
    const ext = filename ? filename.split('.').pop()?.toLowerCase() : '';
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (['zip', 'tar', 'gz', 'rar'].includes(ext || '')) return <FileArchive className="w-5 h-5 text-amber-500" />;
    if (['js', 'ts', 'tsx', 'jsx', 'json', 'py', 'html', 'css'].includes(ext || '')) return <FileCode className="w-5 h-5 text-emerald-500" />;
    return <File className="w-5 h-5 text-indigo-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-6 h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] min-h-[450px] w-full max-w-full overflow-hidden">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-full flex overflow-hidden shadow-xl w-full max-w-full">
        
        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={imageInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleImageSelected}
        />
        <input
          type="file"
          ref={fileInputRef}
          accept="*"
          className="hidden"
          onChange={handleFileSelected}
        />

        {/* Left Sidebar: Threads List */}
        <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col shrink-0 ${
          mobileShowThreadList ? 'flex' : 'hidden md:flex'
        }`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Real-time Collaboration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Direct intent communication & agreement</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/80 dark:divide-slate-800/60">
            {threads.map((thread) => {
              const other = getOtherParticipant(thread, user.id, allUsers);
              const isBlocked = (user.blockedUserIds || []).includes(other.id);

              return (
                <div
                  key={thread.id}
                  onClick={() => handleSelectThread(thread.id)}
                  className={`w-full p-3.5 text-left transition-all flex items-start gap-3 cursor-pointer group relative ${
                    selectedThreadId === thread.id
                      ? 'bg-white dark:bg-slate-900 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={other.avatar}
                      alt={other.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                    />
                    {isBlocked && (
                      <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 border border-white dark:border-slate-900" title="User is blocked">
                        <Ban className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate flex items-center gap-1">
                        {other.name}
                        {isBlocked && <span className="text-[9px] text-rose-500 font-bold uppercase">(Blocked)</span>}
                      </h4>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{other.trustScore}% Trust</span>
                    </div>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-300 truncate font-medium mt-0.5">{thread.intentTitle}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{thread.lastMessage}</p>
                  </div>

                  {/* Delete Thread Trash Icon Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingThreadId(thread.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all shrink-0 self-center"
                    title="Delete Conversation Thread"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Active Chat Window */}
        {activeThread && activeOtherParticipant ? (
          <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0 overflow-hidden ${
            !mobileShowThreadList ? 'flex' : 'hidden md:flex'
          }`}>
            
            {/* Active Thread Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between gap-2 relative z-10 max-w-full overflow-hidden">
              <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                <button
                  onClick={() => setMobileShowThreadList(true)}
                  className="md:hidden p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0"
                  title="Back to threads"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="relative shrink-0">
                  <img
                    src={activeOtherParticipant.avatar}
                    alt={activeOtherParticipant.name}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                  />
                  {isUserBlocked && (
                    <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 border border-white dark:border-slate-900" title="User is blocked">
                      <Ban className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">{activeOtherParticipant.name}</h3>
                    <span className="text-[9px] sm:text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                    {isUserBlocked && (
                      <span className="text-[9px] sm:text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                        <Ban className="w-3 h-3" /> Blocked
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-300 font-medium truncate">Intent: {activeThread.intentTitle}</p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setIsTranslating(!isTranslating)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isTranslating
                      ? 'bg-purple-600/15 text-purple-700 dark:text-purple-300 border border-purple-500/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Toggle AI Translation"
                >
                  <Languages className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="hidden sm:inline">Translate</span>
                </button>

                {/* Voice Call Trigger */}
                <button
                  onClick={() => {
                    if (isUserBlocked) return;
                    if (onStartCall && activeThread) {
                      onStartCall(activeOtherParticipant.id, activeOtherParticipant.name, activeOtherParticipant.avatar, activeThread.intentTitle, 'audio');
                    } else {
                      setCallMode('audio');
                      setIsVideoModalOpen(true);
                    }
                  }}
                  disabled={isUserBlocked}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all"
                  title={isUserBlocked ? "User is blocked" : "Start Real Voice Call"}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Voice Call</span>
                </button>

                {/* Video Call Trigger */}
                <button
                  onClick={() => {
                    if (isUserBlocked) return;
                    if (onStartCall && activeThread) {
                      onStartCall(activeOtherParticipant.id, activeOtherParticipant.name, activeOtherParticipant.avatar, activeThread.intentTitle, 'video');
                    } else {
                      setCallMode('video');
                      setIsVideoModalOpen(true);
                    }
                  }}
                  disabled={isUserBlocked}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all"
                  title={isUserBlocked ? "User is blocked" : "Start Video Call"}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Video Call</span>
                </button>

                {/* Block / Unblock Quick Button */}
                <button
                  onClick={() => onToggleBlockUser?.(activeOtherParticipant.id, activeOtherParticipant.name)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isUserBlocked
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                  }`}
                  title={isUserBlocked ? `Unblock ${activeOtherParticipant.name}` : `Block ${activeOtherParticipant.name}`}
                >
                  {isUserBlocked ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">Unblock</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">Block</span>
                    </>
                  )}
                </button>

                {/* More Options Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowOptionsMenu(prev => !prev)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Chat Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showOptionsMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 text-xs">
                      <button
                        onClick={() => {
                          setShowOptionsMenu(false);
                          onToggleBlockUser?.(activeOtherParticipant.id, activeOtherParticipant.name);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                      >
                        {isUserBlocked ? (
                          <>
                            <UserCheck className="w-4 h-4 text-emerald-500" />
                            <span>Unblock {activeOtherParticipant.name}</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4 text-rose-500" />
                            <span>Block {activeOtherParticipant.name}</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setShowOptionsMenu(false);
                          setDeletingThreadId(activeThread.id);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Conversation</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4 max-w-full overflow-x-hidden">
              {activeMessages.map((msg) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 sm:gap-2.5 group relative max-w-full overflow-hidden ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700 mt-1 shrink-0"
                    />
                    <div className={`max-w-[85%] sm:max-w-[75%] space-y-1 min-w-0 ${isMe ? 'items-end text-right' : 'items-start'}`}>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 px-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{msg.senderName}</span>
                        <span className="shrink-0">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="relative group/bubble flex items-center gap-1.5 max-w-full overflow-hidden">
                        <div
                          className={`p-3 sm:p-3.5 rounded-2xl text-xs leading-relaxed break-words [word-break:break-word] max-w-full overflow-hidden ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-xs'
                          }`}
                        >
                          {/* Voice Note Player */}
                          {msg.type === 'voice' ? (
                            <div className="flex items-center gap-3 font-medium min-w-[180px] max-w-full overflow-hidden">
                              <button
                                onClick={() => handleTogglePlayVoice(msg.id, msg.mediaUrl)}
                                className={`p-2 rounded-full transition-all shrink-0 ${
                                  isMe ? 'bg-white text-indigo-700 hover:bg-indigo-100' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                                }`}
                                title={playingVoiceId === msg.id ? "Pause Voice Note" : "Play Recorded Voice Note"}
                              >
                                {playingVoiceId === msg.id ? (
                                  <Pause className="w-4 h-4 fill-current" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                )}
                              </button>
                              <div className="flex-1 space-y-1 min-w-0">
                                <div className="flex items-center justify-between text-[10px] opacity-90">
                                  <span>🎙️ Voice Message</span>
                                  <span>{msg.voiceDurationSec ? `${msg.voiceDurationSec}s` : '0:05'}</span>
                                </div>
                                <div className="flex items-center gap-1 h-3">
                                  {[40, 70, 30, 90, 60, 100, 50, 80, 40, 90, 30, 70, 50, 80].map((h, idx) => (
                                    <div
                                      key={idx}
                                      className={`flex-1 rounded-full ${
                                        playingVoiceId === msg.id ? 'bg-emerald-400 animate-pulse' : (isMe ? 'bg-indigo-200' : 'bg-indigo-400')
                                      }`}
                                      style={{ height: `${h}%` }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : msg.type === 'image' ? (
                            /* Photo / Image Attachment */
                            <div className="space-y-2 max-w-full overflow-hidden">
                              {msg.mediaUrl ? (
                                <div
                                  onClick={() => setPreviewImageUrl(msg.mediaUrl!)}
                                  className="cursor-pointer overflow-hidden rounded-xl border border-white/20 group relative max-w-xs"
                                >
                                  <img
                                    src={msg.mediaUrl}
                                    alt={msg.text || 'Photo Attachment'}
                                    className="w-full h-auto max-h-60 object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                                    Click to Expand Photo
                                  </div>
                                </div>
                              ) : null}
                              <p className="text-xs font-medium break-words [word-break:break-word] whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          ) : msg.type === 'file' ? (
                            /* Pin / File Attachment Card */
                            <div className="space-y-2 max-w-full overflow-hidden">
                              <div className={`p-2.5 rounded-xl border flex items-center gap-3 ${
                                isMe ? 'bg-indigo-700/80 border-indigo-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                              }`}>
                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                                  {getFileIcon(msg.fileName || msg.text)}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <p className="font-bold text-xs truncate">{msg.fileName || msg.text}</p>
                                  <p className="text-[10px] opacity-75">{msg.fileSize || 'Attachment'}</p>
                                </div>
                                {msg.mediaUrl && (
                                  <a
                                    href={msg.mediaUrl}
                                    download={msg.fileName || 'attachment'}
                                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                                      isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                                    }`}
                                    title="Download File"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* Standard Text */
                            <p className="break-words [word-break:break-word] whitespace-pre-wrap">{msg.text}</p>
                          )}

                          {isTranslating && !isMe && (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-purple-600 dark:text-purple-300 italic flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-purple-500" />
                              AI Translation: "I am ready to start our intent collaboration!"
                            </div>
                          )}
                        </div>

                        {/* Hover Delete Button for Single Message */}
                        <button
                          onClick={() => setDeletingMessageId(msg.id)}
                          className="opacity-0 group-hover/bubble:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-all shrink-0"
                          title="Delete Message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* AI Conversation Suggestions */}
                      {!isMe && msg.suggestedResponses && (
                        <div className="pt-1.5 space-y-1">
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                            <Bot className="w-3 h-3" /> AI Suggested Responses
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggestedResponses.map((sug, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSend(sug)}
                                className="text-[11px] bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-1 rounded-lg transition-all text-left"
                              >
                                "{sug}"
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 space-y-2">
              {isUserBlocked ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>You have blocked {activeOtherParticipant.name}. Communications and calls are disabled.</span>
                  </div>
                  <button
                    onClick={() => onToggleBlockUser?.(activeOtherParticipant.id, activeOtherParticipant.name)}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shrink-0 ml-2"
                  >
                    Unblock User
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  
                  {/* Photo / Image Button */}
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="Upload & Share Photo / Image Blueprint"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  {/* File Attachment Pin Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="Attach File / Document (Pin)"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Live Microphone Voice Recording Button */}
                  <button
                    onClick={handleVoiceRecordToggle}
                    className={`p-1.5 sm:p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold ${
                      isRecordingVoice
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                        : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                    title={isRecordingVoice ? "Recording in progress..." : "Hold or Click to Record Microphone Voice Note"}
                  >
                    <Mic className={`w-4 h-4 ${isRecordingVoice ? 'text-white animate-pulse' : ''}`} />
                  </button>

                  {isRecordingVoice ? (
                    <div className="flex-1 flex items-center justify-between gap-3 bg-rose-950/80 border border-rose-500/50 rounded-xl px-3 py-1.5 text-white animate-pulse">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                        <span className="text-xs font-bold text-rose-200 truncate">Recording Voice Note...</span>
                        <span className="text-xs font-mono font-bold bg-rose-900/90 text-white px-2 py-0.5 rounded border border-rose-700 shrink-0">
                          {recordingTimer}s
                        </span>
                        <div className="hidden sm:flex items-center gap-1 h-3 ml-1 shrink-0">
                          {[40, 80, 50, 100, 60, 90, 30, 70, 50].map((h, idx) => (
                            <div key={idx} className="w-1 bg-rose-400 rounded-full animate-bounce" style={{ height: `${h}%`, animationDelay: `${idx * 0.1}s` }} />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => stopVoiceRecording(true)}
                          className="px-2 py-1 text-xs text-rose-300 hover:text-white hover:bg-rose-900/60 rounded-lg transition-all"
                          title="Cancel Recording"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => stopVoiceRecording(false)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1"
                          title="Stop & Send Voice Note"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Input Text Box */}
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={`Message ${activeOtherParticipant.name}...`}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />

                      {/* Send Button */}
                      <button
                        onClick={() => handleSend()}
                        disabled={!inputText.trim()}
                        className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-xs"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </>
                  )}

                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Active Conversations Yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                When candidates match on your published intents or when you reach out to community members, direct messages will appear here.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Delete Message Confirmation Modal */}
      {deletingMessageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Delete Message</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete this real-time message from the collaboration history?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingMessageId(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeThread && onDeleteMessage) {
                    onDeleteMessage(activeThread.id, deletingMessageId);
                  }
                  setDeletingMessageId(null);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-md shadow-rose-600/30"
              >
                Delete Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Thread Confirmation Modal */}
      {deletingThreadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Delete Chat Thread</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Permanent conversation removal</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete this entire chat conversation? All associated messages, voice notes, and shared attachments will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingThreadId(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteThread) {
                    onDeleteThread(deletingThreadId);
                  }
                  setDeletingThreadId(null);
                  if (selectedThreadId === deletingThreadId) {
                    const remaining = threads.filter(t => t.id !== deletingThreadId);
                    setSelectedThreadId(remaining[0]?.id || '');
                  }
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-md shadow-rose-600/30"
              >
                Delete Thread
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageUrl}
              alt="Expanded Photo Preview"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

    </div>
  );
};
