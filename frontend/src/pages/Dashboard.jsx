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
    { label: "Total Queries", count: counts.total, icon: Inbox, color: "text-primary" },
    { label: "Open", count: counts.open, icon: AlertCircle, color: "text-[hsl(var(--info))]" },
    { label: "In Progress", count: counts.inProgress, icon: Clock, color: "text-[hsl(var(--warning))]" },
    { label: "Resolved", count: counts.resolved, icon: CheckCircle2, color: "text-[hsl(var(--success))]" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Overview of support queries</p>
          </div>
          <Link to="/submit">
            <Button className="gap-1.5">
              <PlusCircle className="h-4 w-4" /> New Query
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.count}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters + Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Queries</CardTitle>
              <div className="flex gap-1">
                {statusFilters.map((sf) => (
                  <Button
                    key={sf.value}
                    variant={filter === sf.value ? "secondary" : "ghost"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setFilter(sf.value)}
                  >
                    {sf.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((q) => (
                  <TableRow key={q.id} className="cursor-pointer" onClick={() => navigate(`/queries/${q.id}`)}>
                    <TableCell className="font-mono text-xs">{q.id}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{q.subject}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{q.category}</TableCell>
                    <TableCell><PriorityBadge priority={q.priority} /></TableCell>
                    <TableCell><StatusBadge status={q.status} /></TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {format(new Date(q.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
