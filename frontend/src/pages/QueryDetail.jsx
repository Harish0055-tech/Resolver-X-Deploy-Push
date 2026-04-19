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
        <div className="text-center py-20 text-white">
          <h2 className="text-xl font-semibold mb-2">Query not found</h2>
          <p className="text-gray-400 mb-4">The ticket you're looking for doesn't exist.</p>
          <Link to={userRole === 'admin' ? "/" : "/queries"}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const handleStatusChange = (newStatus) => {
    updateQueryStatus(query.id, newStatus);
    toast({ title: "Status updated", description: `Changed to ${newStatus}` });
  };

  const handleDelete = () => {
    if (confirm(`Delete "${query.subject}"?`)) {
      deleteQuery(query.id);
      sonnerToast.success("Query deleted");
      navigate(userRole === 'admin' ? "/" : "/queries");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 text-white">

        {/* Breadcrumb */}
        <div className="text-sm text-gray-400 flex items-center gap-2">
          <Link to={userRole === 'admin' ? "/" : "/queries"} className="flex items-center gap-1 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span>/</span>
          <span className="text-gray-300">{query.id}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{query.subject}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {query.submittedBy} • {format(new Date(query.createdAt), "MMM d, yyyy")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <PriorityBadge priority={query.priority} />
            <StatusBadge status={query.status} />
            <Button
              variant="ghost"
              className="text-red-400 hover:bg-red-500/10"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">

            {/* Description */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {query.description}
                </p>
              </CardContent>
            </Card>

            {/* Attachments */}
            {query.attachments?.length > 0 && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Attachments ({query.attachments.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {query.attachments.map((file) => {
                    const Icon = getFileIcon(file.type);
                    return (
                      <div key={file.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-yellow-400" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <a href={file.url} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Activity */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {query.activities.map((a, i) => {
                  const Icon = activityIcons[a.type];
                  return (
                    <div key={a.id} className="flex gap-3 mb-4">
                      <div className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10">
                        <Icon className="h-4 w-4 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">{a.user}</span>{" "}
                          <span className="text-gray-400 text-xs">
                            {format(new Date(a.timestamp), "MMM d, h:mm a")}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400">{a.content}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

          </div>

          {/* RIGHT */}
          <div className="space-y-4">

            {isSuperAdmin && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Reassign</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  <div>
                    <Label className="text-xs text-gray-400">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["IT Support", "HR", "Facilities", "Finance", "General"].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-400">Assign</Label>
                    <Select value={selectedResolver} onValueChange={setSelectedResolver}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {resolvers.filter(r => r.category === selectedCategory).map(r => (
                          <SelectItem key={r._id} value={r.fullName || r.username}>
                            {r.fullName || r.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-yellow-600 to-yellow-400 text-black"
                    onClick={() => {
                      updateQueryAssignment(query.id, selectedResolver, selectedCategory);
                      toast({ title: "Updated" });
                    }}
                  >
                    Update
                  </Button>
                </CardContent>
              </Card>
            )}

            {userRole === 'admin' && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={query.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p><span className="text-gray-400">ID:</span> {query.id}</p>
                <p><span className="text-gray-400">Category:</span> {query.category}</p>
                <p><span className="text-gray-400">Assigned:</span> {query.assignedTo || "Unassigned"}</p>
                <p><span className="text-gray-400">Updated:</span> {format(new Date(query.updatedAt), "MMM d, yyyy")}</p>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}