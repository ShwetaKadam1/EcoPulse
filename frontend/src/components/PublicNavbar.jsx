"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full bg-background/80 backdrop-blur-md border-b border-border py-3 px-8 flex justify-between items-center sticky top-0 z-50">
      
      {/* LOGO */}
      <div className="flex items-center gap-3 group">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
            <img src="/logo.png" alt="EcoTrack Logo" className="w-7 h-7 object-contain" />
          </div>
          <span className="text-xl font-black tracking-tighter text-foreground">
            Eco<span className="text-primary">Pulse</span>
          </span>
        </Link>
      </div>

      {/* NAV LINKS */}
      <div className="hidden md:flex items-center gap-2 bg-foreground/[0.03] p-1.5 rounded-2xl border border-border/50">
        <NavLink href="/" active={pathname === "/"}>Home</NavLink>
        <NavLink href="/#about" active={false}>About</NavLink>
        
        <div className="w-[1px] h-4 bg-border mx-2" /> {/* Divider */}
        
        <NavLink href="/login" active={pathname === "/login"}>Login</NavLink>
        <Link 
          href="/signup" 
          className="ml-2 px-5 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          Get Started
        </Link>
      </div>

      {/* MOBILE MENU ICON */}
      <div className="md:hidden">
        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-foreground/5 text-foreground">
          <span className="text-xl">☰</span>
        </button>
      </div>
    </nav>
  );
}

// Internal Helper for cleaner Link styling
function NavLink({ href, children, active }) {
  return (
    <Link 
      href={href} 
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
        active 
        ? "bg-card text-primary shadow-sm border border-border" 
        : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"
      }`}
    >
      {children}
    </Link>
  );
}