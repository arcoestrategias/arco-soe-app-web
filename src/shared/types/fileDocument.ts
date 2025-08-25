export interface FileDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: number;
  createdBy?: string;
  createdAt?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}
