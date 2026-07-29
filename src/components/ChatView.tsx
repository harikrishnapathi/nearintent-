import React, { useState } from 'react';
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
  Square,
  ArrowLeft
} from 'lucide-react';
import { ChatThread, ChatMessage, UserProfile } from '../types';
import { VideoCallModal } from './VideoCallModal';

interface ChatViewProps {
  user: UserProfile;
  threads: ChatThread[];
  messagesMap: Record<string, ChatMessage[]>;
  onSendMessage: (threadId: string, text: string, type?: 'text' | 'voice' | 'image' | 'file') => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  user,
  threads,
  messagesMap,
  onSendMessage
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string>(threads[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [callMode, setCallMode] = useState<'audio' | 'video'>('video');
  const [mobileShowThreadList, setMobileShowThreadList] = useState(true);

  const activeThread = threads.find(t => t.id === selectedThreadId) || threads[0];
  const activeMessages = activeThread ? messagesMap[activeThread.id] || [] : [];

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

  const handleVoiceRecordToggle = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      setRecordingTimer(1);
      const timer = setInterval(() => {
        setRecordingTimer(prev => prev + 1);
      }, 1000);
      (window as any).voiceInterval = timer;
    } else {
      clearInterval((window as any).voiceInterval);
      setIsRecordingVoice(false);
      if (activeThread) {
        onSendMessage(activeThread.id, `🎙️ Voice Note (${recordingTimer}s duration)`, 'voice');
      }
      setRecordingTimer(0);
    }
  };

  const handleSimulateAttachment = (type: 'image' | 'file') => {
    if (!activeThread) return;
    if (type === 'image') {
      onSendMessage(activeThread.id, '📷 Attached Design Architecture Blueprint', 'image');
    } else {
      onSendMessage(activeThread.id, '📄 Shared Project_Requirements.pdf', 'file');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6 h-[calc(100vh-140px)] min-h-[500px] w-full max-w-full">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-full flex overflow-hidden shadow-xl w-full">
        
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
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => handleSelectThread(thread.id)}
                className={`w-full p-3.5 text-left transition-all flex items-start gap-3 ${
                  selectedThreadId === thread.id
                    ? 'bg-white dark:bg-slate-900 border-l-4 border-indigo-600'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-900/50'
                }`}
              >
                <img
                  src={thread.participantAvatar}
                  alt={thread.participantName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">{thread.participantName}</h4>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{thread.participantTrustScore}% Trust</span>
                  </div>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-300 truncate font-medium mt-0.5">{thread.intentTitle}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{thread.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Area: Active Chat Window */}
        {activeThread ? (
          <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 ${
            !mobileShowThreadList ? 'flex' : 'hidden md:flex'
          }`}>
            
            {/* Active Thread Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setMobileShowThreadList(true)}
                  className="md:hidden p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  title="Back to threads"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <img
                  src={activeThread.participantAvatar}
                  alt={activeThread.participantName}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">{activeThread.participantName}</h3>
                    <span className="text-[9px] sm:text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-3 h-3" /> {activeThread.participantTrustScore}% Trust
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-300 font-medium truncate">Intent: {activeThread.intentTitle}</p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Auto Translate Toggle */}
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
                    setCallMode('audio');
                    setIsVideoModalOpen(true);
                  }}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all"
                  title="Start Voice Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Voice Call</span>
                </button>

                {/* Video Call Trigger */}
                <button
                  onClick={() => {
                    setCallMode('video');
                    setIsVideoModalOpen(true);
                  }}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all"
                  title="Start Video Call"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Video Call</span>
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4">
              {activeMessages.map((msg) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 sm:gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700 mt-1 shrink-0"
                    />
                    <div className={`max-w-[80%] sm:max-w-[75%] space-y-1 ${isMe ? 'items-end text-right' : 'items-start'}`}>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 px-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{msg.senderName}</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`p-3 sm:p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-xs'
                        }`}
                      >
                        {msg.type === 'voice' ? (
                          <div className="flex items-center gap-2 font-medium">
                            <button className="p-1.5 bg-white/20 rounded-full text-white">
                              <Play className="w-3.5 h-3.5 fill-white" />
                            </button>
                            <div className="flex-1 h-2 bg-slate-300 dark:bg-slate-800 rounded-full overflow-hidden w-28">
                              <div className="h-full bg-indigo-400 w-2/3" />
                            </div>
                            <span>{msg.text}</span>
                          </div>
                        ) : (
                          <p>{msg.text}</p>
                        )}

                        {isTranslating && !isMe && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-purple-600 dark:text-purple-300 italic flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            AI Translation: "I am ready to start our intent collaboration!"
                          </div>
                        )}
                      </div>

                      {/* AI Conversation Suggestions (Chips) */}
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
              <div className="flex items-center gap-1.5 sm:gap-2">
                
                {/* File Attachment Buttons */}
                <button
                  onClick={() => handleSimulateAttachment('image')}
                  className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  title="Share Image Blueprint"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleSimulateAttachment('file')}
                  className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  title="Attach File"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Voice Note Button */}
                <button
                  onClick={handleVoiceRecordToggle}
                  className={`p-1.5 sm:p-2 rounded-xl transition-colors flex items-center gap-1 text-xs ${
                    isRecordingVoice
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                  title="Record Voice Note"
                >
                  {isRecordingVoice ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isRecordingVoice && <span>{recordingTimer}s</span>}
                </button>

                {/* Input Text Box */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={`Message ${activeThread.participantName}...`}
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

              </div>
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

      {/* Call System Modal */}
      {activeThread && (
        <VideoCallModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          participantName={activeThread.participantName}
          participantAvatar={activeThread.participantAvatar}
          intentTitle={activeThread.intentTitle}
          userAvatar={user.avatar}
          userName={user.name}
          initialCallMode={callMode}
        />
      )}

    </div>
  );
};
