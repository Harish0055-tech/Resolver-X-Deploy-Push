import { Navbar } from "@/components/Navbar.jsx";
import { ChatBot } from "@/components/ChatBot.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

export function AppLayout({ children }) {
  const { userRole } = useAuth();

  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/20" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-amber-200/25 blur-3xl dark:bg-amber-400/10" />
      </div>
      <Navbar />
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
        {children}
      </main>
      {/* Only show chatbot on user side, not admin */}
      {userRole !== "admin" && <ChatBot />}
    </div>
  );
}
