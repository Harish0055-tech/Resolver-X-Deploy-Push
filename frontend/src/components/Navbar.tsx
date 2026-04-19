import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PlusCircle, List, Bell, User } from "lucide-react";

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
import { useQueries } from "@/context/QueryContext";
import { ModeToggle } from "@/components/mode-toggle";

export function Navbar() {
  const { pathname } = useLocation();
  const { logout, userRole } = useAuth();
  const { queries } = useQueries();

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (userRole !== 'admin') return;
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, [userRole]);

  const breachedQueries = useMemo(() => {
    if (userRole !== 'admin') return [];
    
    return queries.filter((q) => {
      if (q.status === 'resolved' || q.status === 'closed') return false;
      const created = new Date(q.createdAt).getTime();
      const elapsedMins = (now - created) / (1000 * 60);

      if (q.priority === 'critical') return elapsedMins > 45;
      if (q.priority === 'high') return elapsedMins > 90;
      if (q.priority === 'medium' || q.priority === 'low') return elapsedMins > 240;
      return false;
    });
  }, [queries, userRole, now]);

  const navItems = userRole === 'admin'
    ? [
      { label: "Resolver Dashboard", path: "/", icon: LayoutDashboard },
    ]
    : [
      { label: "Dashboard", path: "/", icon: LayoutDashboard },
      { label: "Submit Query", path: "/submit", icon: PlusCircle },
      { label: "My Queries", path: "/queries", icon: List },
    ];

  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="flex h-14 items-center gap-4 px-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary mr-4">
          <div className="h-7 w-7 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-black">
            RX
          </div>
          <span className="hidden sm:inline">Resolve X</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={pathname === item.path ? "secondary" : "ghost"}
                size="sm"
                className={cn("gap-1.5 text-sm", pathname === item.path && "font-semibold")}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Button>
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />


        {/* Theme Toggle */}
        <ModeToggle />

        {/* Right side */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {breachedQueries.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>SLA Breached Queries ({breachedQueries.length})</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {breachedQueries.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No active SLA breaches
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                {breachedQueries.map((q) => (
                  <DropdownMenuItem key={q.id} asChild>
                    <Link to={userRole === 'admin' ? `/?id=${q.id}` : `/queries/${q.id}`} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-sm">{q.id}</span>
                        <span className="text-xs font-semibold text-destructive uppercase">{q.priority}</span>
                      </div>
                      <span className="text-xs text-muted-foreground truncate w-full">{q.subject}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account ({userRole})</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
