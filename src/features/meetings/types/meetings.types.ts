export type MeetingRole = "CONVENER" | "PARTICIPANT";
export type MeetingFrequency = "ONCE" | "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

export interface MeetingParticipant {
  userId: string;
  role: MeetingRole;
  isRequired: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username?: string;
  };
}

export interface Meeting {
  id: string;
  name: string;
  createdBy: string;
  purpose?: string;
  location?: string;
  tools?: string;
  startDate: string;
  endDate: string;
  frequency?: MeetingFrequency;
  participants: MeetingParticipant[];
  createdAt: string;
  updatedAt: string;
  agenda?: string[];
  parentId?: string;
  _count?: { minutes: number; children?: number };
  minutes?: { id: string; version: number; status: string; createdAt: string }[];
}

export interface CreateMeetingPayload {
  name: string;
  purpose?: string;
  location?: string;
  tools?: string;
  startDate: string;
  endDate: string;
  frequency?: MeetingFrequency;
  participants: {
    userId: string;
    role: MeetingRole;
    isRequired: boolean;
  }[];
  companyId: string;
  businessUnitId?: string;
  agenda?: string[];
}

export interface UpdateMeetingPayload extends Partial<CreateMeetingPayload> {}

export interface MeetingCalendarEvent {
  id: string;
  meetingId: string;
  title: string;
  start: string;
  end: string;
  location?: string;
}

export interface MeetingCandidateUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface MeetingCandidatesGroup {
  businessUnitId: string;
  businessUnitName: string;
  users: MeetingCandidateUser[];
}
