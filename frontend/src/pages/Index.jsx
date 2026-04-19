const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#020617] text-white px-4">
      <div className="text-center max-w-xl">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          Welcome to <span className="bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">ResolveX</span>
        </h1>

        <p className="text-gray-400 text-base md:text-lg mb-6">
          A premium support management system to handle queries efficiently and professionally.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/login">
            <button className="w-full sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-medium hover:opacity-90 transition">
              Login
            </button>
          </a>

          <a href="/register">
            <button className="w-full sm:w-auto px-6 py-2 rounded-xl border border-white/20 text-white hover:bg-white/10 transition">
              Register
            </button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;