"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();
  const [isProfessional, setIsProfessional] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    experience: "",
    skills: "",
    languages: "",
    consultationFee: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleToggle = () => {
    setIsProfessional(!isProfessional);
    setFormData({
      name: "",
      email: "",
      password: "",
      experience: "",
      skills: "",
      languages: "",
      consultationFee: ""
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isProfessional
        ? "http://localhost:5000/api/professionals/signup"
        : "http://localhost:5000/api/users/signup";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/login");
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden py-12">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-xl w-full bg-card p-10 rounded-[3rem] border border-border shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-foreground mb-4">
            Join the Platform
          </h1>
          
          {/* Custom Toggle Switch */}
          <div className="inline-flex bg-background border border-border p-1 rounded-2xl mb-2">
            <button 
              onClick={() => !isProfessional || handleToggle()}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isProfessional ? 'bg-primary text-white shadow-lg' : 'text-foreground/40 hover:text-foreground'}`}
            >
              User
            </button>
            <button 
              onClick={() => isProfessional || handleToggle()}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isProfessional ? 'bg-primary text-white shadow-lg' : 'text-foreground/40 hover:text-foreground'}`}
            >
              Professional
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-4">Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                className="w-full p-4 rounded-2xl bg-background/50 border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-4">Email</label>
              <input
                type="email"
                name="email"
                placeholder="john@example.com"
                className="w-full p-4 rounded-2xl bg-background/50 border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-4">Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full p-4 rounded-2xl bg-background/50 border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {isProfessional && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-4">Experience</label>
                  <input
                    type="text"
                    name="experience"
                    placeholder="e.g. 5 Years"
                    className="w-full p-4 rounded-2xl bg-background/50 border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground"
                    value={formData.experience}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-4">Fee (INR)</label>
                  <input
                    type="number"
                    name="consultationFee"
                    placeholder="500"
                    className="w-full p-4 rounded-2xl bg-background/50 border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    required
                    min={0}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-4">Skills</label>
                  <input
                    type="text"
                    name="skills"
                    placeholder="Sustainability, Renewable Energy"
                    className="w-full p-4 rounded-2xl bg-background/50 border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground"
                    value={formData.skills}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-4">Languages</label>
                  <input
                    type="text"
                    name="languages"
                    placeholder="English, Hindi"
                    className="w-full p-4 rounded-2xl bg-background/50 border border-border focus:border-primary/50 outline-none transition-all font-bold text-foreground"
                    value={formData.languages}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-primary text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Confirm & Sign Up"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-foreground/40">
            Already have an account?{" "}
            <a href="/login" className="text-primary font-black hover:underline underline-offset-4">
              Log In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}