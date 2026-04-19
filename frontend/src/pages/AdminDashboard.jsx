import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueries } from "@/context/QueryContext";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Inbox, Clock, CheckCircle2, AlertCircle, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const resolverCategories = ["IT Support", "HR", "Facilities", "Finance", "General"];

function SuperAdminPortal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "resolvers" ? "resolvers" : "users";
  const token = localStorage.getItem("token");
  const [users, setUsers] = useState([]);
  const [resolvers, setResolvers] = useState([]);
  const [resolverEmail, setResolverEmail] = useState("");
  const [resolverPassword, setResolverPassword] = useState("");
  const [resolverCategory, setResolverCategory] = useState("IT Support");
  const [roleDraft, setRoleDraft] = useState({});

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const loadUsers = async () => {
    const res = await fetch("/api/auth/admin/users", { headers: authHeaders });
    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error(data.message || "Failed to load users");
    setUsers(data);
  };

  const loadResolvers = async () => {
    const res = await fetch("/api/auth/admin/resolvers", { headers: authHeaders });
    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error(data.message || "Failed to load resolvers");
    setResolvers(data);
  };

  const refreshAll = async () => {
    try {
      await Promise.all([loadUsers(), loadResolvers()]);
    } catch (err) {
      toast.error(err.message || "Failed to load management data");
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleDeleteUser = async (id) => {
    const res = await fetch(`/api/auth/admin/users/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.message || "Failed to delete user");
      return;
    }
    toast.success("User deleted");
    await loadUsers();
  };

  const handleCreateResolver = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/auth/admin/resolvers", {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: resolverEmail,
        password: resolverPassword,
        category: resolverCategory,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.message || "Failed to create resolver");
      return;
    }
    toast.success("Resolver created");
    setResolverEmail("");
    setResolverPassword("");
    setResolverCategory("IT Support");
    await loadResolvers();
  };

  const handleUpdateResolverCategory = async (resolver) => {
    const category = roleDraft[resolver._id] || resolver.category;
    const res = await fetch(`/api/auth/admin/resolvers/${resolver._id}/category`, {
      method: "PATCH",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.message || "Failed to update resolver category");
      return;
    }
    toast.success("Resolver category updated");
    await loadResolvers();
  };

  const handleDeleteResolver = async (resolver) => {
    const res = await fetch(`/api/auth/admin/resolvers/${resolver._id}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.message || "Failed to delete resolver");
      return;
    }
    toast.success("Resolver deleted");
    await loadResolvers();
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Admin Portal</h1>
        <p className="text-sm text-gray-400">Manage users and resolver accounts</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) => setSearchParams({ tab: val })}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 bg-white/5 backdrop-blur border border-white/10 rounded-xl">
          <TabsTrigger value="users" className="data-[state=active]:bg-white/10 rounded-lg">Users</TabsTrigger>
          <TabsTrigger value="resolvers" className="data-[state=active]:bg-white/10 rounded-lg">Resolvers</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">User Management</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-400">Name</TableHead>
                    <TableHead className="text-gray-400">Email</TableHead>
                    <TableHead className="text-gray-400">Created</TableHead>
                    <TableHead className="text-gray-400">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id} className="hover:bg-white/5 transition">
                      <TableCell className="font-medium text-white">{user.fullName}</TableCell>
                      <TableCell className="text-gray-300">{user.username}</TableCell>
                      <TableCell className="text-gray-400">{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" className="rounded-lg">
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-gray-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolvers" className="space-y-6">
          <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Create Resolver</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-4" onSubmit={handleCreateResolver}>
                <div className="space-y-2">
                  <Label className="text-gray-300">Email</Label>
                  <Input className="bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-yellow-500" value={resolverEmail} onChange={(e) => setResolverEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Password</Label>
                  <Input className="bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-yellow-500" value={resolverPassword} onChange={(e) => setResolverPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Category</Label>
                  <select className="h-10 w-full rounded-md bg-white/5 border border-white/10 text-white px-3">
                    {resolverCategories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-medium rounded-lg hover:opacity-90">
                    Create
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Resolver Management</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-400">Name</TableHead>
                    <TableHead className="text-gray-400">Email</TableHead>
                    <TableHead className="text-gray-400">Category</TableHead>
                    <TableHead className="text-gray-400">Update</TableHead>
                    <TableHead className="text-gray-400">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resolvers.map((resolver) => (
                    <TableRow key={resolver._id} className="hover:bg-white/5 transition">
                      <TableCell className="text-white">{resolver.fullName}</TableCell>
                      <TableCell className="text-gray-300">{resolver.username}</TableCell>
                      <TableCell className="text-gray-400">{resolver.category}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <select className="h-9 rounded-md bg-white/5 border border-white/10 text-white px-2" />
                          <Button size="sm" className="rounded-lg">Update</Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" className="rounded-lg">
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResolverDashboard() {
  const { queries, updateQueryStatus, deleteQuery } = useQueries();
  const { userFullName, userCategory } = useAuth();
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const counts = useMemo(() => ({
    total: queries.length,
    open: queries.filter((q) => q.status === "open").length,
    inProgress: queries.filter((q) => q.status === "in-progress").length,
    resolved: queries.filter((q) => q.status === "resolved").length,
  }), [queries]);

  const filtered = useMemo(
    () => (filter === "all" ? queries : queries.filter((q) => q.status === filter)),
    [queries, filter]
  );

  const summaryCards = [
    { label: "Total Queries", count: counts.total, icon: Inbox },
    { label: "Open", count: counts.open, icon: AlertCircle },
    { label: "In Progress", count: counts.inProgress, icon: Clock },
    { label: "Resolved", count: counts.resolved, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Resolver Dashboard</h1>
        <p className="text-gray-400 text-sm">
          {userFullName} {userCategory && `· ${userCategory}`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl hover:scale-[1.02] transition">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-400">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{card.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white">All Queries</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead>ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q) => (
                <TableRow key={q.id} className="hover:bg-white/5 cursor-pointer" onClick={() => navigate(`/queries/${q.id}`)}>
                  <TableCell className="text-gray-400">{q.id}</TableCell>
                  <TableCell className="text-white">{q.subject}</TableCell>
                  <TableCell><StatusBadge status={q.status} /></TableCell>
                  <TableCell><PriorityBadge priority={q.priority} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4 text-gray-300" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Update</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const { isSuperAdmin } = useAuth();
  return <AppLayout>{isSuperAdmin ? <SuperAdminPortal /> : <ResolverDashboard />}</AppLayout>;
}