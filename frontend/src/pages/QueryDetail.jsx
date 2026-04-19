import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQueries } from "@/context/QueryContext";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MessageSquare, ArrowRightLeft, UserPlus, FileText, Download, Image, File, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

const activityIcons = {
  status_change: ArrowRightLeft,
  comment: MessageSquare,
  assignment: UserPlus,
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileIcon = (type) => {
  if (type.startsWith('image/')) return Image;
  if (type === 'application/pdf') return FileText;
  return File;
};

export default function QueryDetail() {
  const { id } = useParams();
  const { getQuery, updateQueryStatus, deleteQuery, updateQueryAssignment } = useQueries();
  const { userRole, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const query = getQuery(id || "");

  const [resolvers, setResolvers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedResolver, setSelectedResolver] = useState("");

  useEffect(() => {
    if (query) {
      setSelectedCategory(query.category || "");
      setSelectedResolver(query.assignedTo || "");
    }
  }, [query]);

  useEffect(() => {
    if (isSuperAdmin) {
      const fetchResolvers = async () => {
        try {
          const res = await fetch("/api/auth/admin/resolvers", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });
          if (res.ok) {
            const data = await res.json();
            setResolvers(data);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchResolvers();
    }
  }, [isSuperAdmin]);

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

  const handleStatusChange = (newStatus) => {
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
                          <a href={attachment.url} download={attachment.name} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="sm" className="shrink-0">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
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
            {/* Super Admin Assignment Update */}
            {isSuperAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reassign Query</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <Select value={selectedCategory} onValueChange={(val) => {
                      setSelectedCategory(val);
                      setSelectedResolver("unassigned");
                    }}>
                      <SelectTrigger>
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["IT Support", "HR", "Facilities", "Finance", "General"].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Assign To</Label>
                    <Select value={selectedResolver || "unassigned"} onValueChange={setSelectedResolver}>
                      <SelectTrigger>
                         <SelectValue placeholder="Select a resolver" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {resolvers.filter(r => r.category === selectedCategory).map(r => (
                          <SelectItem key={r._id} value={r.fullName || r.username}>{r.fullName || r.username}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => {
                        updateQueryAssignment(query.id, selectedResolver === "unassigned" ? "" : selectedResolver, selectedCategory);
                        toast({ title: "Assignment updated", description: "Category and Resolver updated successfully" });
                    }}
                  >
                    Update Assignment
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Resolver Status Update */}
            {userRole === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Update Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={query.status} onValueChange={(value) => handleStatusChange(value)}>
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
                  { label: "Submitted By", value: query.submittedBy || "—" },
                  { label: "Assigned To", value: query.assignedTo || "Unassigned" },
                  { label: "Created", value: format(new Date(query.createdAt), "MMM d, yyyy") },
                  { label: "Last Updated", value: format(new Date(query.updatedAt), "MMM d, yyyy") },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-muted-foreground text-xs">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                ))}
                {query.originalCategory && (
                  <div className="mt-2 rounded-md border border-yellow-400/40 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2">
                    <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">⚠ Temporarily assigned to General</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-0.5">
                      No resolver found in <strong>{query.originalCategory}</strong>. Held by General until a specialist is available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
