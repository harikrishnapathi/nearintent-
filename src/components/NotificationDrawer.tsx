import React from 'react';
import { X, Bell, Sparkles, Award, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onNotificationClick: (notif: NotificationItem) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onNotificationClick
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 animate-in slide-in-from-right duration-300">
      
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-sm">Real-time Intent Alerts</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onMarkAllRead}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Mark all read
          </button>
          <button onClick={onClose} className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => onNotificationClick(notif)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              notif.read
                ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 opacity-70'
                : 'bg-white dark:bg-slate-950 border-indigo-500/40 shadow-xs'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                {notif.type === 'match' && <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                {notif.type === 'mission' && <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
                {notif.type === 'recommendation' && <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                {notif.type === 'expiry' && <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />}
              </div>

              <div className="flex-1">
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{notif.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block">
                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
