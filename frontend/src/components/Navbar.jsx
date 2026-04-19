import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, List, Bell, Users, ShieldCheck, AlertTriangle, RefreshCw, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { ModeToggle } from "@/components/mode-toggle";

// ─── Relative time helper ────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Notification type → color ───────────────────────────────────────────────
function notifStyle(type) {
  switch (type) {
    case 'sla_breach':    return 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400';
    case 'reassignment':  return 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400';
    case 'role_update':   return 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400';
    case 'new_query':     return 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400';
    case 'query_update':  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400';
    default:              return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  }
}

function notifLabel(type) {
  switch (type) {
    case 'sla_breach':   return 'SLA';
    case 'reassignment': return 'ASSIGNED';
    case 'role_update':  return 'ROLE';
    case 'new_query':    return 'NEW';
    case 'query_update': return 'UPDATE';
    default:             return 'INFO';
  }
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
export function Navbar() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { logout, userRole, userFullName, userUsername, userCategory, isSuperAdmin, socket } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0); // increments every 30s to refresh relative times

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoadingNotifs(true);
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch { /* ignore */ }
    finally { setLoadingNotifs(false); }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for real-time notifications via socket
  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchNotifications();
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socket, fetchNotifications]);

  // Refresh relative timestamps every 30 seconds
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const unreadNotifs = notifications.filter(n => !n.read);
  const unreadCount = unreadNotifs.length;

  // Mark all as read
  const markAllRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  // Mark single as read
  const markOneRead = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch { /* ignore */ }
  };

  const extractQueryId = (msg) => {
    let match = msg.match(/(QR-\d+)/);
    if (match) return match[1];
    match = msg.match(/Q\.id:\s*(\d+)/);
    if (match) return `QR-${match[1]}`;
    return null;
  };

  const handleNotificationClick = (notif) => {
    const qId = extractQueryId(notif.message);
    if (qId) {
      navigate(`/queries/${qId}`);
      setOpen(false); // Dropdown closes immediately
    }
  };

  const currentPath =
    userRole === "admin" && isSuperAdmin && pathname === "/" && !search
      ? "/?tab=users"
      : `${pathname}${search || ""}`;

  const navItems =
    userRole === "admin"
      ? isSuperAdmin
        ? [
            { label: "Users", path: "/?tab=users", icon: Users },
            { label: "Resolvers", path: "/?tab=resolvers", icon: ShieldCheck },
          ]
        : [{ label: "Resolver Dashboard", path: "/", icon: LayoutDashboard }]
      : [
          { label: "Dashboard", path: "/", icon: LayoutDashboard },
          { label: "Submit Query", path: "/submit", icon: PlusCircle },
          { label: "My Queries", path: "/queries", icon: List },
        ];

  const getInitials = () => {
    if (!userFullName) return "U";
    return userFullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">

        {/* Brand */}
        <Link to="/" className="mr-4 flex items-center gap-2 text-lg font-bold tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-extrabold shadow-md">
            RX
          </div>
          <span className="hidden sm:inline text-slate-900 dark:text-white">Resolve X</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-1.5 text-sm rounded-md transition",
                  currentPath === item.path
                    ? "bg-white dark:bg-slate-900 shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-300"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Theme */}
        <ModeToggle />

        {/* ── Notifications Bell ── */}
        <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (v) fetchNotifications(); }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="rounded-full gap-1.5 px-2 bg-slate-100/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors">
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <Bell className="h-[18px] w-[18px] text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-96 border-slate-200 dark:border-slate-700 p-0" forceMount>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                Notifications {unreadCount > 0 && <span className="ml-1 text-xs text-red-500">({unreadCount} new)</span>}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={fetchNotifications}>
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </Button>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-primary" onClick={markAllRead}>
                    <CheckCheck className="h-3 w-3" />
                    Mark all read
                  </Button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loadingNotifs ? (
                <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">Loading…</div>
              ) : unreadNotifs.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-200">No new notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
                </div>
              ) : (
                unreadNotifs.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className="flex items-start gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-blue-50/20 dark:bg-blue-950/20"
                  >
                    {/* Type badge */}
                    <span className={cn("mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", notifStyle(notif.type))}>
                      {notifLabel(notif.type)}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-snug">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>

                    {/* Mark read button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 rounded-full text-blue-500/70 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors mt-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        markOneRead(notif._id);
                      }}
                      title="Mark as read"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative flex items-center justify-center rounded-full focus:outline-none">
              <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center font-bold text-slate-900 dark:text-white shadow-sm transition hover:shadow-md">
                {getInitials()}
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-slate-900" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-900 dark:text-white font-bold">
                  {getInitials()}
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{userFullName || "User"}</p>
                  <p className="text-xs text-muted-foreground">{userUsername || "username"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-primary/10 text-primary capitalize">
                  {userRole || "user"}
                </span>
                {userRole === "admin" && userCategory && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-muted text-muted-foreground">
                    {userCategory}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500 cursor-pointer">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}