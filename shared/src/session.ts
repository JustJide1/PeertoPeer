export type SessionStatus = 'open' | 'ongoing' | 'completed' | 'cancelled';

export interface StudySession {
  id: string;
  title: string;
  subjectId: string;
  hostId: string;
  description?: string;
  status: SessionStatus;
  scheduledFor: string;
  durationMinutes: number;
  maxParticipants: number;
  participantIds: string[];
  createdAt: string;
}

export interface CreateSessionPayload {
  title: string;
  subjectId: string;
  description?: string;
  scheduledFor: string;
  durationMinutes: number;
  maxParticipants: number;
}
