import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">

      {/* ===== BACKGROUND IMAGE + OVERLAY ===== */}
      <div className="absolute inset-0 z-0">
        <img
          src="/background.png"
          alt="Eco Background"
          className="w-full h-full object-cover opacity-60"
        />
        {/* Advanced Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/40 to-primary/5 backdrop-blur-[2px]" />
      </div>

      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] z-0" />
      <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] z-0" />

      {/* ===== CONTENT WRAPPER ===== */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/*  HERO SECTION  */}
        <section className="flex flex-col lg:flex-row items-center justify-between px-8 md:px-20 py-24 gap-12">

          {/* LEFT TEXT */}
          <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter text-foreground drop-shadow-sm">
              Track Your <br />
              <span className="text-primary italic">Carbon.</span> <br />
              Improve Your <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">Lifestyle.</span>
            </h1>

            <p className="text-lg text-foreground/60 font-medium max-w-lg leading-relaxed">
              Join thousands of eco-conscious citizens using data-driven insights to reduce their environmental impact.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/signup">
                <button className="px-10 py-5 rounded-2xl bg-primary text-white font-black uppercase text-[12px] tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                  Get Started Free
                </button>
              </Link>

              <Link href="/login">
                <button className="px-10 py-5 rounded-2xl bg-card border border-border text-foreground font-black uppercase text-[12px] tracking-widest hover:bg-foreground/5 transition-all">
                  Log In
                </button>
              </Link>
            </div>
          </div>

          {/* ILLUSTRATION — ECO COLLAGE */}
          <div className="relative w-full lg:w-1/2 flex justify-center lg:justify-end animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="flex gap-4 md:gap-6 items-center">
              {/* Left Column */}
              <div className="flex flex-col gap-4 md:gap-6 mt-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/40 transition-all opacity-0 group-hover:opacity-100" />
                  <img src="/eco1.png" alt="Eco 1" className="relative w-40 h-40 md:w-56 md:h-56 object-cover rounded-3xl border border-white/20 shadow-2xl transition-transform group-hover:-rotate-2" />
                </div>
                <img src="/eco2.png" alt="Eco 2" className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-3xl border border-white/20 shadow-xl self-end" />
              </div>
              {/* Right Column */}
              <div className="relative">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <img src="/eco3.png" alt="Eco 3" className="w-56 h-[380px] md:w-72 md:h-[500px] object-cover rounded-[3rem] border border-white/20 shadow-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS  */}
        <section id="about" className="py-24 px-6 md:px-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter mb-4">
              Make an <span className="text-primary italic">Impact</span>
            </h2>
            <div className="w-20 h-1.5 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard 
              title="Log Activities" 
              desc="Track food, travel, shopping, and electricity — all in one centralized dashboard." 
              icon="📊"
            />
            <FeatureCard 
              title="Analyze & Improve" 
              desc="View real-time charts and AI-driven insights to lower your monthly footprint." 
              icon="🌱"
              highlight
            />
            <FeatureCard 
              title="Professional Advice" 
              desc="Connect with certified climate coaches for personalized lifestyle roadmaps." 
              icon="🛡️"
            />
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-20 px-6 md:px-20 pb-12">
          <div className="bg-card border border-border rounded-[3rem] p-12 md:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              <div className="lg:col-span-2">
                <h3 className="text-3xl font-black text-primary mb-4">EcoPulse</h3>
                <p className="text-foreground/50 font-medium max-w-sm">
                  Empowering the next generation of eco-conscious citizens through data and community.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Location</h4>
                <p className="text-sm font-bold text-foreground/70 leading-relaxed">
                  EcoPulse HQ, 23 Greenway Park<br />Bengaluru, India
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Follow Us</h4>
                <div className="flex gap-4">
                  {['🌐', '📘', '📸', '💼'].map((icon, i) => (
                    <button key={i} className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Bar - Enhanced Copyright */}
    <div className="mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-6">
        <p className="text-xs font-black uppercase tracking-widest text-foreground">
          © {new Date().getFullYear()} EcoPulse Global
        </p>
        <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-primary/30" />
        <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
        </div>
      </div>
      </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, icon, highlight = false }) {
  return (
    <div className={`p-10 rounded-[2.5rem] border transition-all duration-500 group relative ${
      highlight 
      ? "bg-white/95 border-primary/40 shadow-[0_20px_50px_rgba(34,197,94,0.2)] scale-105 z-20" 
      : "bg-white/70 border-white/40 hover:border-primary/30 shadow-sm backdrop-blur-md"
    }`}>
      {/* Decorative Glow for Highlight Card */}
      {highlight && (
        <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-[3rem] blur-2xl -z-10 opacity-50" />
      )}

      <div className="text-4xl mb-6 group-hover:scale-110 transition-transform inline-block">
        {icon}
      </div>
      
      <h3 className={`text-2xl font-black mb-4 tracking-tight ${
        highlight ? "text-primary" : "text-foreground"
      }`}>
        {title}
      </h3>
      
      <p className={`font-medium leading-relaxed ${
        highlight ? "text-foreground/80" : "text-foreground/50"
      }`}>
        {desc}
      </p>
    </div>
  );
}