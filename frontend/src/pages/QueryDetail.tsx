import { useParams, Link, useNavigate } from "react-router-dom";
import { useQueries } from "@/context/QueryContext";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MessageSquare, ArrowRightLeft, UserPlus, FileText, Download, Image, File, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { QueryStatus } from "@/types/query";
import { toast as sonnerToast } from "sonner";

const activityIcons = {
  status_change: ArrowRightLeft,
  comment: MessageSquare,
  assignment: UserPlus,
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Helper function to get file icon based on type
const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type === 'application/pdf') return FileText;
  return File;
};

export default function QueryDetail() {
  const { id } = useParams<{ id: string }>();
  const { getQuery, updateQueryStatus, deleteQuery } = useQueries();
  const { userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const query = getQuery(id || "");

  if (!query) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold mb-2">Query not found</h2>
          <p className="text-muted-foreground mb-4">The ticket you're looking for doesn't exist.</p>
          <Link to={userRole === 'admin' ? "/" : "/queries"}>
            <Button variant="outline">Back to {userRole === 'admin' ? 'Resolver Dashboard' : 'My Queries'}</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const handleStatusChange = (newStatus: QueryStatus) => {
    updateQueryStatus(query.id, newStatus);
    toast({
      title: "Status updated",
      description: `Query status changed to ${newStatus}`
    });
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete query "${query.subject}"?`)) {
      deleteQuery(query.id);
      sonnerToast.success("Query deleted successfully");
      navigate(userRole === 'admin' ? "/" : "/queries");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to={userRole === 'admin' ? "/" : "/queries"} className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> {userRole === 'admin' ? 'Resolver Dashboard' : 'My Queries'}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{query.id}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight">{query.subject}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Submitted by {query.submittedBy}</span>
              <span>•</span>
              <span>{format(new Date(query.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={query.priority} />
            <StatusBadge status={query.status} />
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{query.description}</p>
              </CardContent>
            </Card>

            {/* Attachments */}
            {query.attachments && query.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Attachments ({query.attachments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {query.attachments.map((attachment) => {
                      const FileIcon = getFileIcon(attachment.type);
                      return (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                              <FileIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{attachment.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatFileSize(attachment.size)}</span>
                                <span>•</span>
                                <span>{format(new Date(attachment.uploadedAt), "MMM d, yyyy")}</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="shrink-0">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Timeline */}
            <Card>
              <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
              <CardContent className="space-y-0">
                {query.activities.map((activity, i) => {
                  const Icon = activityIcons[activity.type];
                  return (
                    <div key={activity.id} className="relative flex gap-3 pb-6 last:pb-0">
                      {i < query.activities.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
                      )}
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 text-sm">
                          <span className="font-medium">{activity.user}</span>
                          <span className="text-muted-foreground text-xs">
                            {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{activity.content}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            {/* Resolver Status Update */}
            {userRole === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Update Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={query.status} onValueChange={(value) => handleStatusChange(value as QueryStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Change the status of this query
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                {[
                  { label: "Ticket ID", value: query.id },
                  { label: "Category", value: query.category },
                  { label: "Assigned To", value: query.assignedTo || "Unassigned" },
                  { label: "Created", value: format(new Date(query.createdAt), "MMM d, yyyy") },
                  { label: "Last Updated", value: format(new Date(query.updatedAt), "MMM d, yyyy") },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-muted-foreground text-xs">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
