import { Navbar } from "@/components/Navbar";
import { ChatBot } from "@/components/ChatBot.jsx";
import { useAuth } from "@/context/AuthContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { userRole } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
      {/* Only show chatbot on user side, not admin */}
      {userRole !== "admin" && <ChatBot />}
    </div>
  );
}
