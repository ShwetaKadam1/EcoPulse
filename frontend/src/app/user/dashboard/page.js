"use client";

import React, { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";              // axios wrapper that adds Firebase token
import { auth } from "@/firebase/client"; // your firebase client
import { loadStripe } from "@stripe/stripe-js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import confetti from 'canvas-confetti';


const COLORS = ["#34d399", "#06b6d4", "#f59e0b", "#3b82f6", "#a855f7", "#FF4500"];
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function DashboardPage() {
  // Global data
  const [user, setUser] = useState(null);
  const [last7, setLast7] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [section, setSection] = useState("dashboard"); 
  const [consultDate, setConsultDate] = useState("");
  const [consultNotes, setConsultNotes] = useState("");
  const [consultMsg, setConsultMsg] = useState("");
  const [showLogForm, setShowLogForm] = useState(false);
const [consultations, setConsultations] = useState([]);
const [activeConsultation, setActiveConsultation] = useState(null);
const [messages, setMessages] = useState([]);
const [chatText, setChatText] = useState("");
const [weeklyAdvice, setWeeklyAdvice] = useState(null);
const [logMsg, setLogMsg] = useState("");
const sectionNames = ["Travel", "Meals", "Electricity", "Water", "Shopping", "Gas Usage"];
const [openSections, setOpenSections] = useState(
  sectionNames.reduce((acc, name) => ({ ...acc, [name]: true }), {})
);
const [newTravel, setNewTravel] = useState({ mode: "car", km: "" });
const [newMeal, setNewMeal] = useState({ category: "vegetarian" });
const [newShopping, setNewShopping] = useState({ category: "clothes", quantity: 1 });
const [newGas, setNewGas] = useState({ type: "cylinder", minutes: "" });
const [logInput, setLogInput] = useState({
  travel: [],
  food: [],
  electricity: { 
    ac: 0, 
    fan: 0, 
    fridge: 24, // default for fridge
    tv: 0, 
    light: 0,
    laptop: 0,
    desktop: 0,
    mobile: 0,
    geyser: 0,
    washingMachine: 0,
    microwave: 0,
   evCharger: 0,
   gamingConsole: 0
  },
  water: { showerMinutes: 0, washingCycles: 0, roWasteLiters: 0, tapLiters: 0 },
  shopping: [],
  gas: [],
});
const [professionals, setProfessionals] = useState([]);
const [selectedProfessional, setSelectedProfessional] = useState(null);
const [amount, setAmount] = useState("");
const [donationSuccess, setDonationSuccess] = useState(false)
const toggleSection = (name) => {
  setOpenSections(prev => ({ ...prev, [name]: !prev[name] }));
};
const [successType, setSuccessType] = useState(null);
const [selectedPlan, setSelectedPlan] = useState(null);

  // fetch user + dashboard
useEffect(() => {
  let mounted = true;
  async function load() {
    setLoading(true);
    try {
      // wait briefly for firebase auth currentUser to be available
      let tries = 0;
      while (!auth.currentUser && tries < 8) {
        await new Promise((r) => setTimeout(r, 250));
        tries++;
      }

      // fetch user info + logs from FootprintLog collection
      const [meRes, logsRes, consultRes, adviceRes, prosRes] = await Promise.all([
        api.get("/api/users/me"),
        api.get("/api/logs"),
        api.get("/api/users/consultations"),
        api.get("/api/users/weeklyAdvice"),
        api.get("/api/users/professionals"), 
      ]);

      if (!mounted) return;
      setUser(meRes.data.user);
      setIsBlocked(Boolean(meRes.data.user?.isBlocked));
      setBlockReason(meRes.data.user?.blockedReason || "");
      setActivities(logsRes.data.logs || []); // <- use logs from FootprintLog
      setConsultations(consultRes.data.consultations || []);
      setWeeklyAdvice(adviceRes.data.advice || null);
      setProfessionals(prosRes.data.professionals || []);

    } catch (err) {
  if (err.isBlocked) {
    setIsBlocked(true);
    setBlockReason(err.blockReason || "Policy violation");
  }
  console.error("Dashboard load error:", err);
    } finally {
      if (mounted) setLoading(false);
    }
  }
  load();
  return () => (mounted = false);
}, []);


  // dark mode persistence
  useEffect(() => {
    const saved = localStorage.getItem("ecopulse-dark");
    if (saved === "1") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("ecopulse-dark", next ? "1" : "0");
  }

function NeoCard({ title, value }) {
  const display = (value === null || value === undefined) ? 0 : value;
  
  // Mapping icons to titles for better UX
  const icons = {
    Travel: "🚗",
    Food: "🥗",
    Electricity: "⚡",
    Water: "💧",
    Shopping: "🛍️",
    "Gas Usage": "🔥",
    Total: "🌍"
  };

  return (
    <div className="group relative p-6 rounded-[2rem] bg-card shadow-card-shadow border border-border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl active:scale-95 cursor-default overflow-hidden">
      
      {/* Background Accent Glow (Subtle) */}
      <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />

      <div className="flex justify-between items-start mb-4">
        <div className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground/40 group-hover:text-primary transition-colors">
          {title}
        </div>
        <span className="text-lg opacity-50 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500">
          {icons[title] || "📈"}
        </span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-black text-foreground tracking-tighter">
            {typeof display === "number" ? Number(display).toFixed(2) : display}
          </span>
          <span className="text-[10px] font-bold text-primary uppercase italic">
            kg CO₂
          </span>
        </div>
        
        {/* Subtle Trend Indicator (Optional/Placeholder) */}
        <div className="mt-2 flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
          <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-tighter">Target: {footprintRanges[title].min} – {footprintRanges[title].max} kg CO₂</span>
        </div>
      </div>
    </div>
  );
}

function getMinConsultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 2); // after tomorrow
  return d.toISOString().split("T")[0];
}

function handlePlanSelect(months) {
  setSelectedPlan(months);
}


  // helpers
 const todayTotals = activities
  .filter(a => new Date(a.date).toDateString() === new Date().toDateString())
  .reduce((acc, log) => {
    const t = log.totals || {};
    acc.total += t.total || 0;
    acc.travel += t.travel || 0;
    acc.food += t.food || 0;
    acc.electricity += t.electricity || 0;
    acc.water += t.water || 0;
    acc.shopping += t.shopping || 0;
    acc.gas += t.gas || 0;
    return acc;
  }, { total: 0, travel: 0, food: 0, electricity: 0, water: 0, shopping: 0, gas: 0 });


  // compute cumulative totals from all logs
  const cumulative = activities?.reduce(
    (acc, log) => {
      const t = log.totals || {};
      acc.total += Number(t.total || 0);
      acc.travel += Number(t.travel || 0);
      acc.food += Number(t.food || 0);
      acc.electricity += Number(t.electricity || 0);
      acc.water += Number(t.water || 0);
      acc.shopping += Number(t.shopping || 0);
      acc.gas += Number(t.gas|| 0);
      return acc;
    },
    { total: 0, travel: 0, food: 0, electricity: 0, water: 0, shopping: 0, gas: 0 }
  );

  // line / pie data
 const lineData = useMemo(() => {
  // 1. Group by date and sum totals
  const grouped = (activities || []).reduce((acc, log) => {
    const d = new Date(log.date);
    if (isNaN(d)) return acc;

    const dateKey = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const value = Number(log.totals?.total ?? 0);

    if (!acc[dateKey]) {
      acc[dateKey] = { dateKey, label, total: 0, rawDate: d };
    }
    acc[dateKey].total += value;
    return acc;
  }, {});

  // 2. Convert to array, filter out zeros, and sort by date
  return Object.values(grouped)
    .filter((item) => item.total > 0)
    .sort((a, b) => a.rawDate - b.rawDate) // Oldest to Newest
    .slice(-7) // Take the latest 7 active days
    .map(({ label, total }) => ({ date: label, total }));
}, [activities]);

  const pieData = [
  { name: "Travel", value: todayTotals.travel },
  { name: "Food", value: todayTotals.food },
  { name: "Electricity", value: todayTotals.electricity },
  { name: "Water", value: todayTotals.water },
  { name: "Shopping", value: todayTotals.shopping },
  { name: "Gas Usage", value: todayTotals.gas },
];

const professionalConsultCount = consultations.reduce((acc, c) => {
  const proId = c.professional?._id;
  if (!proId) return acc;

  acc[proId] = (acc[proId] || 0) + 1;
  return acc;
}, {});
const totalConsultations = consultations.length || 1;

const professionalsWithPreference = professionals.map((p) => {
  const count = professionalConsultCount[p._id] || 0;

  return {
    ...p,
    preference: Math.round((count / totalConsultations) * 100),
  };
});

const ProfileItem = ({ label, value }) => (
  <div>
    <div className="text-[10px] font-black uppercase tracking-widest text-foreground/30">{label}</div>
    <div className="text-sm font-bold text-foreground mt-0.5">{value || "-"}</div>
  </div>
);

const footprintRanges = {
  Travel: { min: 0, max: 3 },
  Food: { min: 2, max: 6 },
  Electricity: { min: 1, max: 6 },
  Water: { min: 0.1, max: 1.5 },
  Shopping: { min: 0, max: 5 },
  "Gas Usage": { min: 0.2, max: 2 },
  Total: { min: 5, max: 20 }
};

async function handleSaveLog(e) {
  e.preventDefault();
  try {
    const res = await api.post("/api/logs", logInput);
    setLogMsg("Log saved!");
    setLogInput({
      travel: [],
      food: [],
      electricity: { ac: 0, fan: 0, fridge: 0, tv: 0, light: 0, laptop: 0, desktop: 0, mobile: 0, geyser: 0, washingMachine: 0, microwave: 0, evCharger: 0, gamingConsole: 0 },
      water: { showerMinutes: 0, washingCycles: 0, roWasteLiters: 0, tapLiters: 0 },
      shopping: [],
      gas: [],
    });

    // Append new log to existing activities
    setActivities(prev => [...prev, res.data.log]);
  } catch (err) {
    console.error(err);
    setLogMsg("Failed to save log");
  }
}

async function handleUpgrade() {
  console.log("Selected plan:", selectedPlan);

  if (!selectedPlan) {
    alert("Please select a plan first");
    return;
  }

   try {
    const res = await api.post("/api/payments/premium", {
      userId: user._id,      // 🔑 REQUIRED
      months: selectedPlan,
    });

    console.log("Stripe session:", res.data);

    if (res.data?.url) {
      window.location.href = res.data.url;
    } else {
      alert("Payment URL not returned from server. Check backend logs.");
    }
  } catch (err) {
    console.error("Upgrade error:", err);
    alert("Failed to start payment. Try again.");
  }
}

async function handleDonate(e) {
  e.preventDefault();

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    alert("Enter a valid donation amount");
    return;
  }

  try {
    const stripe = await stripePromise;
    const res = await api.post("/api/payments/donate", {
      userId: user._id,
      amount: Number(amount),
    });

    if (res.data.url) {
      window.location.href = res.data.url; // redirect to Stripe checkout
    } else {
      alert("Failed to create donation session. Try again.");
    }
  } catch (err) {
    console.error("Donation error:", err);
    alert("Donation failed. Check console for details.");
  }
}


  // consultation submit
  async function handleConsultSubmit(e) {
  e.preventDefault();
  if (!selectedProfessional) {
  setConsultMsg("Please select a professional");
  return;
}

  setConsultMsg("Sending...");

  try {
    const res = await api.post("/api/users/consultation/request", {
      preferredDate: consultDate,
      notes: consultNotes || "",
      professionalId: selectedProfessional,
    });

    setConsultations(prev => [
      res.data.consultation,
      ...prev,
    ]);

    setConsultMsg("Requested. Professionals will reach out.");
    setConsultDate("");
    setConsultNotes("");
  } catch (err) {
    console.error("Consultation error:", err);
    setConsultMsg("Failed to request. Try again.");
  }
}

async function handlePayConsultation(consultation) {
  if (!consultation?.consultationFee) {
    alert("Consultation fee missing!");
    return;
  }

  try {
    const res = await api.post("/api/payments/consultation", {
      userId: user._id,
      consultationId: consultation._id,
      amount: consultation.consultationFee,
    });

    if (res.data?.url) {
      window.location.href = res.data.url;
    } else {
      alert("Failed to create payment session. Try again.");
    }
  } catch (err) {
    console.error("Consultation payment error:", err);
    alert("Payment failed. Check console for details.");
  }
}


useEffect(() => {
  if (!activeConsultation) return;

  api
    .get(`/api/chat/${activeConsultation._id}`)
    .then(res => setMessages(res.data.messages));
}, [activeConsultation]);

async function sendMessage(e) {
  e.preventDefault();

  const res = await api.post("/api/chat", {
    consultationId: activeConsultation._id,
    message: chatText,
  });

  setMessages(prev => [...prev, res.data.chat]);
  setChatText("");
}
useEffect(() => {
  if (!activeConsultation) return;

  let mounted = true;
  let interval;

  async function fetchMessages() {
    try {
      const res = await api.get(`/api/chat/${activeConsultation._id}`);
      if (mounted) setMessages(res.data.messages);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }

  // Initial fetch
  fetchMessages();

  // Poll every 2 seconds
  interval = setInterval(fetchMessages, 2000);

  return () => {
    mounted = false;
    clearInterval(interval);
  };
}, [activeConsultation]);

useEffect(() => {
  const chatContainer = document.getElementById("chat-container");
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}, [messages]);

useEffect(() => {
  if (user?.premium && new Date(user.premiumUntil) < new Date()) {
    alert("Your premium has expired. Please upgrade again.");
  }
}, [user]);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const sessionIdRaw = params.get("session_id");
  if (!sessionIdRaw) return;

  const sessionId = sessionIdRaw.replace(/[{}]/g, "");

  api.post("/api/payments/verify", { sessionId })
    .then(() => {
      // Reload consultations to update 'paid' status
      api.get("/api/users/consultations").then(res => {
        setConsultations(res.data.consultations || []);
      });

      // Clean URL
      params.delete("session_id");
      const newUrl =
        params.toString().length > 0
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    })
    .catch(err => console.error("Payment verification failed:", err));
}, []);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const sessionIdRaw = params.get("session_id");
  const paymentStatus = params.get("payment");
  const type = params.get("type");

  if (paymentStatus === "success" && type) {
    // 1. Immediately update UI
    setSuccessType(type);
    setSection(type);

    // 2. Trigger Celebration for donation
    if (type === "donation") {
       confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }

    // 3. Backend Verification (if session_id exists)
    if (sessionIdRaw) {
      const sessionId = sessionIdRaw.replace(/[{}]/g, "");
      api.post("/api/payments/verify", { sessionId })
        .then(() => {
          // Refresh data based on what was paid
          if (type === "consultation") {
            api.get("/api/users/consultations").then(res => setConsultations(res.data.consultations || []));
          }
        })
        .catch(err => console.error("Verification error:", err));
    }

    // 4. Clean the URL so a refresh doesn't trigger confetti again
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}, [user]);

  // UI pieces: menu items (consultation hidden if not premium)
  const menuItems = [
    { id: "dashboard", label: "Overview", emoji: "📊" },
    { id: "logs", label: "Footprint Logs", emoji: "📜" },
    { id: "insights", label: "Insights", emoji: "📈" },
    { id: "donation", label: "Donation", emoji: "❤️" },
    { id: "profile", label: "Profile", emoji: "👤" }
  ];
  // add consultation if premium
  if (user?.premium) menuItems.push({ id: "consultation", label: "Consultation", emoji: "🧑‍🏫" });

  if (!user?.premium) menuItems.push({ id: "premium", label: "Upgrade", emoji: "💎" });
  {user?.premium && <div className="text-xs text-gray-400 mt-2">Premium until {user.premiumUntil ? new Date(user.premiumUntil).toLocaleDateString() : "—"}</div>}


  return (
    // Inside your return statement...
<div className="min-h-screen flex bg-background text-foreground transition-colors duration-300 font-sans">
  {/* SIDEBAR */}
  <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-card border-r border-border p-4 transition-all duration-300 ease-in-out flex flex-col shadow-sm`}>
  
  {/* TOP: Eco Profile Header & Identity */}
  <div className="flex flex-col mb-8">
    {/* Header Row: Title & Toggle */}
    <div className={`flex items-center mb-4 ${sidebarOpen ? "justify-between px-1" : "justify-center"}`}>
      {sidebarOpen && (
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">
          Eco Profile
        </span>
      )}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)} 
        className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors bg-background/50 border border-border/50 text-xs"
      >
        {sidebarOpen ? "❮" : "❯"}
      </button>
    </div>

    {/* Identity Card */}
    <div className={`flex items-center gap-3 transition-all ${sidebarOpen ? "p-3 rounded-2xl bg-background/50 border border-border/50 shadow-inner" : "flex-col"}`}>
      
      {/* Avatar Square */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold shadow-lg shadow-primary/20">
        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
      </div>

      {sidebarOpen ? (
        <div className="overflow-hidden">
          <div className="text-sm font-black truncate text-foreground leading-none mb-1">
            {user?.name || "Guest"}
          </div>
          <div className="text-[10px] text-foreground/50 truncate mb-1 font-medium">
            {user?.email || "No email"}
          </div>
          
          {user?.premium && (
            <div className="text-[9px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
              Premium
            </div>
          )}
        </div>
      ) : (
        /* Collapsed Name & Premium Indicator below Avatar */
        <div className="flex flex-col items-center mt-1 overflow-hidden w-full">
          <span className="text-[9px] font-black text-foreground/60 uppercase tracking-tighter truncate w-full text-center">
            {user?.name?.split(' ')[0]}
          </span>
          {user?.premium && (
            <div className="w-1 h-1 bg-amber-500 rounded-full mt-1 shadow-[0_0_3px_#fbbf24]"></div>
          )}
        </div>
      )}
    </div>
  </div>

  {/* NAVIGATION SECTION */}
  {sidebarOpen && (
    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 mb-3 px-1">
      Menu
    </div>
  )}
  <nav className="flex flex-col gap-1.5 flex-1">
    {menuItems.map((m) => (
      <button
        key={m.id}
        onClick={() => setSection(m.id)}
        className={`group flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
          section === m.id 
          ? "bg-primary text-white shadow-lg shadow-primary/20" 
          : "hover:bg-primary/5 text-foreground/70 hover:text-primary"
        }`}
      >
        <span className="text-xl group-hover:scale-110 transition-transform">{m.emoji}</span>
        {sidebarOpen && <span className="font-bold text-sm tracking-tight">{m.label}</span>}
      </button>
    ))}
  </nav>
  {/* BOTTOM: SUPPORT SECTION */}
  <div className="mt-auto pt-6 border-t border-border/50">
    {sidebarOpen ? (
      /* Expanded Support Card */
      <div className="p-4 rounded-2xl bg-background/50 border border-border shadow-inner group transition-all hover:border-primary/30">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base group-hover:rotate-12 transition-transform">📧</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/30">
            Complaints
          </span>
        </div>
        <p className="text-[10px] font-bold text-foreground/50 leading-relaxed mb-3">
          Facing an issue? Contact our admin team below:
        </p>
        <a 
          href="mailto:admin@ecopulse.com" 
          className="block text-[11px] font-black text-primary hover:text-primary-dark transition-colors break-all underline underline-offset-4"
        >
          admin@ecopulse.com
        </a>
      </div>
    ) : (
      /* Collapsed Support Icon */
      <div className="flex flex-col items-center gap-2 py-2">
        <a 
          href="mailto:admin@ecopulse.com"
          title="Contact Admin"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-background/50 border border-border text-foreground/40 hover:text-primary hover:border-primary/50 transition-all shadow-sm"
        >
          📧
        </a>
        <div className="w-1 h-1 rounded-full bg-primary/30"></div>
      </div>
    )}
  </div>
</aside>

{/* MAIN CONTENT AREA */}
   <main className="flex-1 p-6 lg:p-10 overflow-auto bg-background/30 scroll-smooth">
  
  {/* TOP HEADER: Clean & Minimal */}
  <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
    <div>
      <h1 className="text-3xl font-black tracking-tighter capitalize text-foreground">
        {section === "dashboard" ? "Overview" : section}
      </h1>
      <p className="text-sm text-foreground/40 font-medium">
        Welcome back, <span className="text-primary">{user?.name?.split(' ')[0] || "Eco-Warrior"}</span> • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
    </div>

    {/* PREMIUM STATUS BADGE (Right Side) */}
    <div className="flex items-center gap-4 bg-card p-3 px-5 rounded-[1.5rem] border border-border shadow-card-shadow">
  <div className="text-right">
    <div className="text-[10px] font-black uppercase tracking-widest text-primary/60">
      Account Status
    </div>
    <div className="text-xs font-black text-foreground">
      {user?.premium ? "✨ Premium Member" : "Free Member"}
    </div>
    
    {/* Premium "Since" Date - Visible only for premium users */}
    {user?.premium && user.premiumSince && (
      <div className="text-[9px] text-foreground/40 font-bold uppercase tracking-tighter mt-0.5">
        Active Since: {new Date(user.premiumSince).toLocaleDateString()}
      </div>
    )}
  </div>

  {/* Days Left Countdown */}
  {user?.premium && user.premiumDaysLeft !== undefined && (
    <div className="flex flex-col items-center justify-center bg-green-500/10 text-green-600 px-3 py-1.5 rounded-xl border border-green-500/20">
      <span className="text-[14px] font-black leading-none">{user.premiumDaysLeft}</span>
      <span className="text-[8px] font-black uppercase tracking-tighter">Days Left</span>
    </div>
  )}
</div>
  </header>

  {/* ALERTS: Blocked State */}
  {isBlocked && (
    <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-500">
      <span className="text-2xl">⚠️</span>
      <div>
        <h3 className="font-black text-sm uppercase tracking-wider">Account Restricted</h3>
        <p className="text-xs opacity-80">Actions are disabled. Contact support at <span className="underline">admin@ecopulse.com</span></p>
      </div>
    </div>
  )}

  {!loading && (
    <div className="space-y-10">
      {section === "dashboard" && (
        <>
          {/* 1. NEOCARDS GRID */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
            <NeoCard title="Travel" value={todayTotals.travel} />
            <NeoCard title="Food" value={todayTotals.food} />
            <NeoCard title="Electricity" value={todayTotals.electricity} />
            <NeoCard title="Water" value={todayTotals.water} />
            <NeoCard title="Shopping" value={todayTotals.shopping} />
            <NeoCard title="Gas Usage" value={todayTotals.gas} />
          </section>

          {/* charts */}
<section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
  {/* Line Chart Container */}
  <div className="col-span-2 bg-card p-6 rounded-[2rem] shadow-card-shadow border border-border">
    <h3 className="font-semibold mb-4 text-foreground">Last 7 Days</h3>
    {lineData.length ? (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={lineData}>
          {/* Restored Lines and Strokes */}
          <XAxis dataKey="date" stroke="#aaa" tickLine={true} axisLine={true} />
          <YAxis stroke="#aaa" tickLine={true} axisLine={true} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              borderRadius: '1rem', 
              border: '1px solid var(--border)' 
            }} 
          />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="#34d399" 
            strokeWidth={3} 
            dot={{ r: 3 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    ) : (
      <div className="text-sm text-gray-500 flex items-center justify-center h-[260px]">No week data</div>
    )}
  </div>

  {/* Pie Chart Container */}
  <div className="bg-card p-6 rounded-[2rem] shadow-card-shadow border border-border">
    <h3 className="font-semibold mb-4 text-foreground">Today Breakdown</h3>
    {pieData.length ? (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie 
            data={pieData} 
            dataKey="value" 
            nameKey="name" 
            cx="50%" 
            cy="50%" 
            outerRadius={80} 
            label
          >
            {pieData.map((entry, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
          <Tooltip 
  contentStyle={{ 
    backgroundColor: 'var(--card)', 
    borderRadius: '1rem', 
    border: '1px solid var(--border)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' // optional: adds depth
  }} 
  itemStyle={{ color: 'var(--foreground)' }} // ⬅️ This fixes the data text color
  labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }} // ⬅️ This fixes the label text color
  cursor={{ fill: 'transparent' }} // optional: cleans up bar charts if used elsewhere
/>
        </PieChart>
      </ResponsiveContainer>
    ) : (
      <div className="text-sm text-gray-500 flex items-center justify-center h-[260px]">No breakdown</div>
    )}
  </div>
</section>

          {/* 3. ACTIVITY & ADVICE SECTION */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity Section */}
<div className="md:col-span-2 bg-card p-6 rounded-[2rem] shadow-card-shadow border border-border">
  <h3 className="font-semibold mb-4 text-foreground">Recent Activity</h3>
  {activities?.length ? (
    <div className="space-y-3 max-h-96 overflow-auto pr-2 custom-scrollbar">
      {activities.slice().reverse().map((a, i) => (
        <div 
          key={i} 
          className="group flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-border/50 hover:border-primary/20 transition-all"
        >
          <div className="flex items-center gap-4">
            {/* Clear Date Badge */}
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 border border-primary/10 flex flex-col items-center justify-center text-primary">
              <span className="text-[10px] font-black uppercase tracking-tighter">
                {new Date(a.date).toLocaleDateString(undefined, { month: 'short' })}
              </span>
              <span className="text-lg font-black leading-none">
                {new Date(a.date).getDate()}
              </span>
            </div>

            <div>
              <div className="text-sm font-bold text-foreground">Daily Footprint Log</div>
              <div className="text-[10px] text-foreground/40 uppercase font-black tracking-[0.1em]">
                {new Date(a.date).toLocaleDateString(undefined, { year: 'numeric' })} • {new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-base font-black text-foreground">
              {Number(a.totals?.total ?? 0).toFixed(1)} <span className="text-[10px] text-foreground/30 italic">kg</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-sm text-gray-500 italic flex items-center justify-center h-32">
      No activity logged yet.
    </div>
  )}
</div>
            {/* Expert Advice Card */}
            {weeklyAdvice && (
              <div className="relative group overflow-hidden p-6 rounded-[2.5rem] bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/20">
                <div className="absolute top-0 right-0 p-4 opacity-20 text-4xl">🌱</div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Expert Insight</h4>
                <p className="text-sm font-medium leading-relaxed mb-6 italic">"{weeklyAdvice.adviceText}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                    {weeklyAdvice.professional?.name?.charAt(0)}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-wider">
                    {weeklyAdvice.professional?.name}
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}

           {/* ===== Logs Section ===== */}
{section === "logs" && (
  <div className="space-y-8 animate-in fade-in duration-500">
    
    {/* HEADER AREA */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">Footprint Logs</h2>
        <p className="text-sm text-foreground/40 font-medium italic">Environmental impact recording</p>
      </div>

      <button
        onClick={() => !isBlocked && setShowLogForm(!showLogForm)}
        disabled={isBlocked}
        className={`group flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${
          isBlocked 
          ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none" 
          : "bg-primary text-white hover:shadow-primary/30 hover:-translate-y-0.5"
        }`}
      >
        <span className="text-lg">{showLogForm ? "✕" : "＋"}</span>
        {showLogForm ? "Close Form" : "Add Daily Log"}
      </button>
    </div>

    {/* -------- FORM SECTION -------- */}
    {showLogForm && (
      <div className="bg-card p-8 rounded-[2.5rem] shadow-card-shadow border border-border max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Daily Lifestyle Log</h3>
          <div className="w-12 h-1 bg-primary/20 mx-auto mt-2 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {sectionNames.map((sectionName) => (
            <div key={sectionName} className="group border border-border/50 rounded-[1.5rem] bg-background/30 overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleSection(sectionName)}
                className="flex justify-between w-full p-5 font-bold text-left text-foreground items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">
                    {sectionName === "Travel" ? "🚗" : sectionName === "Meals" ? "🥗" : sectionName === "Electricity" ? "⚡" : sectionName === "Water" ? "💧" : sectionName === "Shopping" ? "🛍️" : sectionName === "Gas Usage" ? "🔥" : ""}
                  </span>
                  {sectionName}
                </div>
                <div className={`transition-transform duration-300 ${openSections[sectionName] ? "rotate-180" : ""}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>

              {openSections[sectionName] && (
                <div className="p-6 pt-0 space-y-4 border-t border-border/30">
                  {/* --- Travel Logic --- */}
                  {sectionName === "Travel" && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-3 p-4 bg-card rounded-2xl border border-border">
                        <select
                          className="flex-1 min-w-[140px] p-2.5 rounded-xl bg-background border border-border text-sm font-bold outline-none focus:ring-2 ring-primary/20"
                          value={newTravel.mode}
                          onChange={(e) => setNewTravel({ ...newTravel, mode: e.target.value })}
                        >
                          {["car", "electricBicycle", "motorcycle", "bus", "auto", "taxi", "train", "metro", "flight"].map(m => <option key={m}>{m}</option>)}
                        </select>
                        <input
                          type="number"
                          placeholder="Km"
                          className="w-24 p-2.5 rounded-xl bg-background border border-border text-sm font-bold text-center outline-none focus:ring-2 ring-primary/20"
                          value={newTravel.km}
                          onChange={(e) => setNewTravel({ ...newTravel, km: Math.max(0, Number(e.target.value)) })}
                        />
                        <button
                          type="button"
                          className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform"
                          onClick={() => {
                            if (newTravel.mode && newTravel.km !== "") {
                              setLogInput({ ...logInput, travel: [...logInput.travel, { mode: newTravel.mode, km: Number(newTravel.km) }] });
                              setNewTravel({ mode: "car", km: "" });
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {logInput.travel.map((t, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-full text-xs font-bold text-primary">
                            <span className="capitalize">{t.mode}: {t.km}km</span>
                            <button onClick={() => setLogInput({ ...logInput, travel: logInput.travel.filter((_, i) => i !== idx) })} className="hover:text-red-500">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Electricity Section */}
{sectionName === "Electricity" && (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Object.keys(logInput.electricity).map((appliance) => (
      <div key={appliance} className="group p-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all shadow-sm">
        <label className="block text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">
          {appliance === "ac" ? "Air Conditioner" : appliance.replace(/([A-Z])/g, ' $1')}
        </label>
        <div className="relative flex items-center">
          <input
            type="number"
            min="0"
            max="24"
            className="w-full p-2.5 rounded-xl bg-background border border-border text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all"
            value={logInput.electricity[appliance]}
            onChange={(e) =>
              setLogInput({
                ...logInput,
                electricity: { 
                  ...logInput.electricity, 
                  [appliance] : Math.max(0, Number(e.target.value))
                }
              })
            }
          />
          <span className="absolute right-3 text-[9px] font-black text-foreground/20 uppercase">Hrs</span>
        </div>
      </div>
    ))}
  </div>
)}
                  
                  {/* --- Meals --- */}
{sectionName === "Meals" && (
  <div className="space-y-4">
    <div className="flex flex-wrap gap-3 p-4 bg-card rounded-2xl border border-border">
      <select
        className="flex-1 min-w-[140px] p-2.5 rounded-xl bg-background border border-border text-sm font-bold outline-none focus:ring-2 ring-primary/20"
        value={newMeal.category}
        onChange={(e) => setNewMeal({ ...newMeal, category: e.target.value })}
      >
        <option value="vegan">Vegan</option>
        <option value="vegetarian">Vegetarian</option>
        <option value="egg">Egg</option>
        <option value="chicken">Chicken</option>
        <option value="fish">Fish</option>
        <option value="mutton">Mutton</option>
        <option value="beef">Beef</option>
        <option value="pork">Pork</option>
        <option value="dairy">Dairy</option>
        <option value="fastFood">Fast Food</option>
        <option value="processedFood">Processed Food</option>
        <option value="cannedFood">Canned Food</option>
        <option value="frozenFood">Frozen Food</option>
        <option value="rawIngredients">Raw Ingredients</option>
        <option value="unknown">Unknown</option>
      </select>

      {/* Quantity input */}
      <input
        type="number"
        placeholder="Qty"
        className="w-20 p-2.5 rounded-xl bg-background border border-border text-sm font-bold text-center outline-none focus:ring-2 ring-primary/20"
        value={newMeal.quantity || 1}
        onChange={(e) =>
          setNewMeal({ ...newMeal, quantity: Math.max(1, Number(e.target.value)) })
        }
      />

      <button
        type="button"
        className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform"
        onClick={() => {
          setLogInput({
            ...logInput,
            food: [...logInput.food, { ...newMeal, quantity: newMeal.quantity || 1 }],
          });
          setNewMeal({ category: "vegetarian", quantity: 1 });
        }}
      >
        + Add Meal
      </button>
    </div>

    <div className="flex flex-wrap gap-2">
      {logInput.food.map((f, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-black uppercase text-green-600"
        >
          <span>{f.category} ({f.quantity || 1})</span>
          <button
            onClick={() =>
              setLogInput({
                ...logInput,
                food: logInput.food.filter((_, i) => i !== idx),
              })
            }
            className="hover:text-red-500"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  </div>
)}

                  {/* --- Water --- */}
                  {sectionName === "Water" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: "Shower (min)", key: "showerMinutes" },
                        { label: "Washing Cycles", key: "washingCycles" },
                        { label: "RO Waste (L)", key: "roWasteLiters" },
                        { label: "Tap Usage (min)", key: "tapLiters" }
                      ].map((item) => (
                        <div key={item.key} className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{item.label}</label>
                          <input
                            type="number"
                            className="w-full p-3 rounded-xl bg-background border border-border text-sm font-bold outline-none focus:ring-2 ring-primary/20"
                            value={logInput.water[item.key]}
                            onChange={(e) => setLogInput({ ...logInput, water: { ...logInput.water, [item.key]: Math.max(0, Number(e.target.value)) } })}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* --- Shopping --- */}
                  {sectionName === "Shopping" && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-3 p-4 bg-card rounded-2xl border border-border">
                        <select
                          className="flex-1 min-w-[140px] p-2.5 rounded-xl bg-background border border-border text-sm font-bold outline-none focus:ring-2 ring-primary/20"
                          value={newShopping.category}
                          onChange={(e) => setNewShopping({ ...newShopping, category: e.target.value })}
                        >
                          <option value="clothes">Clothes</option>
                          <option value="electronics">Electronics</option>
                          <option value="toiletries">Toiletries</option>
                          <option value="furniture">Furniture</option>
                          <option value="books">Books</option>
                          <option value="shoes">Shoes</option>
                          <option value="groceries">Groceries</option>
                          <option value="homeAppliances">Home Appliances</option>
                          <option value="cosmetics">Cosmetics</option>
                          <option value="toys">Toys</option>
                          <option value="sportingGoods">Sporting Goods</option>
                          <option value="jewelry">Jewelry</option>
                          <option value="artSupplies">Art Supplies</option>
                          <option value="petSupplies">Pet Supplies</option>
                          <option value="techAccessories">Tech Accessories</option>
                          <option value="cleaningProducts">Cleaning Products</option>
                          <option value="alcohol">Alcohol</option>
                          <option value="pharmaceuticals">Pharmaceuticals</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Qty"
                          className="w-20 p-2.5 rounded-xl bg-background border border-border text-sm font-bold text-center outline-none focus:ring-2 ring-primary/20"
                          value={newShopping.quantity}
                          onChange={(e) => setNewShopping({ ...newShopping, quantity: Math.max(0, Number(e.target.value)) })}
                        />
                        <button
                          type="button"
                          className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform"
                          onClick={() => {
                            if (newShopping.category && newShopping.quantity !== "") {
                              setLogInput({ ...logInput, shopping: [...logInput.shopping, { category: newShopping.category, quantity: Number(newShopping.quantity) }] });
                              setNewShopping({ category: "clothes", quantity: 1 });
                            }
                          }}
                        >
                          + Add Item
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {logInput.shopping.map((i, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black uppercase text-blue-600">
                            <span>{i.category} ({i.quantity})</span>
                            <button onClick={() => setLogInput({ ...logInput, shopping: logInput.shopping.filter((_, j) => j !== idx) })} className="hover:text-red-500">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                   {/* --- Gas Usage --- */}
{sectionName === "Gas Usage" && (
  <div className="space-y-4">
    <div className="flex flex-wrap gap-3 p-4 bg-card rounded-2xl border border-border">
      <select
        className="flex-1 min-w-[140px] p-2.5 rounded-xl bg-background border border-border text-sm font-bold outline-none focus:ring-2 ring-primary/20"
        value={newGas.type}
        onChange={(e) => setNewGas({ ...newGas, type: e.target.value })}
      >
        <option value="cylinder">LPG Cylinder</option>
        <option value="pipeline">Piped Gas</option>
      </select>

      <input
        type="number"
        placeholder="Minutes"
        className="w-20 p-2.5 rounded-xl bg-background border border-border text-sm font-bold text-center outline-none focus:ring-2 ring-primary/20"
        value={newGas.minutes ?? ""} 
        onChange={(e) => setNewGas({ ...newGas, minutes: Math.max(0, Number(e.target.value)) })}
      />
      
      <button
        type="button"
        className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform"
        onClick={() => {
          if (newGas.type && newGas.minutes) {
            setLogInput({ ...logInput, gas: [...logInput.gas, newGas] }); // Add to gasUsage
            setNewGas({ type: "cylinder", minutes: 0 }); // Reset input
          }
        }}
      >
        + Add Gas Usage
      </button>
    </div>

    <div className="flex flex-wrap gap-2">
      {logInput.gas.map((g, idx) => (
        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] font-black uppercase text-orange-600">
          <span>{g.type} ({g.minutes} min)</span>
          <button onClick={() => setLogInput({ ...logInput, gas: logInput.gas.filter((_, i) => i !== idx) })} className="hover:text-red-500">✕</button>
        </div>
      ))}
    </div>
  </div>
)}

                </div>
              )}
            </div>
          ))}
        </div>

      

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={handleSaveLog}
            disabled={isBlocked}
            className="w-full sm:w-64 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all"
          >
            Save Daily Log
          </button>
          {logMsg && <p className="text-[10px] font-black text-primary uppercase animate-pulse tracking-widest">{logMsg}</p>}
        </div>
      </div>
    )}

    {/* ------- TODAY'S TABLE -------- */}
    <div className="bg-card rounded-[2.5rem] shadow-card-shadow border border-border overflow-hidden">
      <div className="p-6 border-b border-border/50 flex items-center justify-between">
         <h3 className="font-black text-sm uppercase tracking-widest text-foreground/40">Today's Timeline</h3>
         <div className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-lg border border-primary/20 uppercase">
           Live Feed
         </div>
      </div>
      
      <div className="overflow-x-auto">
        {activities?.length ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-background/50">
              <tr>
                {["Time", "Total", "Travel", "Food", "Electricity", "Water", "Shopping", "Gas Usage"].map(h => (
                  <th key={h} className="p-4 text-[10px] font-black uppercase tracking-widest text-foreground/40">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {activities
                .filter(a => new Date(a.date).toDateString() === new Date().toDateString())
                .slice().reverse().map((a, i) => (
                  <tr key={i} className="hover:bg-primary/[0.02] transition-colors">
                    <td className="p-4 text-xs font-bold text-foreground">{new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-4 text-sm font-black text-primary">{(a.totals?.total || 0).toFixed(2)}</td>
                    <td className="p-4 text-xs font-medium text-foreground/60">{a.totals?.travel || 0}</td>
                    <td className="p-4 text-xs font-medium text-foreground/60">{a.totals?.food || 0}</td>
                    <td className="p-4 text-xs font-medium text-foreground/60">{a.totals?.electricity || 0}</td>
                    <td className="p-4 text-xs font-medium text-foreground/60">{a.totals?.water || 0}</td>
                    <td className="p-4 text-xs font-medium text-foreground/60">{a.totals?.shopping || 0}</td>
                    <td className="p-4 text-xs font-medium text-foreground/60">{a.totals?.gas || 0}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <div className="p-10 text-center text-sm text-foreground/30 font-bold uppercase tracking-widest italic">
            No activity recorded today
          </div>
        )}
      </div>
    </div>
  </div>
)}

           {/* ===== Insights Section ===== */}
{section === "insights" && (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="flex flex-col gap-1">
      <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">Insights</h2>
      <p className="text-sm text-foreground/40 font-medium italic">Your lifetime environmental impact</p>
    </div>

    {/* Cumulative Total - Hero Card */}
    <div className="bg-card p-10 rounded-[3rem] shadow-card-shadow border border-border text-center relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      
      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Cumulative Footprint</h4>
      <div className="text-6xl font-black text-foreground tracking-tighter">
        {Number(cumulative.total || 0).toFixed(2)}
        <span className="text-xl text-foreground/30 ml-2">kg CO₂</span>
      </div>
    </div>

    {/* Category Grid */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: "Travel", val: cumulative.travel, icon: "🚗" },
        { label: "Food", val: cumulative.food, icon: "🥗" },
        { label: "Electricity", val: cumulative.electricity, icon: "⚡" },
        { label: "Water", val: cumulative.water, icon: "💧" },
        { label: "Shopping", val: cumulative.shopping, icon: "🛍️" },
        { label: "Gas Usage", val: cumulative.gas, icon: "🔥" },
      ].map((cat) => (
        <div key={cat.label} className="bg-card p-5 rounded-[2rem] shadow-card-shadow border border-border text-center transition-transform hover:scale-105">
          <div className="text-xl mb-2">{cat.icon}</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">{cat.label}</div>
          <div className="text-lg font-black text-foreground">
            {Number(cat.val || 0).toFixed(1)}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{/* ===== Profile Section ===== */}
{section === "profile" && (
  <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
    <div className="flex flex-col gap-1 mb-6">
      <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">User Profile</h2>
      <p className="text-sm text-foreground/40 font-medium italic">Manage your account and stats</p>
    </div>

    <div className="bg-card rounded-[3rem] shadow-card-shadow border border-border overflow-hidden">
      {/* Profile Header Decoration */}
      <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 border-b border-border" />
      
      <div className="p-8 md:p-12 -mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Left: Personal Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-primary/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">{user?.name || "Member"}</h3>
                <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                  {user?.premium ? "PREMIUM MEMBER" : "FREE MEMBER"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <ProfileItem label="Email Address" value={user?.email} />
              <ProfileItem label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"} />
              {user?.premium && (
                <ProfileItem 
                  label="Premium" 
                  value={`Active since ${user.premiumSince ? new Date(user.premiumSince).toLocaleDateString() : "-"}`} 
                />
              )}
            </div>
          </div>

          {/* Right: Statistics & Actions */}
          <div className="flex flex-col justify-between space-y-8 bg-background/50 p-8 rounded-[2.5rem] border border-border/50">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <span className="text-xs font-black uppercase tracking-widest text-foreground/40">Total Logs</span>
                <span className="text-xl font-black text-foreground">{activities?.length ?? 0}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-4">
                <span className="text-xs font-black uppercase tracking-widest text-foreground/40">Total Impact</span>
                <span className="text-xl font-black text-primary">{Number(cumulative.total || 0).toFixed(2)} kg</span>
              </div>
            </div>

            <button 
              onClick={async () => { await auth.signOut(); window.location.href = "/"; }} 
             className="px-6 py-2 rounded-xl bg-red-500/5 text-red-600/60 font-bold text-[14px] uppercase tracking-[0.2em] border border-red-500/10 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

            {/* ===== Consultation Section (Premium Only) ===== */}
{section === "consultation" && user?.premium && !isBlocked && (
  <div className="space-y-6 animate-in fade-in duration-500">
  {successType === "consultation" && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-md animate-in fade-in duration-500 p-4">
        <div className="bg-green-500 text-white p-10 rounded-[3rem] text-center shadow-[0_20px_50px_rgba(34,197,94,0.4)] animate-in zoom-in duration-300 max-w-sm w-full border border-white/20">
          <div className="text-5xl mb-4 animate-bounce">✅</div>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Payment Confirmed</h3>
          <p className="text-sm font-bold opacity-90 leading-relaxed mb-8">
            Chat is now unlocked! Your professional consultant is ready to assist you.
          </p>
          <button 
            onClick={() => setSuccessType(null)} 
            className="w-full bg-white text-green-600 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
          >
            Close & Get Started
          </button>
        </div>
      </div>
    )}

    {/* Page Header */}
    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-black tracking-tight text-foreground uppercase">Request Consultation</h2>
      <p className="text-[14px] text-foreground/40 font-medium italic">Premium feature — personalized guidance from professionals.</p>
      <p className="text-[12px] text-foreground/30 mt-1 leading-tight italic"> Preference based on user choice and professional data.</p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT: FORM (4 Columns) */}
      <div className="lg:col-span-4 bg-card p-6 rounded-[2rem] shadow-card-shadow border border-border">
        <form onSubmit={handleConsultSubmit} className="space-y-4">
          
          {/* Professional Selection Logic */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-foreground/40 ml-1">Select Professional</label>
            <select
              value={selectedProfessional || ""}
              onChange={(e) => setSelectedProfessional(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-background border border-border text-[11px] font-bold outline-none focus:ring-2 ring-primary/20 appearance-none cursor-pointer"
              required
            >
              <option value="" disabled>-- Choose a professional --</option>
              {professionalsWithPreference
                .sort((a, b) => b.preference - a.preference)
                .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                    {p.preference > 0 && ` · ${p.preference}% preferred`}
                    {` — ₹${p.consultationFee}`}
                    {p.experience && ` · ${p.experience} years`}
                  </option>
                ))}
            </select>
          </div>

          {/* Date Logic */}
          <div className="space-y-1">
  <label className="text-[9px] font-black uppercase tracking-widest text-foreground/40 ml-1">
    Preferred Date
  </label>
  <div className="relative">
    <input 
      type="date" 
      /* --- YOUR LOGIC START --- */
      value={consultDate} 
      min={getMinConsultDate()} 
      onChange={(e) => setConsultDate(e.target.value)} 
      /* --- YOUR LOGIC END --- */
      className="w-full p-2.5 rounded-xl bg-background border border-border text-[11px] font-bold outline-none focus:ring-2 ring-primary/20 transition-all cursor-pointer block
      [&-webkit-calendar-picker-indicator]:cursor-pointer
      [&-webkit-calendar-picker-indicator]:hover:opacity-70" 
      required 
    />
  </div>
</div>
          {/* Notes Logic */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-foreground/40 ml-1">Notes for professional</label>
            <textarea 
              value={consultNotes} 
              onChange={(e)=>setConsultNotes(e.target.value)} 
              className="w-full p-3 rounded-xl bg-background border border-border text-[11px] font-bold outline-none focus:ring-2 ring-primary/20 min-h-[80px] resize-none" 
              placeholder="What would you like to discuss?"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all">
              Request
            </button>
            {consultMsg && <div className="text-[9px] font-black text-primary animate-pulse uppercase">{consultMsg}</div>}
          </div>
        </form>
      </div>

      {/* RIGHT: TABLE (8 Columns) */}
      <div className="lg:col-span-8 bg-card rounded-[2rem] shadow-card-shadow border border-border overflow-hidden self-stretch">
        <div className="p-4 border-b border-border/50 bg-background/50">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/60">Your Consultation Requests</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-background/30 text-[9px] font-black uppercase tracking-[0.1em] text-foreground/30 border-b border-border/10 ">
              <tr>
                <th className="p-4">Requested Date</th>
                <th className="p-4">Name & Fee</th>
                <th className="p-4 text-center">Date</th>
                <th className="p-4">Notes</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
  {consultations.length ? (
    consultations.map((c) => (
      <tr key={c._id} className="text-[10px] font-bold text-foreground/80 hover:bg-primary/[0.01] transition-colors">
        
        {/* 1. Requested Date (Date when consultation was made) */}
        <td className="p-3 whitespace-nowrap text-foreground/40 font-medium">
          {new Date(c.requestedAt).toLocaleDateString()}
        </td>

        {/* 2. Name & Fee */}
        <td className="p-3">
          <div className="text-foreground leading-tight uppercase tracking-tighter font-black">
            {c.professional?.name || "TBD"}
          </div>
          <div className="text-[9px] text-primary/70 font-bold">
            ₹{c.professional?.consultationFee || 0}
          </div>
        </td>

        {/* 3. Preferred Date (Scheduled For) */}
        <td className="p-3 text-center whitespace-nowrap">
          {c.scheduledFor ? (
            <div className="text-foreground">{new Date(c.scheduledFor).toLocaleDateString()}</div>
          ) : (
            <div className="text-foreground/20 italic">Pending</div>
          )}
        </td>

        {/* 4. Notes */}
        <td className="p-3 max-w-[100px] truncate text-foreground/50 font-medium">
          {c.notes || "-"}
        </td>

        {/* 5. Status */}
        <td className="p-3 text-center">
          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
            c.status === "requested" ? "text-yellow-600 bg-yellow-500/5 border-yellow-500/10" :
            c.status === "scheduled" ? "text-blue-600 bg-blue-500/5 border-blue-500/10" :
            c.status === "completed" ? "text-green-600 bg-green-500/5 border-green-500/10" :
            "text-red-600 bg-red-500/5 border-red-500/10"
          }`}>
            {c.status}
          </span>
        </td>

        {/* 6. Chat / Pay (Your Exact Logic) */}
        <td className="p-3 text-right">
          {c.status === "scheduled" ? (
            c.paid ? (
              <button
                onClick={() => { setActiveConsultation(c); setSection("chat"); }}
                className="px-3 py-1 bg-green-600 text-white rounded-lg font-black text-[8px] uppercase tracking-tighter hover:bg-green-700 transition-colors"
              >
                Chat
              </button>
            ) : (
              <button
                onClick={() => handlePayConsultation(c)}
                className="px-3 py-1 bg-yellow-500 text-black rounded-lg font-black text-[8px] uppercase tracking-tighter hover:bg-yellow-600 transition-colors"
              >
                Pay ₹{c.fee}
              </button>
            )
          ) : (
            <span className="text-foreground/10 italic text-[14px]">—</span>
          )}
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="6" className="p-20 text-center text-[9px] font-black uppercase tracking-widest text-foreground/20 italic">
        No consultation requests sent yet.
      </td>
    </tr>
  )}
</tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
)}
     
       {section === "chat" && activeConsultation && (
  <div className="max-w-screen-md mx-auto h-[75vh] flex flex-col bg-card border border-border rounded-[2.5rem] shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
    
    {/* Header */}
    <div className="p-5 border-b border-border bg-card flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSection("consultation")}
          className="w-9 h-9 rounded-full hover:bg-foreground/5 flex items-center justify-center transition-colors text-foreground/40 hover:text-primary"
        >
          <span className="text-xl">←</span>
        </button>
        <div>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none mb-1">Consulting with</p>
          <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
            {activeConsultation.professional?.name || "Expert"}
          </h2>
        </div>
      </div>
      <div className="hidden sm:block text-right">
        <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[9px] font-bold uppercase tracking-widest border border-green-500/20">
          Secure
        </span>
      </div>
    </div>

    {/* Message Area */}
    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background/30">
      {messages.length ? (
        messages.map(m => (
          <div
            key={m._id}
            className={`flex ${m.senderRole === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl text-[13px] font-bold shadow-sm leading-relaxed ${
              m.senderRole === "user"
                ? "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10"
                : "bg-card border border-border text-foreground rounded-tl-none"
            }`}>
              {m.message}
            </div>
          </div>
        ))
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-foreground/20">
          <p className="text-xs font-bold uppercase tracking-widest">No conversation history</p>
        </div>
      )}
    </div>

    {/* Input Area */}
    <div className="p-5 bg-card border-t border-border">
      <form className="flex gap-3 items-end">
        <textarea
          value={chatText}
          onChange={e => setChatText(e.target.value)}
          className="flex-1 p-3 rounded-2xl bg-background border border-border text-sm font-bold focus:ring-2 ring-primary/20 outline-none resize-none min-h-[48px] max-h-32 text-foreground placeholder:text-foreground/30"
          placeholder="Ask something..."
          rows={1}
        />
        <button
          type="button"
          onClick={sendMessage}
          className="h-12 px-6 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
        >
          Send
        </button>
      </form>
    </div>
  </div>
)}

      {/* Premium Upgrade  */}
            {section === "premium" && (
              <div className="space-y-8 animate-in fade-in duration-500">
   {successType === "premium" && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-md animate-in fade-in duration-500 p-4">
    <div className="bg-card border-2 border-primary/30 p-10 rounded-[3rem] text-center shadow-2xl animate-in zoom-in duration-300 max-w-sm w-full">
      <div className="text-5xl mb-4 drop-shadow-lg">💎</div>
      <h3 className="text-2xl font-black uppercase tracking-tighter text-primary mb-2">Premium Activated</h3>
      <p className="text-sm font-bold text-foreground/60 leading-relaxed mb-8">Welcome! Your 3-month professional access is now fully activated.</p>
      <button 
        onClick={() => setSuccessType(null)} 
        className="w-full bg-primary text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/30 hover:brightness-110 transition-all"
      >
        Start Exploring
      </button>
    </div>
  </div>
)}
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">Consultation Premium</h2>
                  <p className="text-sm text-foreground/40 font-medium italic">Professional environmental guidance</p>
                </div>
                
                <div className="bg-card p-8 rounded-[2.5rem] shadow-card-shadow border border-border max-w-xl relative overflow-hidden">
                   {/* Decorative background element */}
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">💎</div>

                  <p className="text-sm font-bold text-foreground/50 mb-6 leading-relaxed">
                    Upgrade to <span className="text-primary font-black">PREMIUM</span> for ₹199 and get exclusive consultation access from sustainability professionals for 3 months.
                  </p>

                  {/* Show current premium status */}
                  {user?.premium ? (
                    <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <p className="text-xs font-bold text-primary uppercase tracking-widest">
                        Premium Active until: {user.premiumUntil ? new Date(user.premiumUntil).toLocaleDateString() : "—"}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                        Currently on Free Plan
                      </p>
                    </div>
                  )}

                  {/* Plan selection */}
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => setSelectedPlan(3)}
                      className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                        selectedPlan === 3 
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                        : "bg-background text-foreground/40 border-border hover:border-primary/50"
                      }`}
                    >
                      3 Months — ₹199
                    </button>
                  </div>

                  {/* Pay button */}
                  <button
                    onClick={handleUpgrade}
                    disabled={!selectedPlan || isBlocked}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg transition-all ${
                      isBlocked 
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none" 
                      : "bg-primary text-white hover:scale-[1.01] active:scale-[0.98] shadow-primary/20"
                    }`}
                  >
                    Pay & Get Consultation
                  </button>
                  <p className="mt-4 text-[10px] font-bold text-foreground/40 italic text-center">Consultant have their own separate fees.</p>

                  {/* Optional note */}
                  {isBlocked && (
                    <div className="mt-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest text-center">
                        Account Blocked — Contact Administrator
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/*  Donation Section  */}
        {section === "donation" && (
          <div className="space-y-8 animate-in fade-in duration-500 max-w-md mx-auto">
    {successType === "donation" && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-md animate-in fade-in duration-500 p-4">
    <div className="bg-green-500 text-white p-10 rounded-[3rem] text-center shadow-[0_20px_50px_rgba(34,197,94,0.4)] animate-in zoom-in duration-300 max-w-sm w-full border border-white/20">
      <div className="text-5xl mb-4 animate-bounce">🌱</div>
      <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Thank You!</h3>
      <p className="text-sm font-bold opacity-90 leading-relaxed mb-8">Your donation has been successfully processed. You're making a real difference!</p>
      <button 
        onClick={() => setSuccessType(null)} 
        className="w-full bg-white text-green-600 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
      >
        Close & Continue
      </button>
    </div>
  </div>
)}
            <div className="bg-card p-8 rounded-[2.5rem] shadow-card-shadow border border-border text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-600 text-3xl mb-6">
                🤝
              </div>
              <h2 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">Make a Donation</h2>
              <p className="text-xs font-bold text-foreground/40 italic mb-8">
                Your support helps us maintain a carbon-neutral platform.Please amount must be at least ₹50.
              </p>

              <form onSubmit={handleDonate} className="flex flex-col gap-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-foreground/20">₹</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 rounded-2xl bg-background border border-border text-sm font-black outline-none focus:ring-2 ring-blue-500/20 text-center transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98]"
                >
                  Confirm Donation
                </button>
              </form>

              {donationSuccess && (
                <div className="mt-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 animate-bounce">
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.15em]">
                    🎉 Impact recorded! Thank you.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}