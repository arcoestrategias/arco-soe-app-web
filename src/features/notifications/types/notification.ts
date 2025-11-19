export type NotificationStatus = "PEN" | "SENT" | "READ" | "EXP" | "FLD";
export type NotificationChannel = "IN_APP" | "EMAIL" | "WHATSAPP";

export type NotificationEvent =
  | "ASSIGNED"
  | "UPDATED"
  | "REOPENED"
  | "DUE_SOON"
  | "OVERDUE"
  | "COMPLETED"
  | "APPROVAL_REQUESTED"
  | "APPROVED"
  | "REJECTED";

export interface NotificationPayload {
  entityId?: string;
  name?: string;
  dueDate?: string | null;
  actorId?: string;
  actorName?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  companyId: string;
  businessUnitId: string;
  recipientId: string;

  entityType: string; // "PRIORITY", "OBJECTIVE", etc.
  entityId: string;

  event: NotificationEvent;
  channel: NotificationChannel;

  title: string;
  message: string;
  payload: NotificationPayload | null;

  status: NotificationStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  readAt: string | null;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FilterNotificationsDto {
  page?: number;
  pageSize?: number;
  status?: NotificationStatus | "ALL";
  entityType?: string; // si quieres filtrar solo PRIORITY
}

export interface PaginatedNotifications {
  items: Notification[];
  total: number;
  page: number;
  pageSize: number;
}
