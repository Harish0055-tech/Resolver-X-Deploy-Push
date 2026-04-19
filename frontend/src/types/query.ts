export type QueryStatus = "open" | "in-progress" | "resolved" | "closed";
export type QueryPriority = "low" | "medium" | "high" | "critical";
export type QueryCategory = "IT Support" | "HR" | "Facilities" | "Finance" | "General";

export interface QueryActivity {
  id: string;
  timestamp: string;
  type: "status_change" | "comment" | "assignment";
  user: string;
  content: string;
  oldStatus?: QueryStatus;
  newStatus?: QueryStatus;
}

export interface Attachment {
  id: string;
  name: string;
  size: number; // in bytes
  type: string; // MIME type
  url: string;
  uploadedAt: string;
}

export interface Query {
  id: string;
  subject: string;
  category: QueryCategory;
  priority: QueryPriority;
  status: QueryStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  submittedBy: string;
  assignedTo?: string;
  activities: QueryActivity[];
  attachments?: Attachment[];
}
