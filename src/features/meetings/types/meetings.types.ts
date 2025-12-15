export type MeetingFrequency = "ONCE" | "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
export type MeetingRole = "CONVENER" | "PARTICIPANT";
export type UpdateScope = "ONLY_THIS" | "THIS_AND_FUTURE" | "SERIES";

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
  purpose?: string;
  location?: string;
  tools?: string;
  frequency: MeetingFrequency;
  startDate: string; // ISO
  endDate: string; // ISO
  seriesEndDate?: string;
  dayValue?: number;
  participants: MeetingParticipant[];
  createdAt: string;
  updatedAt: string;
  daysOfWeek?: number[];
}

export interface MeetingOccurrence {
  id: string;
  meetingId: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  isExecuted: boolean;
  isCancelled: boolean;
}

export interface CreateMeetingPayload {
  name: string;
  purpose?: string;
  location?: string;
  tools?: string;
  frequency: MeetingFrequency;
  startDate: string;
  endDate: string;
  seriesEndDate?: string;
  dayValue?: number;
  participants: {
    userId: string;
    role: MeetingRole;
    isRequired: boolean;
  }[];
  companyId: string;
  businessUnitId?: string;
  daysOfWeek?: number[];
}

export interface UpdateMeetingPayload extends Partial<CreateMeetingPayload> {
  scope?: UpdateScope;
  occurrenceDate?: string;
}

export type CalendarViewMode = "month" | "week" | "list";
