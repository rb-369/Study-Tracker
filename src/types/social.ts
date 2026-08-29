import { UserProfile } from './index';

export type PrivacyMode = 'friends_only' | 'public' | 'ghost';
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';
export type BuddySessionStatus = 'inviting' | 'pending_break' | 'active' | 'completed' | 'declined' | 'cancelled';
export type GroupRole = 'owner' | 'admin' | 'member';
export type ChatMode = 'open' | 'reactions_only';
export type MessageType = 'text' | 'reaction' | 'system';
export type ReportStatus = 'pending' | 'quarantined' | 'dismissed' | 'actioned';
export type AppealStatus = 'none' | 'requested' | 'reviewed';

export interface ExtendedUserProfile extends UserProfile {
  handle?: string;
  bio?: string;
  timezone?: string;
  level?: number;
  xp?: number;
  privacy_mode?: PrivacyMode;
  age_verified?: boolean;
  active_subject_topic?: string;
  is_studying?: boolean;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: FriendRequestStatus;
  created_at: string;
  sender?: ExtendedUserProfile;
  receiver?: ExtendedUserProfile;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend?: ExtendedUserProfile;
}

export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface ModerationReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  message_id?: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  is_verified_reporter: boolean;
  appeal_status: AppealStatus;
  created_at: string;
}

export interface BuddySession {
  id: string;
  initiator_id: string;
  buddy_id: string;
  subject_name: string;
  topic: string;
  duration_minutes: number;
  status: BuddySessionStatus;
  start_time?: string | null;
  initiator_pings: number;
  buddy_pings: number;
  high_fives: number;
  created_at: string;
  initiator?: ExtendedUserProfile;
  buddy?: ExtendedUserProfile;
}

export interface StudyGroup {
  id: string;
  creator_id: string;
  name: string;
  description?: string;
  invite_code: string;
  is_public: boolean;
  chat_mode: ChatMode;
  color: string;
  icon: string;
  created_at: string;
  members_count?: number;
  active_studying_count?: number;
  user_role?: GroupRole;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  profile?: ExtendedUserProfile;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  message_type: MessageType;
  is_flagged: boolean;
  report_count: number;
  created_at: string;
  profile?: ExtendedUserProfile;
  is_quarantined?: boolean;
}

export interface LiveRoomPresence {
  user_id: string;
  handle: string;
  full_name: string;
  avatar_url?: string;
  is_studying: boolean;
  subject_name?: string;
  topic?: string;
  session_type?: 'pomodoro' | 'stopwatch';
  remaining_seconds?: number;
  is_on_break?: boolean;
  last_active: string;
}
