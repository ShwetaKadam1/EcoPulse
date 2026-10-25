"use client";
import { useState } from "react";
import adminApi from "@/lib/adminApi";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.post("/admin/login", { username, password });

      if (res.data.success && res.data.token) {
        localStorage.setItem("admin_token", res.data.token);
        window.location.href = "/admin/dashboard";
      }
    } catch {
      setError("Invalid credentials. Access denied.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />

      <div className="max-w-md w-full bg-card p-10 rounded-[3rem] border border-border shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 mb-6 group transition-all hover:scale-110">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2">
            ADMIN GATE
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30">
            Secure Platform Control
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-shake">
            <p className="text-red-500 text-xs font-black uppercase text-center tracking-widest">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-4">
              Identity
            </label>
            <input
              type="text"
              placeholder="Username"
              className="w-full p-4 rounded-2xl bg-background/50 border border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-foreground placeholder:text-foreground/20"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-4">
              Secret Key
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-4 rounded-2xl bg-background/50 border border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-foreground placeholder:text-foreground/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-primary text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:grayscale"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">
            Protected by End-to-End Encryption
          </p>
        </div>
      </div>
    </div>
  );
}