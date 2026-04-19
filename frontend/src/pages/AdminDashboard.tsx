import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries } from "@/context/QueryContext";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Inbox, Clock, CheckCircle2, AlertCircle, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusFilters = [
    { label: "All", value: "all" },
    { label: "Open", value: "open" },
    { label: "In Progress", value: "in-progress" },
    { label: "Resolved", value: "resolved" },
    { label: "Closed", value: "closed" },
];

export default function AdminDashboard() {
    const { queries, updateQueryStatus, deleteQuery } = useQueries();
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

    const handleStatusUpdate = (e, id, status) => {
        e.stopPropagation();
        updateQueryStatus(id, status);
        toast.success(`Status updated to ${status}`);
    };

    const handleDelete = (e, id, subject) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete query "${subject}"?`)) {
            deleteQuery(id);
            toast.success("Query deleted successfully");
        }
    };

    const summaryCards = [
        { label: "Total Queries", count: counts.total, icon: Inbox },
        { label: "Open", count: counts.open, icon: AlertCircle },
        { label: "In Progress", count: counts.inProgress, icon: Clock },
        { label: "Resolved", count: counts.resolved, icon: CheckCircle2 },
    ];

    return (
        <AppLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-semibold text-white">Resolver Dashboard</h1>
                    <p className="text-gray-400 text-sm">Manage and resolve support queries</p>
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

                {/* Table */}
                <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-white">All Queries</CardTitle>
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
                                    <TableHead className="text-gray-400">Actions</TableHead>
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
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-white/10"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreVertical className="h-4 w-4 text-gray-300" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="bg-[#0F172A] border border-white/10 text-white"
                                                >
                                                    <DropdownMenuItem onClick={(e) => handleStatusUpdate(e, q.id, "open")}>
                                                        Mark as Open
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => handleStatusUpdate(e, q.id, "in-progress")}>
                                                        Mark as In Progress
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => handleStatusUpdate(e, q.id, "resolved")}>
                                                        Mark as Resolved
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => handleStatusUpdate(e, q.id, "closed")}>
                                                        Mark as Closed
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => handleDelete(e, q.id, q.subject)}
                                                        className="text-red-400 focus:text-red-400"
                                                    >
                                                        Delete Query
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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