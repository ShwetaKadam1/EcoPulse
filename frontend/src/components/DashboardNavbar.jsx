"use client";

import { auth } from "@/firebase/client";

export default function DashboardNavbar({ toggleDark, dark }) {
  return (
    <nav className="w-full bg-background/80 backdrop-blur-xl border-b border-border py-4 px-8 flex justify-between items-center sticky top-0 z-50">
      
      {/* Brand Identity */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-6 bg-primary rounded-full animate-pulse" />
        <h1 className="text-xl font-black tracking-tighter text-foreground uppercase">
          Eco<span className="text-primary">Pulse</span>
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button 
          onClick={toggleDark} 
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-border text-foreground hover:border-primary/50 hover:text-primary transition-all shadow-sm"
          title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {dark ? (
            <span className="text-lg">☀️</span>
          ) : (
            <span className="text-lg">🌙</span>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={async () => {
            const confirmLogout = window.confirm("Are you sure you want to exit?");
            if (confirmLogout) {
              await auth.signOut();
              window.location.href = "/";
            }
          }}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Logout</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>
    </nav>
  );
}