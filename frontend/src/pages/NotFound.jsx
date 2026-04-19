import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#020617] text-white px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">
          404
        </h1>

        <p className="text-lg text-gray-300 mb-2">
          Page not found
        </p>

        <p className="text-sm text-gray-500 mb-6">
          The page you're looking for doesn’t exist or has been moved.
        </p>

        <Link to="/">
          <button className="px-6 py-2 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-medium hover:opacity-90 transition">
            Go to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;