import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

// ─── Rule-based response engine ───────────────────────────────────────────────
const RULES = [

  // ── Greetings ──────────────────────────────────────────────────────────────
  {
    keywords: ["hello", "hi", "hey", "good morning", "good evening"],
    response:
      "👋 Hello! Welcome to ResolveX support. I can help with quick troubleshooting steps or guide you through the app. What's the issue?",
  },

  // ── IT Troubleshooting ─────────────────────────────────────────────────────
  {
    keywords: ["restart", "reboot", "turn off", "turn on", "power off", "shutdown"],
    response:
      "🔄 **Restart / Reboot Steps:**\n1. Save all open work first.\n2. Click **Start → Power → Restart** (Windows) or **Apple menu → Restart** (Mac).\n3. Wait for the system to fully boot up.\n4. Try your task again.\n\n💡 A restart fixes most temporary glitches, freezes, and slow performance.",
  },
  {
    keywords: ["slow", "lagging", "freezing", "frozen", "hang", "unresponsive", "not responding"],
    response:
      "🐢 **System is Slow / Freezing:**\n1. Close unused apps and browser tabs.\n2. Press **Ctrl + Shift + Esc** → open Task Manager → end high-CPU tasks.\n3. Restart the system.\n4. Check available storage — free up space if disk is full.\n5. If it keeps happening, submit a query so our team can investigate.",
  },
  {
    keywords: ["clear cache", "cache", "clear cookies", "cookies", "clear history", "browser cache"],
    response:
      "🧹 **Clear Browser Cache & Cookies:**\n1. Press **Ctrl + Shift + Delete** (Chrome/Edge/Firefox).\n2. Set time range to **All time**.\n3. Check **Cached images**, **Cookies**, and **Browsing history**.\n4. Click **Clear data**.\n5. Reload the page.\n\n💡 This fixes most 'page not loading' or 'old data showing' problems.",
  },
  {
    keywords: ["internet", "network", "wifi", "wi-fi", "no connection", "not connecting", "connection", "ethernet"],
    response:
      "🌐 **No Internet / Network Issue:**\n1. Check if other devices are connected to the same Wi-Fi.\n2. Restart your **router/modem** (unplug → wait 30 sec → plug back in).\n3. On your PC: **Settings → Network → Troubleshoot**.\n4. Try forgetting and rejoining the Wi-Fi network.\n5. If on ethernet, try a different cable or port.\n6. Still not working? Contact your IT admin or submit a query.",
  },
  {
    keywords: ["browser", "chrome", "edge", "firefox", "not loading", "page not loading", "website not opening"],
    response:
      "🌍 **Browser / Page Not Loading:**\n1. Check your internet connection first.\n2. Try refreshing with **Ctrl + Shift + R** (hard refresh).\n3. Open the page in a different browser.\n4. Clear cache and cookies (**Ctrl + Shift + Delete**).\n5. Disable browser extensions temporarily.\n6. If a specific site is down, check if others can open it too.",
  },
  {
    keywords: ["app not working", "application crash", "software crash", "crashed", "not opening", "won't open", "not launching"],
    response:
      "💥 **App Not Working / Crashing:**\n1. Force-close the app: **Ctrl + Shift + Esc** → find the app → End Task.\n2. Reopen the app.\n3. Restart your computer.\n4. Check if the app needs an update.\n5. Uninstall and reinstall the app if it keeps crashing.\n6. Still failing? Submit a query with the app name and error message.",
  },
  {
    keywords: ["error", "error message", "getting error", "error code", "failed", "failure"],
    response:
      "❗ **Seeing an Error Message?**\n1. Note the exact error message or code.\n2. Try the action again after a few seconds.\n3. Restart the app or browser.\n4. Search the error code online for quick fixes.\n5. If it persists, **submit a query** and include the error message — this helps our team resolve it faster.",
  },
  {
    keywords: ["printer", "print", "printing", "printer not working", "printer offline"],
    response:
      "🖨️ **Printer Not Working:**\n1. Check if the printer is powered on and connected.\n2. Set it as the **default printer**: Settings → Printers → Right-click → Set as default.\n3. Restart the print spooler: **Services → Print Spooler → Restart**.\n4. Reinstall or update the printer driver.\n5. Try printing a test page from printer settings.\n6. Still stuck? Submit a query with the printer model.",
  },
  {
    keywords: ["sound", "audio", "no sound", "volume", "speaker", "headphone", "mic", "microphone"],
    response:
      "🔊 **No Sound / Audio Issue:**\n1. Check volume isn't muted — click the speaker icon on the taskbar.\n2. Right-click speaker icon → **Sounds** → set correct playback device.\n3. Unplug and replug headphones/speakers.\n4. Restart the audio service: **Services → Windows Audio → Restart**.\n5. Update audio drivers from Device Manager.\n6. Restart your PC — this fixes most audio glitches.",
  },
  {
    keywords: ["screen", "display", "blank screen", "black screen", "monitor", "flickering", "resolution"],
    response:
      "🖥️ **Screen / Display Issue:**\n1. Check cable connections between PC and monitor.\n2. Press **Windows + P** to switch display modes.\n3. Restart your PC.\n4. Check display resolution: **Settings → Display → Resolution**.\n5. Update graphics drivers via Device Manager.\n6. Try a different cable/port (HDMI, VGA, DisplayPort).",
  },
  {
    keywords: ["keyboard", "mouse", "not working", "input", "typing", "cursor"],
    response:
      "⌨️ **Keyboard / Mouse Not Working:**\n1. Unplug and replug the device (USB devices).\n2. Try a different USB port.\n3. For wireless devices: check/replace batteries and re-pair via Bluetooth.\n4. Restart your computer.\n5. Go to **Device Manager** → check for driver errors → Update driver.\n6. Test with a different keyboard/mouse to rule out hardware failure.",
  },
  {
    keywords: ["storage", "disk full", "disk space", "out of space", "no space", "memory", "ram", "low memory"],
    response:
      "💾 **Low Storage / Memory:**\n1. Open **Disk Cleanup** (search in Start menu) → clean temp files.\n2. Uninstall apps you don't use: **Settings → Apps → Sort by size**.\n3. Move large files (videos/photos) to an external drive or cloud.\n4. Empty the **Recycle Bin**.\n5. For low RAM: close unused apps or browser tabs.\n6. Consider adding more RAM if this is a recurring issue.",
  },
  {
    keywords: ["update", "windows update", "software update", "driver update", "outdated"],
    response:
      "🔁 **Running Updates:**\n1. **Windows:** Settings → Update & Security → Windows Update → Check for updates.\n2. **Drivers:** Device Manager → Right-click device → Update driver.\n3. **Apps:** Open the app → Help/About → Check for updates.\n4. Always restart after updates to apply changes.\n5. If an update is causing problems, you can roll it back from Windows Update history.",
  },
  {
    keywords: ["virus", "malware", "hacked", "suspicious", "antivirus", "security", "infected"],
    response:
      "🛡️ **Virus / Security Concern:**\n1. **Do not click** suspicious links or download unknown files.\n2. Run a full scan with **Windows Defender**: Settings → Windows Security → Virus & threat protection.\n3. Disconnect from the internet if you suspect a severe infection.\n4. Change your passwords immediately from a different device.\n5. **Submit a query immediately** with details — our IT team will prioritize this.",
  },
  {
    keywords: ["vpn", "remote", "remote access", "work from home", "connect to office"],
    response:
      "🔒 **VPN / Remote Access Issue:**\n1. Make sure your internet connection is stable first.\n2. Disconnect and reconnect the VPN client.\n3. Check VPN credentials with your IT admin.\n4. Restart the VPN application.\n5. Try a different VPN server (if your client allows it).\n6. If VPN is not set up yet, submit a query requesting access.",
  },
  {
    keywords: ["password reset", "change password", "forgot password", "locked out"],
    response:
      "🔑 **Password Reset / Locked Out:**\n1. On the login page, check if there's a **Forgot Password** option.\n2. If not, contact your IT admin to reset your credentials.\n3. Submit a query with your username and a request for a password reset.\n4. Once reset, update your saved passwords in the browser to avoid confusion.",
  },
  {
    keywords: ["file", "file not found", "missing file", "can't open file", "corrupt file", "document"],
    response:
      "📁 **File Missing / Can't Open:**\n1. Search for the file using **Windows Search** (Win + S).\n2. Check the **Recycle Bin** — it may have been accidentally deleted.\n3. Check if the file is on a shared drive or cloud storage.\n4. If the file is corrupt, try opening with a different application.\n5. Right-click → **Properties** to verify the file isn't read-only or locked.\n6. For permanently deleted files, submit a query — IT may be able to recover it from backup.",
  },

  // ── ResolveX App Topics ────────────────────────────────────────────────────
  {
    keywords: ["submit", "new query", "raise", "create query", "open ticket"],
    response:
      "📝 **Submit a New Query:**\n1. Click **New Query** on the dashboard.\n2. Fill in Subject, Category, Priority, and Description.\n3. Click Submit.\nYou can track it anytime from **My Queries**.",
  },
  {
    keywords: ["status", "track", "check my query", "progress", "update on"],
    response:
      "🔍 Go to **My Queries** from the navigation bar. Each query shows its current status: Open, In Progress, Resolved, or Closed. Click any query for full details.",
  },
  {
    keywords: ["open status", "what is open"],
    response: "🟡 **Open** — Your query has been received and is waiting for an admin to pick it up.",
  },
  {
    keywords: ["in progress", "inprogress", "being worked"],
    response: "🔵 **In Progress** — An admin is actively working on your query. A response should come soon.",
  },
  {
    keywords: ["resolved"],
    response: "✅ **Resolved** — Your issue has been addressed. If not fully resolved, submit a new query with more details.",
  },
  {
    keywords: ["closed"],
    response: "🔒 **Closed** — The query is archived. For follow-up issues, please submit a new query.",
  },
  {
    keywords: ["priority", "urgent", "critical", "high priority"],
    response:
      "🚨 Set the **priority** (Low, Medium, High, Critical) when submitting a query. High and Critical queries are addressed first by our support team.",
  },
  {
    keywords: ["category", "type", "department"],
    response:
      "📂 Choose the **category** that best fits your issue when submitting (e.g., Technical, Billing, General). This routes your query to the right team.",
  },
  {
    keywords: ["delete", "remove query", "cancel query"],
    response: "🗑️ You can delete your queries from **My Queries** or the **Query Detail** page. Deleted queries cannot be recovered.",
  },
  {
    keywords: ["login", "sign in", "can't login"],
    response:
      "🔐 Ensure you're using the correct credentials. Credentials are saved automatically. If you're locked out, contact your administrator or submit a query.",
  },
  {
    keywords: ["register", "sign up", "create account"],
    response: "📋 Go to the **Register** page from the login screen, fill in your name, username, and password to create an account.",
  },
  {
    keywords: ["admin", "contact admin", "speak to someone"],
    response: "👩‍💼 Submit a query to reach an admin. All communication goes through the query system — there's no direct messaging.",
  },
  {
    keywords: ["reply", "notification", "response from admin"],
    response: "📬 Resolver replies appear in the **Query Detail** page. Go to **My Queries** and click your query to see all comments and updates.",
  },

  // ── General ────────────────────────────────────────────────────────────────
  {
    keywords: ["help", "guide", "what can you do", "what do you know", "options"],
    response:
      "💡 I can help with:\n\n🛠️ **Troubleshooting:**\n• Restart / reboot steps\n• Internet & network issues\n• Clear cache & cookies\n• App crashes & errors\n• Printer, sound, screen issues\n• Low storage or memory\n• Virus & security concerns\n• File issues\n\n📋 **ResolveX App:**\n• Submitting & tracking queries\n• Query statuses & priorities\n• Login & account help\n\nJust type your problem!",
  },
  {
    keywords: ["thank", "thanks", "thank you", "appreciated"],
    response: "🙏 You're welcome! Let me know if there's anything else I can help with.",
  },
  {
    keywords: ["bye", "goodbye", "exit", "quit"],
    response: "👋 Goodbye! Feel free to come back anytime. Have a great day!",
  },
];

function getBotReply(input) {
  const lower = input.toLowerCase().trim();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.response;
    }
  }
  return "🤔 I didn't quite get that. Try asking things like:\n• 'How to restart my system?'\n• 'Internet not working'\n• 'App is crashing'\n• 'Clear cache'\n• 'Submit a query'\n\nOr type **help** for a full list.";
}

// ─── Quick suggestion chips ────────────────────────────────────────────────────
const QUICK_REPLIES = [
  "Restart the system",
  "Internet not working",
  "Clear cache",
  "App is crashing",
  "Submit a query",
  "Help",
];

// ─── Component ────────────────────────────────────────────────────────────────
export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 0,
      from: "bot",
      text: "👋 Hi! I'm ResolveX Support Bot.\n\nI can help with common tech problems (restart, internet, cache, app errors) and guide you through the app.\n\nWhat's your issue?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg = { id: Date.now(), from: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const botReply = getBotReply(trimmed);
      const botMsg = { id: Date.now() + 1, from: "bot", text: botReply };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage(input);
  };

  const formatText = (text) =>
    text.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ));

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
          color: "hsl(var(--primary-foreground))",
        }}
        aria-label="Open support chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && (
          <span
            className="absolute w-full h-full rounded-full animate-ping opacity-30"
            style={{ background: "hsl(var(--primary))" }}
          />
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden border"
          style={{
            background: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            maxHeight: "520px",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.75))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">ResolveX Bot</p>
              <p className="text-xs opacity-80">Support Assistant • Always online</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3 text-sm"
            style={{ minHeight: 0, maxHeight: "320px" }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.from === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      msg.from === "bot"
                        ? "hsl(var(--primary) / 0.15)"
                        : "hsl(var(--secondary))",
                  }}
                >
                  {msg.from === "bot" ? (
                    <Bot className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className="max-w-[75%] px-3 py-2 rounded-2xl leading-relaxed text-xs"
                  style={
                    msg.from === "bot"
                      ? {
                          background: "hsl(var(--muted))",
                          color: "hsl(var(--foreground))",
                          borderBottomLeftRadius: "4px",
                        }
                      : {
                          background: "hsl(var(--primary))",
                          color: "hsl(var(--primary-foreground))",
                          borderBottomRightRadius: "4px",
                        }
                  }
                >
                  {formatText(msg.text)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-end gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(var(--primary) / 0.15)" }}
                >
                  <Bot className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div
                  className="px-3 py-2 rounded-2xl text-xs flex gap-1 items-center"
                  style={{ background: "hsl(var(--muted))", borderBottomLeftRadius: "4px" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr}
                onClick={() => sendMessage(qr)}
                className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors hover:bg-primary hover:text-primary-foreground"
                style={{
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--muted-foreground))",
                  background: "hsl(var(--muted) / 0.4)",
                }}
              >
                {qr}
              </button>
            ))}
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-2 px-3 py-3 border-t"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
              style={{ color: "hsl(var(--foreground))" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30 hover:scale-110 focus:outline-none"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }}
              aria-label="Send"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
