import React from "react";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 via-blue-200 to-blue-50 dark:from-[#0B1D3A] dark:via-[#0F2952] dark:to-[#1A3A6E]">
      <h1 className="text-5xl font-extrabold text-blue-700 dark:text-blue-300 mb-6 tracking-tight">Welcome to PolarisTech</h1>
      <p className="text-lg text-slate-700 dark:text-slate-200 max-w-xl text-center mb-8">
        Your all-in-one travel agency management platform. Streamline bookings, manage packages, and empower your team with modern tools.
      </p>
      <div className="flex gap-4">
        <a href="/login" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition">Login</a>
        <a href="/register" className="px-6 py-3 bg-white dark:bg-[#0F1E35] border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-xl font-semibold text-lg transition hover:bg-blue-50 dark:hover:bg-[#1a2332]">Register</a>
      </div>
    </div>
  );
};

export default Home;
