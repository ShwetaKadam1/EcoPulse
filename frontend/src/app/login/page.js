"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1️⃣ Firebase login
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCred.user.getIdToken();

      // 2️⃣ Ask backend for role
      const res = await fetch("http://localhost:5000/api/loginRole", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // 3️⃣ Redirect based on role
      if (data.role === "user") {
        router.push("/user/dashboard");
      } else if (data.role === "professional") {
        router.push("/professional/dashboard");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Soft Green Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />

      <div className="max-w-md w-full bg-card p-10 rounded-[2.5rem] border border-border shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/30">
            Log in to continue
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-500 text-xs font-bold text-center italic">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-4">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full p-4 rounded-2xl bg-background border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground placeholder:text-foreground/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-4">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-4 rounded-2xl bg-background border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground placeholder:text-foreground/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Login to Account"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-foreground/40">
            Don’t have an account?{" "}
            <a href="/signup" className="text-primary font-black hover:underline underline-offset-4">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}