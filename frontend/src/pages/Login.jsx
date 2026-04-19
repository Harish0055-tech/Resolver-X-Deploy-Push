import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ModeToggle } from "@/components/mode-toggle";

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "123";

const demoCredentials = [
  { type: "User", email: "user@test.com", password: "user123" },
  { type: "Resolver", email: "resolver@test.com", password: "resolver@123" },
  { type: "Admin", email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
];

const loginTypeMeta = {
  user: {
    title: "User",
    gradient: "from-sky-500 to-cyan-500",
  },
  resolver: {
    title: "Resolver",
    gradient: "from-emerald-500 to-teal-500",
  },
  admin: {
    title: "Admin",
    gradient: "from-orange-500 to-rose-500",
  },
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState("user");

  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const activeMeta = loginTypeMeta[loginType];

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 p-4">

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <Card className="w-full max-w-5xl grid md:grid-cols-2 overflow-hidden shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-700">

        {/* LEFT SIDE */}
        <div className="hidden md:flex flex-col justify-center p-10 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <h1 className="text-4xl font-bold tracking-tight">
            Resolve X
          </h1>
          <p className="mt-4 text-sm text-slate-300 leading-6">
            A smart issue resolution platform where users report, resolvers fix,
            and admins manage everything efficiently.
          </p>

          <div className="mt-8 space-y-3 text-sm">
            <p>✔ Role-based authentication</p>
            <p>✔ Clean workflow management</p>
            <p>✔ Fast and scalable system</p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-8 md:p-10 bg-white dark:bg-slate-900">

          <CardContent className="p-0">

            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Sign in
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Access your account securely
              </p>
            </div>

            {/* Login Type Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-6">
              {["user", "resolver", "admin"].map((type) => (
                <button
                  key={type}
                  onClick={() => setLoginType(type)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                    loginType === type
                      ? `bg-gradient-to-r ${loginTypeMeta[type].gradient} text-white`
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {loginTypeMeta[type].title}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 mt-1 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 mt-1 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                className={`w-full h-12 text-base font-semibold rounded-lg bg-gradient-to-r ${activeMeta.gradient} shadow-md hover:shadow-lg transition`}
              >
                Sign in as {activeMeta.title}
              </Button>

            </form>
          </CardContent>

          {/* Footer */}
          <CardFooter className="flex flex-col mt-6 space-y-4 p-0">

            {/* Demo Table */}
            {/* <div className="w-full">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Demo Credentials
              </p>

              <Table className="border rounded-lg overflow-hidden">
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Password</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {demoCredentials.map((cred) => (
                    <TableRow
                      key={cred.type}
                      className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => {
                        setLoginType(cred.type.toLowerCase());
                        setEmail(cred.email);
                        setPassword(cred.password);
                      }}
                    >
                      <TableCell>{cred.type}</TableCell>
                      <TableCell>{cred.email}</TableCell>
                      <TableCell>{cred.password}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div> */}

            {/* Signup */}
            <p className="text-sm text-center text-muted-foreground">
              Don’t have an account?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">
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