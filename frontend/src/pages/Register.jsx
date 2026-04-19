import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ModeToggle } from "@/components/mode-toggle";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (name && email && password) {
            const result = await register(name, email, password, "user", null);
            if (result.success) {
                toast.success("Account created successfully!");
                navigate("/");
            } else {
                toast.error(result.message || "Registration failed");
            }
        } else {
            toast.error("Please fill in all fields");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#020617] px-4 text-white">

            <div className="absolute top-4 right-4">
                <ModeToggle />
            </div>

            <Card className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">

                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-semibold">
                        Create Account
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Join ResolveX and get started
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-5">

                        <div>
                            <Label className="text-gray-300">Full Name</Label>
                            <Input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-500"
                                required
                            />
                        </div>

                        <div>
                            <Label className="text-gray-300">Email</Label>
                            <Input
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-500"
                                required
                            />
                        </div>

                        <div>
                            <Label className="text-gray-300">Password</Label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 h-11 bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-yellow-500"
                                required
                            />
                        </div>

                        <div>
                            <Label className="text-gray-300">Confirm Password</Label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 h-11 bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-yellow-500"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-medium hover:opacity-90 transition"
                        >
                            Register
                        </Button>

                    </form>
                </CardContent>

                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-400">
                        Already have an account?{" "}
                        <Link to="/login" className="text-yellow-400 hover:underline">
                            Login here
                        </Link>
                    </p>
                </CardFooter>

            </Card>
        </div>
    );
};

export default Register;