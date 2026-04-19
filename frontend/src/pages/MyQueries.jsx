import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries } from "@/context/QueryContext";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function MyQueries() {
  const { queries, deleteQuery } = useQueries();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return queries
      .filter((q) => statusFilter === "all" || q.status === statusFilter)
      .filter(
        (q) =>
          q.subject.toLowerCase().includes(search.toLowerCase()) ||
          q.id.toLowerCase().includes(search.toLowerCase()) ||
          q.category.toLowerCase().includes(search.toLowerCase())
      );
  }, [queries, search, statusFilter]);

  const handleDelete = (e, id, subject) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete query "${subject}"?`)) {
      deleteQuery(id);
      toast.success("Query deleted successfully");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-white">My Queries</h1>
          <p className="text-gray-400 text-sm">View and manage all your support tickets</p>
        </div>

        <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle className="text-white">All Tickets ({filtered.length})</CardTitle>

              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                {/* Search */}
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tickets..."
                    className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Filter */}
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                  <SelectTrigger className="h-10 w-full sm:w-40 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F172A] border border-white/10 text-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-400">ID</TableHead>
                  <TableHead className="text-gray-400">Subject</TableHead>
                  <TableHead className="hidden md:table-cell text-gray-400">Category</TableHead>
                  <TableHead className="text-gray-400">Priority</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="hidden md:table-cell text-gray-400">Assigned</TableHead>
                  <TableHead className="hidden lg:table-cell text-gray-400">Created</TableHead>
                  <TableHead className="hidden lg:table-cell text-gray-400">Updated</TableHead>
                  <TableHead className="text-gray-400">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((q) => (
                  <TableRow
                    key={q.id}
                    className="cursor-pointer hover:bg-white/5 transition"
                    onClick={() => navigate(`/queries/${q.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-gray-400">{q.id}</TableCell>

                    <TableCell className="font-medium text-white max-w-[200px] truncate">
                      {q.subject}
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-gray-400 text-sm">
                      {q.category}
                    </TableCell>

                    <TableCell>
                      <PriorityBadge priority={q.priority} />
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={q.status} />
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-sm text-gray-300">
                      {q.originalCategory ? (
                        <span className="inline-flex items-center gap-2">
                          {q.assignedTo || "General"}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            TEMP
                          </span>
                        </span>
                      ) : (
                        q.assignedTo || "Unassigned"
                      )}
                    </TableCell>

                    <TableCell className="hidden lg:table-cell text-gray-400 text-sm">
                      {format(new Date(q.createdAt), "MMM d, yyyy")}
                    </TableCell>

                    <TableCell className="hidden lg:table-cell text-gray-400 text-sm">
                      {format(new Date(q.updatedAt), "MMM d, yyyy")}
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10"
                        onClick={(e) => handleDelete(e, q.id, q.subject)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-gray-500">
                      No tickets found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}