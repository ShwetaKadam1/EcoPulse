"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api"; // axios wrapper that adds Firebase token
import { auth } from "@/firebase/client";
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

const COLORS = ["#34d399", "#06b6d4", "#f59e0b", "#3b82f6", "#a855f7"];

export default function ProfessionalDashboard() {
  const [user, setUser] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [section, setSection] = useState("dashboard");
  const [adviceMsg, setAdviceMsg] = useState("");
  const [docType, setDocType] = useState("degree"); // default selected type
  const [files, setFiles] = useState(null); // files selected by user
  const [uploading, setUploading] = useState(false); // upload in progress
  const REQUIRED_DOCUMENTS = ["degree", "id_proof", "license", "pcc", "experience", "other"];
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [requests, setRequests] = useState([]);
  const [adviceText, setAdviceText] = useState("");
  const [msg, setMsg] = useState("");
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("");
const [dateFilter, setDateFilter] = useState("");


  // Fetch user + consultations
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        let tries = 0;
        while (!auth.currentUser && tries < 8) {
          await new Promise((r) => setTimeout(r, 250));
          tries++;
        }

      const [meRes, allConsRes, docsRes, pendingRes, earningsRes] = await Promise.all([
  api.get("/api/professionals/me"),
  api.get("/api/professionals/consultations/all"),
  api.get("/api/professionals/documents/me"),
  api.get("/api/professionals/pendingAdvice"),
  api.get("/api/professionals/earnings"),
]);


        if (!mounted) return;
           setUser({
         ...meRes.data.professional,
            documents: docsRes.data.documents});
            setConsultations(allConsRes.data.consultations || []);
            setRequests(pendingRes.data || []);
            setTotalEarnings(earningsRes.data.totalEarnings || 0);
      } catch (err) {
        console.error("Professional dashboard load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  // Dark mode persistence
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
    const display = value ?? 0;
    return (
      <div className="p-5 rounded-[1.5rem] bg-card border border-border shadow-sm hover:border-primary/30 transition-all duration-300">
        {/* Title with a sharp, tech-style underline */}
        <div className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-3 pb-2 border-b border-border/50">
          {title}
        </div>
        
        {/* The Number: Bold, Italic, and Centered in the card's visual flow */}
        <div className="text-4xl font-black tracking-tighter italic text-foreground leading-none">
          {display}
        </div>
      </div>
    );
  }

  function isToday(date) {
  if (!date) return false;
  const d = new Date(date);
  const today = new Date();

  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

  // Compute stats
  const totalCompleted = consultations.filter(c => c.status?.toLowerCase() === "completed").length;
  const totalPending = consultations.filter(c => c.status?.toLowerCase() === "requested").length;
  const totalScheduled = consultations.filter(c => c.status?.toLowerCase() === "scheduled").length;
  const todaysSchedules = consultations.filter(c => c.status?.toLowerCase() === "scheduled" && isToday(c.scheduledFor));
  // Fee-related stats
const paidConsultations = consultations.filter(c => c.paid === true);
const unpaidConsultations = consultations.filter(
  c => c.status === "scheduled" && !c.paid
);

  const lineData = consultations
    .filter(c => c.status === "completed")
    .slice(-7)
    .map(c => ({
      date: new Date(c.requestedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: 1,
    }));

  
  // Update consultation status
  async function updateConsultationStatus(id, status, scheduledFor = null) {
  try {
    const res = await api.post("/api/professionals/consultation/update", { consultationId: id, status, scheduledFor });
    setConsultations(prev =>
      prev.map(c => (c._id === id ? { ...c, status, scheduledFor: scheduledFor || c.scheduledFor } : c))
    );
  } catch (err) {
    console.error(err);
    alert("Failed to update consultation");
  }
}


  // Send generic advice
  async function handleSendAdvice(e) {
    e.preventDefault();
    setAdviceMsg("Sending...");
    try {
      const res = await api.post("/api/professionals/advice", { text: adviceText });
      setAdviceMsg(`Sent to ${res.data.usersCount} users`);
      setAdviceText("");
    } catch (err) {
      console.error(err);
      setAdviceMsg("Failed to send");
    }
  }

async function handleUpload(e) {
  e.preventDefault();
  if (!files || files.length === 0) return;

  const formData = new FormData();
  for (let f of files) formData.append("files", f);
  formData.append("type", docType);

  try {
    setUploading(true);

    // Get Firebase ID token
    const token = await auth.currentUser.getIdToken();

    const res = await api.post("/api/professionals/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${token}`
      }
    });

    setUser(prev => {
  if (!prev) return prev;

  const existingDocs = Array.isArray(prev.documents)
    ? prev.documents
    : [];

  const newDocs = Array.isArray(res.data?.documents)
    ? res.data.documents
    : [];

  const otherDocs = existingDocs.filter(d => d.type !== docType);

  return {
    ...prev,
    documents: [...otherDocs, ...newDocs]
  };
});

    setFiles(null);
    alert("Documents uploaded successfully");
  } catch (err) {
    console.error("Upload failed:", err.response?.data || err);
    alert("Upload failed");
  } finally {
    setUploading(false);
  }
}

 const sendAdvice = async (requestId) => {
    if (!adviceText.trim()) return alert("Enter advice!");
    setMsg("Sending...");
    try {
      await api.post("/api/professionals/sendAdvice", { requestId, adviceText });
      setMsg("Advice sent!");
      setAdviceText("");
      setRequests((prev) => prev.filter(r => r._id !== requestId));
    } catch (err) {
      console.error(err);
      setMsg("Failed to send advice");
    }
  };


  const menuItems = [
    { id: "dashboard", label: "Dashboard", emoji: "📊" },
    { id: "consultations", label: "Consultations", emoji: "📋" },
    { id: "advice", label: "Advice", emoji: "📝" },
    { id: "documents", label: "Documents", emoji: "📁"},
    { id: "profile", label: "Profile", emoji: "👤" },
  ];

  const isApproved = user?.approvalStatus === "approved";
  const restrictedSections = ["dashboard", "consultations", "advice"];
  const isRestricted = (id) =>
  !isApproved && restrictedSections.includes(id);
  const allowedSections = isApproved
  ? menuItems.map(m => m.id)
  : ["documents", "profile"];
 
  useEffect(() => {
  if (!user) return;

  if (isRestricted(section)) {
    setSection("documents");
  }
}, [user, section]);
  
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

return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300 font-sans selection:bg-primary selection:text-white">
      {/* SIDEBAR - Slimmed down to w-64 */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-card border-r border-border p-3 transition-all duration-300 ease-in-out flex flex-col shadow-xl z-20`}>
        
        {/* TOP: Identity Header */}
        <div className="flex flex-col mb-6">
          <div className={`flex items-center mb-4 ${sidebarOpen ? "justify-between px-1" : "justify-center"}`}>
            {sidebarOpen && (
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70">
                Eco Consultant
              </span>
            )}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-all bg-background border border-border text-[10px]"
            >
              {sidebarOpen ? "❮" : "❯"}
            </button>
          </div>

          {/* Identity Card - More Compact */}
          <div className={`flex items-center gap-2.5 transition-all ${sidebarOpen ? "p-3 rounded-2xl bg-background/40 border border-border/60 shadow-sm" : "flex-col"}`}>
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-lg font-black shadow-md italic">
              {user?.name ? user.name.charAt(0).toUpperCase() : "P"}
            </div>

            {sidebarOpen ? (
              <div className="overflow-hidden">
                <div className="text-xs font-black uppercase tracking-tighter leading-tight">
                  {user?.name || "Professional"}
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_4px_#22c55e]"></div>
                  <div className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest">Verified</div>
                </div>
              </div>
            ) : (
              <div className="w-1 h-1 bg-green-500 rounded-full mt-1"></div>
            )}
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-col gap-1 flex-1">
          {menuItems
            .filter(m => allowedSections.includes(m.id))
            .map((m) => (
              <button
                key={m.id}
                onClick={() => setSection(m.id)}
                className={`group flex items-center gap-3 w-full p-2.5 rounded-xl transition-all ${
                  section === m.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "hover:bg-primary/5 text-foreground/60 hover:text-primary"
                }`}
              >
                <span className="text-lg group-hover:scale-110 transition-transform">{m.emoji}</span>
                {sidebarOpen && <span className="font-bold text-[11px] uppercase tracking-wider">{m.label}</span>}
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
      <main className="flex-1 p-6 lg:p-8 overflow-auto bg-background/50">
        
        {/* TOP HEADER - Corrected Metrics */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">
              {section} <span className="text-primary text-[10px] not-italic tracking-widest ml-1 opacity-40"></span>
            </h1>
            <p className="text-[11px] text-foreground/40 font-bold uppercase tracking-widest">
              Welcome, {user?.name?.split(' ')[0]} • {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Stats Badge - Compact with Completed focus */}
          <div className="flex items-center gap-3">
            <div className="bg-card p-2.5 px-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
              <div className="text-right">
                <div className="text-[9px] font-black uppercase tracking-widest text-primary/60">
                  Completed
                </div>
                <div className="text-lg font-black text-foreground italic">
                  {totalCompleted}
                </div>
              </div>
              <div className="h-6 w-[1px] bg-border"></div>
              <div className="text-right">
                <div className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
                  Total Earnings
                </div>
                <div className="text-sm font-black text-foreground/60 italic">
                  ₹{totalEarnings}
                </div>
              </div>
            </div>
          </div>
        </header>

        {loading && (
          <div className="flex flex-col items-center justify-center h-64 opacity-50">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Loading Dashboard...</p>
          </div>
        )}

        {!loading && (
          <>
         {/* Top Approval Status Box (only for pending/rejected) */}
{user?.approvalStatus !== "approved" && (
  <div className={`mb-6 p-6 rounded-2xl 
      ${user?.approvalStatus === "rejected" ? "bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 border-red-200 dark:border-red-700"
        : "bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700"
      } text-center border`}>
    <span className="text-2xl md:text-4xl font-extrabold">
      {user?.approvalStatus === "pending" && "Pending Approval"}
      {user?.approvalStatus === "rejected" && "Rejected"}
    </span>
    {user?.approvalStatus === "rejected" && user.rejectionReason && (
    <div className="mt-1 text-xs">
      Contact admin for details through email.  
    </div>
  )}
  </div>
)}
           {section === "dashboard" && (
  <>
    {/* Status Alert */}
    {user?.isStarred && (
      <div className="mb-6 p-5 rounded-2xl border border-blue-100 bg-blue-50/50 dark:bg-blue-900/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Account Status: Active Expert
            </h3>
            <p className="text-sm text-foreground mt-1">
              You are currently authorized to provide sustainability advice to users.
            </p>
            <p className="text-[11px] text-foreground/50 mt-1">
              Assigned on {new Date(user.starAssignedAt).toLocaleDateString()}
            </p>
          </div>
          <span className="w-fit px-4 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
            Verified
          </span>
        </div>
      </div>
    )}

    {/* Metric Grid */}
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <NeoCard title="Completed" value={totalCompleted} />
      <NeoCard title="Pending" value={totalPending} />
      <NeoCard title="Scheduled" value={totalScheduled} />
      <NeoCard title="Today" value={todaysSchedules.length} />
      <NeoCard title="Total Earnings (₹)" value={totalEarnings} />
    </section>

    {/* Today's Schedule Table */}
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-border">
        <h2 className="text-sm font-bold uppercase tracking-tight">Today's Schedule</h2>
      </div>

      <div className="overflow-x-auto">
        {todaysSchedules.length ? (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-foreground/[0.02]">
                <th className="p-4 text-[10px] font-bold uppercase text-foreground/50">User</th>
                <th className="p-4 text-[10px] font-bold uppercase text-foreground/50">Date</th>
                <th className="p-4 text-[10px] font-bold uppercase text-foreground/50">Log Date</th>
                <th className="p-4 text-[10px] font-bold uppercase text-foreground/50">Last Log</th>
                <th className="p-4 text-[10px] font-bold uppercase text-foreground/50">Notes</th>
                <th className="p-4 text-right text-[10px] font-bold uppercase text-foreground/50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {todaysSchedules.map(c => (
                <tr key={c._id} className="hover:bg-foreground/[0.01] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {c.user?.name?.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-foreground">{c.user?.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-foreground/60">
                    {new Date(c.scheduledFor).toLocaleDateString()}
                  </td>
                  <td className="p-4">{c.user.lastFootprint ? (
            <div className="font-black text-[9px] text-foreground/40">
        Log Date: {new Date(c.user.lastLogDate).toLocaleDateString()}
      </div>
          ) : (
            <span className="text-[10px] font-medium text-foreground/30">No logs</span>
          )}</td>

                  {/* Last Footprint (NEW) */}
        <td className="p-4">
          {c.user.lastFootprint ? (
            <div className="text-[10px] font-medium text-foreground/60">
              <div>Total: {c.user.lastFootprint.total}</div>
              <div>Travel: {c.user.lastFootprint.travel}</div>
              <div>Food: {c.user.lastFootprint.food}</div>
              <div>Electricity: {c.user.lastFootprint.electricity}</div>
              <div>Water: {c.user.lastFootprint.water}</div>
              <div>Shopping: {c.user.lastFootprint.shopping}</div>
            </div>
          ) : (
            <span className="text-[10px] font-medium text-foreground/30">No logs</span>
          )}
        </td>
                  <td className="p-4 text-sm text-foreground/60">
                    {c.notes || "—"}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setActiveConsultation(c); setSection("chat"); }}
                        className="px-4 py-2 bg-foreground text-background dark:bg-white dark:text-black rounded-xl text-[10px] font-bold uppercase"
                      >
                        Chat
                      </button>
                      <button
                        onClick={() => updateConsultationStatus(c._id, "completed")}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase"
                      >
                        Mark Complete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-foreground/30 text-sm">
            No consultations scheduled for today.
          </div>
        )}
      </div>
    </div>
  </>
)}

   {section === "chat" && activeConsultation && (
  <div className="max-w-4xl mx-auto h-[75vh] flex flex-col bg-card border border-border rounded-[2rem] shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
    
    {/* Header */}
    <div className="p-4 border-b border-border bg-card flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSection("dashboard")}
          className="w-8 h-8 rounded-full hover:bg-foreground/5 flex items-center justify-center transition-colors"
          title="Go back"
        >
          <span className="text-lg">←</span>
        </button>
        <div>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Chatting with</p>
          <h2 className="text-lg font-black text-foreground leading-none">{activeConsultation.user.name}</h2>
        </div>
      </div>
      <div className="hidden sm:block">
        <span className="text-[10px] font-bold text-foreground/30 uppercase">Secure Session</span>
      </div>
    </div>

    {/* Message Area */}
    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background/30">
      {messages.length ? (
        messages.map(m => (
          <div
            key={m._id}
            className={`flex ${m.senderRole === "professional" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm ${
              m.senderRole === "professional"
                ? "bg-primary text-white rounded-tr-none"
                : "bg-card border border-border text-foreground rounded-tl-none"
            }`}>
              {m.message}
            </div>
          </div>
        ))
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-foreground/30">
          <p className="text-sm font-bold uppercase tracking-widest">No messages yet</p>
        </div>
      )}
    </div>

    {/* Input Area */}
    <div className="p-4 bg-card border-t border-border">
      <form className="flex gap-3 items-end">
        <textarea
          value={chatText}
          onChange={e => setChatText(e.target.value)}
          className="flex-1 p-3 rounded-xl bg-background border border-border text-sm focus:ring-2 ring-primary/20 outline-none resize-none min-h-[44px] max-h-32"
          placeholder="Write your advice here..."
          rows={1}
        />
        <button
          type="button"
          onClick={sendMessage}
          className="h-11 px-6 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
        >
          Send
        </button>
      </form>
    </div>
  </div>
)}

           {section === "consultations" && (
  <div className="space-y-6 animate-in fade-in duration-500">
    
    {/* FILTERS */}
    <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3">
      <input
        type="text"
        placeholder="Search user or notes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-1 p-2.5 px-4 bg-background border border-border rounded-xl text-sm font-bold outline-none focus:ring-2 ring-primary/20 transition-all placeholder:text-foreground/20"
      />

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="p-2.5 px-4 bg-background border border-border rounded-xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
      >
        <option value="">All Statuses</option>
        <option value="requested">Requested</option>
        <option value="scheduled">Scheduled</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <input
        type="date"
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
        className="p-2.5 px-4 bg-background border border-border rounded-xl text-[10px] font-black uppercase outline-none"
      />
    </div>

    {/* DATA TABLE */}
    <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        {consultations.length ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/[0.02] border-b border-border">
                <th className="p-4 px-6 text-[9px] font-black uppercase tracking-widest text-foreground/40">User</th>
                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-foreground/40">Timeline (Dates)</th>
                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-foreground/40">Last Log</th>
                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-foreground/40">Consultation Notes</th>
                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-foreground/40 text-center">Status</th>
                <th className="p-4 text-[9px] font-black uppercase tracking-widest text-foreground/40 text-center">Fee</th>
                <th className="p-4 px-6 text-[9px] font-black uppercase tracking-widest text-foreground/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {consultations
                .filter((c) => {
                  const matchesSearch = c.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                       (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));
                  const matchesStatus = statusFilter ? c.status === statusFilter : true;
                  const matchesDate = dateFilter ? new Date(c.requestedAt).toISOString().slice(0, 10) === dateFilter : true;
                  return matchesSearch && matchesStatus && matchesDate;
                })
                .map((c) => (
                  <tr key={c._id} className="hover:bg-primary/[0.01] transition-colors">
                    <td className="p-4 px-6">
                      <span className="text-sm font-bold text-foreground">{c.user.name}</span>
                    </td>
                    
                    {/* Combined Date Column (No Time) */}
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="text-[10px] font-bold text-foreground/40 uppercase">
                          Req: {new Date(c.requestedAt).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] font-black text-primary uppercase">
                          Pref: {c.scheduledFor ? new Date(c.scheduledFor).toLocaleDateString() : 
                                 c.preferredDate ? new Date(c.preferredDate).toLocaleDateString() : "—"}
                        </div>
                      </div>
                    </td>

                    {/* Last Footprint (NEW) */}
        <td className="p-4">
          {c.user.lastFootprint ? (
            <div className="text-[10px] font-medium text-foreground/60">
              <div className="font-black text-[9px] text-foreground/40">
        Log Date: {new Date(c.user.lastLogDate).toLocaleDateString()}
      </div>
              <div>Total: {c.user.lastFootprint.total}</div>
              <div>Travel: {c.user.lastFootprint.travel}</div>
              <div>Food: {c.user.lastFootprint.food}</div>
              <div>Electricity: {c.user.lastFootprint.electricity}</div>
              <div>Water: {c.user.lastFootprint.water}</div>
              <div>Shopping: {c.user.lastFootprint.shopping}</div>
            </div>
          ) : (
            <span className="text-[10px] font-medium text-foreground/30">No logs</span>
          )}
        </td>


                    {/* Dedicated Notes Column */}
                    <td className="p-4">
                      <p className="text-[11px] font-medium text-foreground/60 max-w-[200px] leading-snug">
                        {c.notes || "—"}
                      </p>
                    </td>

                    {/* Status Badge Column */}
                    <td className="p-4 text-center">
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md border tracking-widest ${
                        c.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        c.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        c.status === 'requested' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        'bg-foreground/5 text-foreground/40 border-border'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex flex-col">
                        <span className="text-xs font-black">₹{c.consultationFee || 0}</span>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${c.paid ? 'text-green-500' : 'text-foreground/20'}`}>
                          {c.paid ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {c.status === "requested" && (
                          <>
                            <button
                              onClick={() => updateConsultationStatus(c._id, "scheduled", c.preferredDate)}
                              className="px-3 py-1.5 bg-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => updateConsultationStatus(c._id, "cancelled")}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                            >
                              Deny
                            </button>
                          </>
                        )}
                        {c.status === "scheduled" && (
                          <button
                            onClick={() => updateConsultationStatus(c._id, "completed")}
                            className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                          >
                            Mark Complete
                          </button>
                        )}
                        {c.status === "completed" && <span className="text-[10px] font-black text-green-500 italic uppercase">Done</span>}
                        {c.status === "cancelled" && <span className="text-[10px] font-black text-foreground/20 italic uppercase">Closed</span>}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <div className="p-16 text-center text-foreground/20 font-black uppercase text-xs tracking-widest">
            No consultations found.
          </div>
        )}
      </div>
    </div>
  </div>
)}

            {section === "advice" && (
  <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
    
    {/* Section Header */}
    <div className="flex items-center justify-between mb-2 px-2">
      <h3 className="text-sm font-bold uppercase tracking-tight text-foreground/60">
        Pending Advice Requests
      </h3>
      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
        {requests.length} Requests
      </span>
    </div>

    {requests.length === 0 ? (
      <div className="bg-card border border-border rounded-[2rem] p-12 text-center">
        <p className="text-sm font-medium text-foreground/30">No pending advice requests at this time.</p>
      </div>
    ) : (
      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r._id} className="bg-card border border-border rounded-[2rem] p-6 shadow-sm hover:border-primary/30 transition-colors">
            {/* Input Area */}
            <textarea
              value={adviceText}
              onChange={(e) => setAdviceText(e.target.value)}
              placeholder="Provide your professional sustainability advice..."
              className="w-full p-4 rounded-2xl bg-background border border-border text-sm font-medium focus:ring-2 ring-primary/20 outline-none resize-none placeholder:text-foreground/20 transition-all"
              rows={4}
            />
            
            <div className="flex items-center justify-between mt-4">
              <p className="text-[10px] text-foreground/40 font-medium">
                Ensure advice is actionable and concise.
              </p>
              <button
                onClick={() => sendAdvice(r._id)}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-[11px] font-bold uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
              >
                Send Advice
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Simple Feedback Message */}
    {msg && (
      <div className="text-center p-3 rounded-xl bg-foreground/5 border border-border animate-pulse">
        <span className="text-xs font-bold text-foreground/60">{msg}</span>
      </div>
    )}
  </div>
)}

             {section === "documents" && (
  <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
    
    {/* Header & Info */}
    <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
      <h2 className="text-lg font-bold text-foreground mb-2">Verification Documents</h2>
      <p className="text-xs font-medium text-foreground/40 leading-relaxed mb-6">
        Upload professional certificates, IDs, or licenses for admin approval to verify your expert status.
        Make sure they are named accordingly (e.g., degree.pdf, id_proof.jpg).After Verification 
        Admin will contact for terms and condition through email.
      </p>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-1">Document Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="p-3 rounded-xl bg-background border border-border text-sm font-bold outline-none focus:ring-2 ring-primary/20 cursor-pointer"
          >
            {["degree", "id_proof", "license", "pcc", "experience", "other"].map((type) => {
              const doc = user.documents?.find(d => d.type === type);
              return (
                <option key={type} value={type}>
                  {type.replace("_", " ").toUpperCase()}
                  {doc?.approvalStatus === "approved" ? " (VERIFIED)" : ""}
                </option>
              )
            })}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => document.getElementById("fileInput").click()}
            className="w-full sm:w-auto px-6 py-2.5 bg-foreground text-background dark:bg-white dark:text-black rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 transition-all"
            disabled={user?.documents?.some(d => d.type === docType && d.approvalStatus === "approved")}
          >
            Choose Files
          </button>
          
          <span className="text-[11px] font-medium text-foreground/40 truncate max-w-[200px]">
            {files && files.length > 0
              ? Array.from(files).map(f => f.name).join(", ")
              : "No file selected"}
          </span>

          <input
            id="fileInput"
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            className="hidden"
          />
        </div>

        <button
          type="submit"
          disabled={uploading || user?.documents?.some(d => d.type === docType && d.approvalStatus === "approved")}
          className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-lg ${
            uploading || user?.documents?.some(d => d.type === docType && d.approvalStatus === "approved")
              ? "bg-foreground/10 text-foreground/30 cursor-not-allowed shadow-none"
              : "bg-primary text-white shadow-primary/20 hover:scale-[1.01]"
          }`}
        >
          {uploading ? "Processing..." : "Submit for Review"}
        </button>
      </form>
    </div>

    {/* Document List & Missing Status */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Uploaded List */}
      <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-4 pb-2 border-b border-border">
          Uploaded
        </h3>
        {user?.documents?.length ? (
          <div className="space-y-3">
            {user.documents.map((d, i) => (
              <div key={i} className="flex flex-col gap-1">
                <a href={`http://localhost:5000${d.url}`} target="_blank" rel="noopener noreferrer" 
                   className="text-xs font-bold text-foreground hover:text-primary transition-colors truncate">
                  {d.filename}
                </a>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold uppercase tracking-tighter ${
                    d.approvalStatus === "approved" ? "text-green-500" : 
                    d.approvalStatus === "rejected" ? "text-red-500" : "text-yellow-500"
                  }`}>
                    {d.approvalStatus} {d.approvalStatus === "rejected" && `- ${d.rejectionReason || "Review failed"}`}
                  </span>
                  {d.approvalStatus === "rejected" && (
                    <button onClick={() => setDocType(d.type)} className="text-[9px] font-bold text-primary underline">
                      Retry
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-medium text-foreground/20 italic">No uploads yet.</p>
        )}
      </div>

      {/* Missing Required */}
      <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-red-500/50 mb-4 pb-2 border-b border-border">
          Pending Verification
        </h3>
        <ul className="space-y-2">
          {["degree","id_proof","license","pcc","experience","other"]
            .filter(type => !user.documents?.some(d => d.type === type && d.approvalStatus === "approved"))
            .map(type => (
              <li key={type} className="text-[11px] font-bold text-foreground/60 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-red-400/50"></span>
                {type.replace("_", " ").toUpperCase()}
              </li>
            ))}
        </ul>
      </div>

    </div>
  </div>
)}


            {section === "profile" && (
  <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
    {/* Title Header */}
    <div className="flex flex-col gap-1 mb-6">
      <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">Expert Profile</h2>
      <p className="text-sm text-foreground/40 font-medium italic">Your professional credentials and status</p>
    </div>

    <div className="bg-card rounded-[3rem] shadow-sm border border-border overflow-hidden">
      {/* Profile Header Decoration */}
      <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 border-b border-border" />
      
      <div className="p-8 md:p-12 -mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Left Side: Professional Identity */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-primary/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{user?.name || "Professional"}</h3>
                <div className={`mt-1 inline-block px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${
                  user?.approvalStatus === "approved" ? "bg-green-500/10 text-green-500 border-green-500/20" 
                  : user?.approvalStatus === "rejected" ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                }`}>
                  {user?.approvalStatus || "Pending"}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="pb-4 border-b border-border/50">
                <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1">Email Address</p>
                <p className="text-sm font-bold text-foreground">{user?.email || "-"}</p>
              </div>
              <div className="pb-4 border-b border-border/50">
                <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1">Expertise & Skills</p>
                <p className="text-sm font-bold text-foreground">{user?.skills?.join(", ") || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1">Languages</p>
                <p className="text-sm font-bold text-foreground">{user?.languages?.join(", ") || "-"}</p>
              </div>
            </div>
          </div>

          {/* Right Side: Professional Stats & Actions */}
          <div className="flex flex-col justify-between space-y-8 bg-background/50 p-8 rounded-[2.5rem] border border-border/50">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Years Experience</span>
                <span className="text-xl font-black text-foreground">{user?.experience || "0"}</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-border pb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Certifications</span>
                <span className="text-xl font-black text-primary">
                  {user?.documents?.filter(d => d.approvalStatus === "approved").length || 0}
                </span>
              </div>

              {user?.approvalStatus === "rejected" && (
                <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Rejection Note</p>
                  <p className="text-xs text-foreground/60 leading-snug">Please re-upload your valid ID and License in the documents section.</p>
                </div>
              )}
            </div>

            <button 
              onClick={async () =>{ await auth.signOut(); window.location.href = "/"; }} 
              className="w-full px-6 py-3 rounded-xl bg-red-500/5 text-red-600 font-bold text-[12px] uppercase tracking-[0.2em] border border-red-500/10 hover:bg-red-500 hover:text-white transition-all duration-300"
            >
              Sign Out
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
)}
          </>
        )}
        
      </main>
    </div>
  );
}
