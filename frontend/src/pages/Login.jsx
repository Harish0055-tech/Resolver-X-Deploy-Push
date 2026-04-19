import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ModeToggle } from "@/components/mode-toggle";

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "123";

const loginTypeMeta = {
  user: {
    title: "User",
  },
  resolver: {
    title: "Resolver",
  },
  admin: {
    title: "Admin",
  },
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState("user");

  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    const result = await login(email, password);

    if (!result.success) {
      toast.error(result.message || "Login failed");
      return;
    }

    const normalizedEmail = String(result.username || email).toLowerCase();
    const isAdminAccount = result.role === "admin";
    const isSuperAdmin = result.isSuperAdmin || normalizedEmail === ADMIN_EMAIL;

    if (loginType === "admin") {
      if (!isSuperAdmin || normalizedEmail !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        logout();
        toast.error("Invalid admin credentials");
        return;
      }
    } else if (loginType === "resolver") {
      if (!isAdminAccount || isSuperAdmin) {
        logout();
        toast.error("Invalid resolver credentials");
        return;
      }
    } else if (isAdminAccount) {
      logout();
      toast.error("Use Resolver/Admin login");
      return;
    }

    toast.success("Login successful");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#020617] px-4 text-white">

      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <Card className="w-full max-w-5xl grid md:grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">

        {/* LEFT */}
        <div className="hidden md:flex flex-col justify-center p-10 border-r border-white/10">
          <h1 className="text-4xl font-semibold tracking-tight">
            Resolve <span className="text-yellow-400">X</span>
          </h1>

          <p className="mt-4 text-sm text-gray-400 leading-6">
            A premium support platform designed to streamline query handling,
            empower resolvers, and give admins full control.
          </p>

          <div className="mt-8 space-y-3 text-sm text-gray-300">
            <p>✔ Role-based access</p>
            <p>✔ Smart workflow</p>
            <p>✔ Clean & scalable UI</p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="p-8 md:p-10">

          <CardContent className="p-0">

            <div className="mb-6">
              <h2 className="text-3xl font-semibold text-white">Sign in</h2>
              <p className="text-sm text-gray-400 mt-1">
                Access your account
              </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/10">
              {["user", "resolver", "admin"].map((type) => (
                <button
                  key={type}
                  onClick={() => setLoginType(type)}
                  className={`flex-1 py-2 text-sm rounded-lg transition ${
                    loginType === type
                      ? "bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-medium"
                      : "text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {loginTypeMeta[type].title}
                </button>
              ))}
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              <div>
                <Label className="text-gray-300">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 h-11 bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-yellow-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label className="text-gray-300">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 h-11 bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-yellow-500"
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-medium hover:opacity-90"
              >
                Sign in as {loginTypeMeta[loginType].title}
              </Button>

            </form>
          </CardContent>

          <CardFooter className="flex flex-col mt-6 space-y-4 p-0">

            <p className="text-sm text-center text-gray-400">
              Don’t have an account?{" "}
              <Link to="/register" className="text-yellow-400 hover:underline">
                Sign up
              </Link>
            </p>

          </CardFooter>
        </div>
      </Card>
    </div>
  );
};

export default Login;