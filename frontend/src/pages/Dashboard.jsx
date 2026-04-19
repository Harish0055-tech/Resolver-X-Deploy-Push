import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueries } from "@/context/QueryContext";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Inbox, Clock, CheckCircle2, AlertCircle, PlusCircle } from "lucide-react";
import { format } from "date-fns";

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in-progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

export default function Dashboard() {
  const { queries } = useQueries();
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const counts = useMemo(() => ({
    total: queries.length,
    open: queries.filter((q) => q.status === "open").length,
    inProgress: queries.filter((q) => q.status === "in-progress").length,
    resolved: queries.filter((q) => q.status === "resolved").length,
  }), [queries]);

  const filtered = useMemo(
    () => (filter === "all" ? queries : queries.filter((q) => q.status === filter)).slice(0, 10),
    [queries, filter]
  );

  const summaryCards = [
    { label: "Total Queries", count: counts.total, icon: Inbox },
    { label: "Open", count: counts.open, icon: AlertCircle },
    { label: "In Progress", count: counts.inProgress, icon: Clock },
    { label: "Resolved", count: counts.resolved, icon: CheckCircle2 },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
            <p className="text-gray-400 text-sm">Overview of support queries</p>
          </div>

          <Link to="/submit">
            <Button className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-medium rounded-xl px-4 py-2 hover:opacity-90">
              <PlusCircle className="h-4 w-4" /> New Query
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <Card
              key={card.label}
              className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl hover:scale-[1.02] transition"
            >
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

        {/* Table Section */}
        <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle className="text-white">Recent Queries</CardTitle>

              <div className="flex flex-wrap gap-2">
                {statusFilters.map((sf) => (
                  <Button
                    key={sf.value}
                    variant="ghost"
                    size="sm"
                    className={`text-xs rounded-full px-3 ${
                      filter === sf.value
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : "text-gray-400 hover:bg-white/10"
                    }`}
                    onClick={() => setFilter(sf.value)}
                  >
                    {sf.label}
                  </Button>
                ))}
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
                  <TableHead className="hidden lg:table-cell text-gray-400">Date</TableHead>
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
                    <TableCell className="hidden lg:table-cell text-gray-400 text-sm">
                      {format(new Date(q.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}

                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No queries found
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