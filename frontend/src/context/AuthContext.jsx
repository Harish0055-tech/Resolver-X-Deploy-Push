import { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";

const AuthContext = createContext(undefined);
const SUPER_ADMIN_EMAIL = "admin@admin.com";

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [userUsername, setUserUsername] = useState(null);
    const [userFullName, setUserFullName] = useState(null);
    const [userCategory, setUserCategory] = useState(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (isAuthenticated && userUsername) {
            const newSocket = io("http://localhost:5000", {
                transports: ["websocket", "polling"],
            });
            newSocket.on("connect", () => {
                newSocket.emit("join", userUsername);
            });
            newSocket.on("notification", (notif) => {
                toast("System Notification", {
                    description: notif.message,
                });
            });
            setSocket(newSocket);
            return () => newSocket.close();
        }
    }, [isAuthenticated, userUsername]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data._id) {
                    setIsAuthenticated(true);
                    setUserRole(data.role);
                    setUserUsername(data.username);
                    setUserFullName(data.fullName);
                    setUserCategory(data.category || null);
                    setIsSuperAdmin(Boolean(data.isSuperAdmin || String(data.username || "").toLowerCase() === SUPER_ADMIN_EMAIL));
                } else {
                    localStorage.removeItem("token");
                }
            })
            .catch(() => localStorage.removeItem("token"))
            .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        const normalizedUsername = String(username || "").trim().toLowerCase();
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: normalizedUsername, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            setIsAuthenticated(true);
            setUserRole(data.user.role);
            setUserUsername(data.user.username);
            setUserFullName(data.user.fullName);
            setUserCategory(data.user.category || null);
            setIsSuperAdmin(Boolean(data.user.isSuperAdmin || String(data.user.username || "").toLowerCase() === SUPER_ADMIN_EMAIL));
            localStorage.setItem("token", data.token);
            return { success: true, role: data.user.role, username: data.user.username, category: data.user.category, isSuperAdmin: Boolean(data.user.isSuperAdmin) };
        } else {
            return { success: false, message: data.message };
        }
    };

    const register = async (fullName, username, password, role, category) => {
        const normalizedUsername = String(username || "").trim().toLowerCase();
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, username: normalizedUsername, password, role, category })
        });
        const data = await res.json();
        
        if (res.ok) {
            setIsAuthenticated(true);
            setUserRole(data.user.role);
            setUserUsername(data.user.username);
            setUserFullName(data.user.fullName);
            setUserCategory(data.user.category || null);
            setIsSuperAdmin(Boolean(data.user.isSuperAdmin || String(data.user.username || "").toLowerCase() === SUPER_ADMIN_EMAIL));
            localStorage.setItem("token", data.token);
            return { success: true };
        } else {
            return { success: false, message: data.message };
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUserRole(null);
        setUserUsername(null);
        setUserFullName(null);
        setUserCategory(null);
        setIsSuperAdmin(false);
        localStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, userRole, userUsername, userFullName, userCategory, isSuperAdmin, loading, login, register, logout, socket }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
