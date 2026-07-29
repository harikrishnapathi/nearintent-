export type UrgencyLevel = 'Immediate' | 'Urgent' | 'High' | 'Normal';
export type IntentCategory = 'Startup/Tech' | 'Sports/Fitness' | 'Emergency/Health' | 'Services/Trades' | 'Co-founder/Networking' | 'Creative/Freelance' | 'Community/Help';
export type IntentStatus = 'active' | 'fulfilled' | 'expired';

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
  skills: string[];
  location: string;
  distanceKm: number;
  availability: string;
  budget?: string;
  urgency: UrgencyLevel;
  durationHours: number;
  createdAt: number; // timestamp
  expiresAt: number; // timestamp
  status: IntentStatus;
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
  voiceDurationSec?: number;
  isTranslated?: boolean;
  originalText?: string;
  suggestedResponses?: string[];
}

export interface ChatThread {
  id: string;
  intentId: string;
  intentTitle: string;
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
