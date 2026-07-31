export type UrgencyLevel = 'Immediate' | 'Urgent' | 'High' | 'Normal';
export type IntentCategory = 'Startup/Tech' | 'Sports/Fitness' | 'Emergency/Health' | 'Services/Trades' | 'Co-founder/Networking' | 'Creative/Freelance' | 'Community/Help';
export type IntentStatus = 'active' | 'fulfilled' | 'expired' | 'serving' | 'accepted';

export interface Intent {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorTrustScore: number;
  creatorBadge?: string;
  title: string;
  rawPrompt: string;
  category: IntentCategory;
  platforms?: string[]; // e.g. ['WhatsApp', 'Telegram', 'Discord', 'Slack', 'LinkedIn', 'Web App', 'X/Twitter']
  skills: string[];
  location: string;
  lat?: number;
  lng?: number;
  distanceKm: number;
  availability: string;
  budget?: string;
  urgency: UrgencyLevel;
  durationHours: number;
  createdAt: number; // timestamp
  expiresAt: number; // timestamp
  status: IntentStatus;
  acceptedByUserId?: string;
  acceptedByUserName?: string;
  acceptedByAvatar?: string;
  acceptedByPlatform?: string;
  acceptedAt?: number;
  isTeamIntent?: boolean;
  targetCount?: number;
  filledCount?: number;
  matchesCount: number;
  viewsCount: number;
  aiSuggestedKeywords?: string[];
}

export interface MatchBreakdown {
  skills: number;
  proximity: number;
  trust: number;
  availability: number;
}

export interface Match {
  id: string;
  intentId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userTitle: string;
  trustScore: number;
  responseTime: string;
  karmaPoints: number;
  levelName: string;
  matchPercentage: number;
  breakdown: MatchBreakdown;
  location: string;
  distanceKm: number;
  skills: string[];
  languages: string[];
  status: 'suggested' | 'contacted' | 'accepted' | 'declined';
  recommendedFirst?: boolean;
  aiReasoning: string;
}

export interface Badge {
  id: string;
  name: string;
  iconName: string;
  description: string;
  color: string;
  earnedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  headline: string;
  bio: string;
  phoneNumber?: string;
  governmentId?: string;
  trustScore: number; // e.g. 98%
  karmaPoints: number;
  coins: number;
  xp: number;
  levelName: string; // Explorer, Collaborator, Professional, Expert, Elite, Legend
  levelNumber: number;
  responseTime: string; // e.g., "< 3 mins"
  completedIntents: number;
  successRate: number; // e.g., 99%
  location: string;
  languages: string[];
  skills: string[];
  experience: { role: string; company: string; duration: string }[];
  portfolio: { title: string; link: string; tags: string[] }[];
  badges: Badge[];
  verificationStatus: {
    identity: boolean;
    phone: boolean;
    skillVerified: boolean;
  };
  noShowPenalties: number;
  cancellationPenalties: number;
  streakDays: number;
  blockedUserIds?: string[];
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  type: 'text' | 'voice' | 'image' | 'file' | 'system';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  voiceDurationSec?: number;
  isTranslated?: boolean;
  originalText?: string;
  suggestedResponses?: string[];
}

export interface ChatThread {
  id: string;
  intentId: string;
  intentTitle: string;
  createdByUserId?: string;
  createdByUserName?: string;
  createdByUserAvatar?: string;
  createdByTrustScore?: number;
  createdByTitle?: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantTrustScore: number;
  participantTitle: string;
  lastMessage: string;
  lastMessageTimestamp: number;
  unreadCount: number;
  status: 'active' | 'collaborating' | 'completed';
}

export function getOtherParticipant(
  thread: ChatThread,
  currentUserId: string,
  allUsers: UserProfile[] = []
): {
  id: string;
  name: string;
  avatar: string;
  trustScore: number;
  title: string;
} {
  const isCreator =
    (thread.createdByUserId && currentUserId === thread.createdByUserId) ||
    (thread.createdByUserName && thread.createdByUserName.toLowerCase() === currentUserId.toLowerCase());

  const isParticipant =
    (thread.participantId && currentUserId === thread.participantId) ||
    (thread.participantName && thread.participantName.toLowerCase() === currentUserId.toLowerCase());

  if (isCreator && !isParticipant) {
    // Current user is the Creator -> return Participant details
    let pName = thread.participantName;
    let pAvatar = thread.participantAvatar;
    let pTrust = thread.participantTrustScore;
    let pTitle = thread.participantTitle;

    const foundInAll = allUsers.find(u => u.id === thread.participantId || u.name.toLowerCase() === thread.participantName.toLowerCase());
    if (foundInAll) {
      pName = foundInAll.name;
      pAvatar = foundInAll.avatar;
      pTrust = foundInAll.trustScore;
      pTitle = foundInAll.headline;
    }

    return {
      id: thread.participantId || 'usr_participant',
      name: pName || 'Collaborator',
      avatar: pAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
      trustScore: pTrust || 98,
      title: pTitle || 'Collaborator'
    };
  } else {
    // Current user is the Participant (or viewing another creator's thread) -> return Creator details
    const creatorId = thread.createdByUserId || 'usr_creator';
    let cName = thread.createdByUserName;
    let cAvatar = thread.createdByUserAvatar;
    let cTrust = thread.createdByTrustScore;
    let cTitle = thread.createdByTitle;

    const foundInAll = allUsers.find(u => u.id === creatorId || (cName && u.name.toLowerCase() === cName.toLowerCase()));
    if (foundInAll) {
      cName = foundInAll.name;
      cAvatar = foundInAll.avatar;
      cTrust = foundInAll.trustScore;
      cTitle = foundInAll.headline;
    }

    if (!cName) {
      const currentMatchingUser = allUsers.find(u => u.id === currentUserId);
      const currentUserName = currentMatchingUser ? currentMatchingUser.name.toLowerCase() : currentUserId.toLowerCase();
      if (currentUserName.includes('sai')) {
        cName = 'harikrishna';
      } else if (currentUserName.includes('harikrishna')) {
        cName = 'sai';
      } else {
        cName = 'Intent Poster';
      }
    }

    return {
      id: creatorId,
      name: cName,
      avatar: cAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
      trustScore: cTrust || 98,
      title: cTitle || 'Intent Creator'
    };
  }
}

export interface CallSignal {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  intentTitle: string;
  type: 'audio' | 'video';
  status: 'calling' | 'accepted' | 'declined' | 'ended';
  offerSdp?: string;
  answerSdp?: string;
  callerIceCandidates?: string[];
  receiverIceCandidates?: string[];
  lastSpokenText?: string;
  lastSpeakerId?: string;
  lastSpeakerName?: string;
  spokenTimestamp?: number;
  createdAt: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: string;
  targetCount: number;
  currentProgress: number;
  rewardXp: number;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
}

export interface LeaderboardItem {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  location: string;
  categoryGroup: string; // City, College, Company, Profession, Skill, Country
  groupName: string; // e.g. "San Francisco", "Stanford", "Google", "Developers"
  karmaPoints: number;
  trustScore: number;
  levelName: string;
  completedIntents: number;
  badge?: string;
}

export interface Milestone {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'submitted' | 'released';
  deliverableNote?: string;
}

export interface EscrowContract {
  id: string;
  intentId: string;
  intentTitle: string;
  clientName: string;
  providerName: string;
  totalAmount: number;
  currency: string;
  status: 'funded' | 'in_progress' | 'completed' | 'disputed';
  milestones: Milestone[];
  createdAt: number;
  deliverablesUrl?: string;
}

export interface NotificationItem {
  id: string;
  type: 'match' | 'reply' | 'expiry' | 'mission' | 'reward' | 'recommendation' | 'escrow';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionLink?: string;
}

export interface RedeemItem {
  id: string;
  title: string;
  description: string;
  coinCost: number;
  category: 'AI Credits' | 'Membership' | 'Boost' | 'Promotion' | 'Discounts';
  icon: string;
  badgeTag: string;
}
