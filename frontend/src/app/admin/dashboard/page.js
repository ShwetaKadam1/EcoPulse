"use client";

import React, { useEffect, useState } from "react";
import adminApi from "@/lib/adminApi";
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
  CartesianGrid,
} from "recharts";

const COLORS = ["#34d399", "#60a5fa", "#fbbf24", "#06B6D4", "#a78bfa", "#FF4500"];
function AnimatedDropdown({ title, isOpen, onClick, children }) {
  return (
    <div className="mb-3 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-[var(--card-shadow)] transition-colors"> {/* small gap between dropdowns */}
      {/* Header */}
      <button
        type="button"
        onClick={onClick}
        className="w-full p-4 text-left flex justify-between items-center
                   text-[var(--foreground)]
                   hover:bg-[var(--background)] transition">
        <span className="text-lg font-semibold">{title}</span>
        <span
          className={`transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out
          ${isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        {/* controlled small gap */}
        {isOpen && <div className="pt-2">{children}</div>}
      </div>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full mb-3 px-4 py-2 rounded-lg border
      focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}


export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [footprintLogs, setFootprintLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("dashboard");
  const [consultants, setConsultants] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [openDocs, setOpenDocs] = useState({});
  const [selectedPro, setSelectedPro] = useState("");
  const [msg, setMsg] = useState("");
  const [payments, setPayments] = useState([]);
  const [earningsData, setEarningsData] = useState([]);
  const [consultationPayments, setConsultationPayments] = useState([]);
const [donationPayments, setDonationPayments] = useState([]);
const [paymentSummary, setPaymentSummary] = useState({
  totalPremium: 0,
  totalDonations: 0,
  totalConsultations: 0,
  totalBalance: 0,
});
const [openPayment, setOpenPayment] = useState("premium");
const [searchPremium, setSearchPremium] = useState("");
const [searchDonations, setSearchDonations] = useState("");
const [searchConsultations, setSearchConsultations] = useState("");
const [weeklyAdvice, setWeeklyAdvice] = useState(null);
const [sidebarOpen, setSidebarOpen] = useState(true);

  
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const token = localStorage.getItem("admin_token");
      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      try {
        const [usersRes, prosRes, logsRes, documentsRes, adviceRes] = await Promise.all([
         adminApi.get("/admin/users"),
         adminApi.get("/admin/professionals"),
         adminApi.get("/admin/footprintLogs"),
         adminApi.get("/admin/documents"),
         adminApi.get("/admin/weeklyAdvice/latest")
        ]);
        

        // Normalize Users
        const normalizedUsers = (usersRes.data || []).map(u => ({
          _id: u._id,
          firebaseUID: u.firebaseUID,
          name: u.name || "-",
          email: u.email || "-",
          premium: Boolean(u.premium),
          isBlocked: Boolean(u.isBlocked || u.blockedAt),
          blockedReason: u.blockedReason || "",
        }));
      
        // Normalize Documents
const docs = (documentsRes.data || []).map(d => ({
  ...d,
  consultant: d.consultant._id,  // make sure _id matches type
  uploadedAt: new Date(d.uploadedAt),
}));

        // Normalize Professionals
        const pros = (prosRes.data || []).map(p => ({
          _id: p._id,
          firebaseUID: p.firebaseUID,
          name: p.name || "-",
          email: p.email || "-",
          approvalStatus: p.approvalStatus || "pending",
          experience: p.experience,
          skills: p.skills || [],
          languages: p.languages || [],
          consultationFee: p.consultationFee || 0,
          earnings: p.earnings || 0,
          sStarred: Boolean(p.isStarred),           
          starAssignedAt: p.starAssignedAt || null,
          createdAt: new Date(p.createdAt),
          documents: docs.filter(d => d.consultant === p._id.toString())
        }));

        // Normalize FootprintLogs
        const normalizedLogs = (logsRes.data || []).map(log => ({
          ...log,
          date: log.date ? new Date(log.date) : new Date(),
          totals: log.totals || {},
        }));
      
      

        setUsers(normalizedUsers);
        setProfessionals(pros);
        setFootprintLogs(normalizedLogs);
        setDocuments(docs); 
        setWeeklyAdvice(adviceRes.data?.advice || null);

        console.log("Users:", normalizedUsers);
        console.log("FootprintLogs:", normalizedLogs);
        console.log("PROFESSIONALS RES:", prosRes.data);


      } catch (err) {
        console.error("Fetch error:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

const approveProfessional = async (id) => {
  try {
    await adminApi.post(`/admin/professionals/${id}/approve`);
    const res = await adminApi.get("/admin/professionals");
    const docs = documents || [];
    const normalized = (res.data || []).map(p => ({
      ...p,
      documents: docs.filter(d => d.consultant === p._id)
    }));
    setProfessionals(normalized);
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    if (msg === "All documents not approved") {
      window.alert("Please approve all documents before approving this professional!");
    } else {
      console.error("Approve error:", msg);
      window.alert("Error: " + msg);
    }
  }
};


const rejectProfessional = async (id) => {
  try {
    await adminApi.post(`/admin/professionals/${id}/reject`, { reason: "Rejected" });
    const res = await adminApi.get("/admin/professionals");
    setProfessionals(res.data || []);
    const docs = documents || [];
    const normalized = (res.data || []).map(p => ({
      ...p,
      documents: docs.filter(d => d.consultant === p._id)
    }));
    setProfessionals(normalized);
  } catch (err) {
    console.error("Reject error:", err.response?.data || err.message);
  }
};

const approveDocument = async (docId, approve) => {
  try {
    await adminApi.post(`/admin/documents/${docId}/approve`, { approve });

    // Refresh documents
    const docsRes = await adminApi.get("/admin/documents");
    const docs = (docsRes.data || []).map(d => ({
      ...d,
      consultant: d.consultant._id,
      uploadedAt: new Date(d.uploadedAt)
    }));
    setDocuments(docs);

    // Update professionals with new documents
    setProfessionals(prev =>
      prev.map(p => ({
        ...p,
        documents: docs.filter(d => d.consultant == p._id)
      }))
    );

  } catch (err) {
    console.error(err.response?.data || err.message);
  }
};

const rejectDocument = async (docId) => {
  try {
    await adminApi.post(`/admin/documents/${docId}/reject`, {
      reason: "Invalid or incorrect document"
    });

    // Refresh documents
    const docsRes = await adminApi.get("/admin/documents");
    const docs = (docsRes.data || []).map(d => ({
      ...d,
      consultant: d.consultant._id,
      uploadedAt: new Date(d.uploadedAt),
    }));

    setDocuments(docs);

    // Update professionals with refreshed documents
    setProfessionals(prev =>
      prev.map(p => ({
        ...p,
        documents: docs.filter(d => d.consultant === p._id)
      }))
    );
  } catch (err) {
    console.error("Reject document error:", err.response?.data || err.message);
  }
};

const toggleDocs = (id) => {
  setOpenDocs(prev => ({
    ...prev,
    [id]: !prev[id],
  }));
};

const handleRequest = async (professionalId) => {
  if (!professionalId) return;

  setMsg("Requesting...");

  try {
    const res = await adminApi.post("/admin/requestAdvice", { professionalId });

    // Update professionals list with latest isStarred
    const prosRes = await adminApi.get("/admin/professionals");
    const docs = documents || [];

    const updatedPros = (prosRes.data || []).map(p => ({
      ...p,
      documents: docs.filter(d => d.consultant === p._id),
    }));

    setProfessionals(updatedPros);
    setMsg(res.data.message);
  } catch (err) {
    console.error(err);
    setMsg("Failed to send request");
  }
};


const handleStarToggle = async (professionalId) => {
  if (!professionalId) return;

  setMsg("Processing...");
  try {
    const res = await adminApi.post("/admin/requestAdvice", { professionalId });

    // Update frontend list to reflect new star state
    setProfessionals((prev) =>
      prev.map((p) => {
        if (p._id === professionalId) {
          return { ...p, isStarred: !p.isStarred }; // toggle clicked professional
        }
        return { ...p, isStarred: false }; // remove star from others
      })
    );

    setMsg(res.data.message);
  } catch (err) {
    console.error(err);
    setMsg("Failed to toggle star");
  }
};


const fetchPayments = async () => {
  try {
    // Premium payments
    const premiumRes = await adminApi.get("/admin/payments/premium");
    const premium = (premiumRes.data || []).map(p => ({
      _id: p._id,
      email: p.userId?.email || p.email || "-",
      amount: p.amount || 0,
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      purpose: "Premium Upgrade",
      status: "SUCCESS",
    }));

    // Donation payments
    const donationRes = await adminApi.get("/admin/payments/donations");
    const donationsRaw = donationRes.data?.donations || [];
    const donations = donationsRaw.map(p => ({
      _id: p._id,
      email: p.userId?.email || p.email || "-",
      amount: p.amount || 0,
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      purpose: "Donation",
      status: "SUCCESS",
    }));

    // Consultation earnings (90% professional, 10% admin)
/// Consultation earnings (90% professional, 10% admin)
const earningsRes = await adminApi.get("/admin/professionals/earnings");
const consultations = (earningsRes.data || []).map(p => ({
  _id: p._id,
  professional: p.name || p.email,
  professionalAmount: p.professionalEarnings || 0, // 90%
  adminAmount: p.adminEarnings || 0,              // 10%
  date: new Date(p.date || Date.now()),            // use consultation date
}));

setPayments(premium);
setDonationPayments(donations);
setConsultationPayments(consultations);

    // Combine all payments
    const allPayments = [...premium, ...donations, ...consultations];

    // Compute totals
    const totalPremium = premium.reduce((sum, p) => sum + p.amount, 0);
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalConsultations = consultations.reduce(
  (sum, c) => sum.professionalAmount + c.adminAmount + sum,
  0
);
 const adminConsultationTotal = consultations.reduce(
  (sum, c) => sum + c.adminAmount,
  0
);

setPaymentSummary({
  totalPremium,
  totalDonations,
  totalConsultations: adminConsultationTotal,
  totalBalance: totalPremium + totalDonations + adminConsultationTotal,
});

    console.log("Premium:", premium, "Donations:", donations, "Consultations:", consultations);
  } catch (err) {
    console.error("Payment fetch error:", err.response?.data || err.message);
  }
};

useEffect(() => {
  if (section === "payments") {
    fetchPayments();
  }
}, [section]);

  if (loading) return <div className="p-4">Loading...</div>;

  // Compute totals from footprintLogs
  const totals = footprintLogs.reduce(
    (acc, log) => {
      acc.travel += log.totals?.travel || 0;
      acc.food += log.totals?.food || 0;
      acc.electricity += log.totals?.electricity || 0;
      acc.water += log.totals?.water || 0;
      acc.shopping += log.totals?.shopping || 0;
      acc.gas += log.totals?.gas || 0; 
      acc.total += log.totals?.total || 0;
      return acc;
    },
    { travel: 0, food: 0, electricity: 0, water: 0, shopping: 0, gas: 0, total: 0 }
  );
  
  // Precompute totals for each user
const userTotalsMap = users.reduce((map, user) => {
  const logs = footprintLogs.filter(log => log.firebaseUID === user.firebaseUID);
  
  map[user.firebaseUID] = logs.reduce(
    (acc, log) => {
      acc.travel += log.totals?.travel || 0;
      acc.food += log.totals?.food || 0;
      acc.electricity += log.totals?.electricity || 0;
      acc.water += log.totals?.water || 0;
      acc.shopping += log.totals?.shopping || 0;
      acc.gas += log.totals?.gas || 0;
      acc.total += log.totals?.total || 0;
      return acc;
    },
    { travel: 0, food: 0, electricity: 0, water: 0, shopping: 0, gas: 0, total: 0 }
  );

  return map;
}, {});

  // Weekly trend
  const weeklyCategoryTrend = (() => {
    const today = new Date();
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const dateStr = day.toISOString().split("T")[0];

      const dailyTotals = {
        day: day.toLocaleDateString("en-US", { weekday: "short" }),
        travel: 0,
        food: 0,
        electricity: 0,
        water: 0,
        shopping: 0,
        gas: 0,
      };

      footprintLogs.forEach(log => {
        const logDate = new Date(log.date).toISOString().split("T")[0];
        if (logDate === dateStr) {
          dailyTotals.travel += log.totals?.travel || 0;
          dailyTotals.food += log.totals?.food || 0;
          dailyTotals.electricity += log.totals?.electricity || 0;
          dailyTotals.water += log.totals?.water || 0;
          dailyTotals.shopping += log.totals?.shopping || 0;
          dailyTotals.gas += log.totals?.gas || 0;
        }
      });

      trend.push(dailyTotals);
    }
    return trend;
  })();

  const pieData = [
    { name: "Travel", value: totals.travel },
    { name: "Food", value: totals.food },
    { name: "Electricity", value: totals.electricity },
    { name: "Water", value: totals.water },
    { name: "Shopping", value: totals.shopping },
    { name: "Gas", value: totals.gas },
  ];
  const totalFootprint = totals.total || 1; // avoid divide by zero

const piePercentData = pieData.map(item => ({
  ...item,
  percent: (item.value / totalFootprint) * 100,
}));

const totalPremiumUsers = users.filter(u => u.premium).length;


const filteredPremium = payments.filter(p =>
  p.email.toLowerCase().includes(searchPremium.toLowerCase())
);

const filteredDonations = donationPayments.filter(p =>
  p.email.toLowerCase().includes(searchDonations.toLowerCase())
);

const filteredConsultations = consultationPayments.filter(p =>
  p.professional.toLowerCase().includes(searchConsultations.toLowerCase())
);

const starredProfessional = professionals.find(p => p.isStarred);



function NeoCard({ title, value, suffix = "" }) {
  return (
    <div className="p-5 rounded-3xl
                 bg-[var(--card)]
                 border border-[var(--border)]
                 shadow-[var(--card-shadow)]
                 transition-colors duration-300">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-bold">
        {value}{suffix}
      </div>
    </div>
  );
}

  return (
    
   <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300 font-sans">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-card border-r border-border p-4 transition-all duration-300 ease-in-out flex flex-col shadow-sm h-screen sticky top-0`}>
  
  {/* TOP: Admin Identity Section */}
  <div className="flex flex-col mb-8">
    {/* Header Row: Title & Toggle */}
    <div className={`flex items-center mb-4 ${sidebarOpen ? "justify-between px-1" : "justify-center"}`}>
      {sidebarOpen && (
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">
          Admin Portal
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
      
      {/* Avatar Square (Using your Primary Green Gradient) */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold shadow-lg shadow-primary/20">
        A
      </div>

      {sidebarOpen ? (
        <div className="overflow-hidden">
          <div className="text-sm font-black truncate text-foreground leading-none mb-1">
            System Admin
          </div>
          <div className="text-[10px] text-primary truncate font-bold uppercase tracking-tighter flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-primary animate-pulse"></span>
            Superuser
          </div>
        </div>
      ) : (
        /* Collapsed Indicator */
        <div className="flex flex-col items-center mt-1 overflow-hidden w-full">
          <span className="text-[9px] font-black text-primary uppercase tracking-tighter truncate w-full text-center">
            Admin
          </span>
          <div className="w-1 h-1 bg-primary rounded-full mt-1 shadow-[0_0_3px_var(--primary)]"></div>
        </div>
      )}
    </div>
  </div>

  {/* NAVIGATION SECTION */}
  {sidebarOpen && (
    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 mb-3 px-1">
      Management
    </div>
  )}
  <nav className="flex flex-col gap-1.5 flex-1">
    {[
      { id: "dashboard", label: "Global Stats", emoji: "📊" },
      { id: "users", label: "Users", emoji: "👥" },
      { id: "professionals", label: "Consultants", emoji: "🧑‍💼" },
      { id: "payments", label: "Financial Overview", emoji: "💳" },
    ].map((m) => (
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
</aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        {/* Dashboard Stats */}
  {section === "dashboard" && (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <div className="mb-8">
        <h3 className="text-3xl font-black tracking-tight text-foreground">Global Stats</h3>
        <p className="text-sm text-foreground/50 font-medium">Real-time platform overview and environmental impact.</p>
      </div>

      {/* STATS GRID */}
      <section className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10 bg-card/50 p-6 rounded-[2.5rem] border border-border/60 backdrop-blur-sm shadow-sm">
        <NeoCard title="Total Users" value={users.length} />
        <NeoCard title="Premium Users" value={totalPremiumUsers} />
        <NeoCard title="Approved Professionals" value={professionals.filter(p => p.approvalStatus === "approved").length}/>
        <NeoCard title="Pending Professionals" value={professionals.filter(p => p.approvalStatus === "pending").length}/>
        <NeoCard title="Total CO₂" value={totals.total.toFixed(2)} suffix=" kg" />
      </section>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* PIE CHART CARD */}
        <div className="p-6 bg-card rounded-[2.5rem] border border-border shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 px-2">
            <h4 className="font-black text-lg text-foreground/80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              Category Breakdown
            </h4>
          </div>
          
          <div className="w-full flex justify-center py-4 bg-background/40 rounded-3xl border border-border/40">
            <PieChart width={400} height={340}>
              <Pie
                data={piePercentData}
                dataKey="percent"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70} // Changed to donut for modern look
                outerRadius={100}
                paddingAngle={5}
                label={({ name, percent }) => `${name} ${percent.toFixed(1)}%`}
                isAnimationActive={true}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </div>

          {/* GRID OF SMALL DATA CARDS */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            {piePercentData.map((c, idx) => (
              <div
                key={idx}
                className="p-4 bg-background/50 rounded-2xl border border-border shadow-inner group hover:border-primary/30 transition-colors"
              >
                <div className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1 group-hover:text-primary transition-colors">
                  {c.name}
                </div>
                <div className="text-xl font-black text-foreground">
                  {c.percent.toFixed(1)}%
                </div>
                <div className="text-[11px] font-bold text-primary/70 mt-1">
                  {c.value.toFixed(2)} kg CO₂
                </div>
              </div>
            ))}
          </div>
        </div>

  {/* LINE CHART CARD */}
  <div className="p-6 bg-card rounded-[2.5rem] border border-border shadow-sm flex flex-col"> 
    <div className="flex items-center justify-between mb-6 px-2">
      <h4 className="font-black text-lg text-foreground/80 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
        CO₂ Trends (7 Days)
      </h4>
      <div className="text-[10px] font-black uppercase tracking-widest text-foreground/30 bg-foreground/5 px-3 py-1 rounded-full">
        Live Data
      </div>
    </div>
    
    <div className="w-full overflow-hidden" style={{ height: '350px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={weeklyCategoryTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: 'var(--foreground)', opacity: 0.6, fontWeight: 600}} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: 'var(--foreground)', opacity: 0.6}} />
          <Tooltip 
            cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
            contentStyle={{ borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} 
          />
          <Line type="monotone" dataKey="travel" stroke="#34d399" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
          <Line type="monotone" dataKey="food" stroke="#60a5fa" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
          <Line type="monotone" dataKey="electricity" stroke="#fbbf24" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
          <Line type="monotone" dataKey="water" stroke="#06B6D4" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
          <Line type="monotone" dataKey="shopping" stroke="#a78bfa" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
          <Line type="monotone" dataKey="gas" stroke="#FF4500" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* Legend Footer */}
    <div className="flex flex-wrap gap-4 mt-6 px-2">
      {[
        { label: 'Travel', color: '#34d399' },
        { label: 'Food', color: '#60a5fa' },
        { label: 'Electricity', color: '#fbbf24' },
        { label: 'Water', color: '#06B6D4' },
        { label: 'Shop', color: '#a78bfa' },
        { label: 'Gas', color: '#FF4500' },
      ].map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className="w-2.5 h-1 rounded-full" style={{ backgroundColor: item.color }}></div>
          <span className="text-[10px] font-bold uppercase text-foreground/40">{item.label}</span>
        </div>
      ))}
    </div>

    {/* EXPERT ADVICE (Now correctly inside the Line Chart Card, below the chart/legend) */}
    {weeklyAdvice && (
      <div className="mt-8 p-5 bg-primary/5 rounded-[2rem] border border-primary/20 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
        <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-primary mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          Featured Expert Advice
        </h4>
        <p className="text-sm font-medium text-foreground/80 leading-relaxed italic relative z-10">
          "{weeklyAdvice.adviceText}"
        </p>
        <div className="text-[11px] font-black text-primary mt-3 uppercase tracking-tighter relative z-10">
          — {weeklyAdvice.professional?.name}
        </div>
      </div>
    )}
  </div> 
</div>
    </section>
  )}

        
        {/* USERS SECTION */}
{section === "users" && (
  <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* Page Header */}
    <div className="mb-6 px-1">
      <h3 className="text-3xl font-black tracking-tight text-foreground">User Management</h3>
      <p className="text-sm text-foreground/50 font-medium">Monitor user activity and manage platform access.</p>
    </div>

    {/* Table Card */}
    <div className="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
      
      {/* Integrated Search Bar Row */}
      <div className="p-4 border-b border-border bg-foreground/[0.01] flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-80">
          <SearchInput
            value={searchPremium}
            onChange={setSearchPremium}
            placeholder="Search name or email..."
            // Applying the green-themed compact style
            className="w-full bg-background/50 border-border rounded-xl text-sm focus:border-primary/50"
          />
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-foreground/30 px-4">
          {users.length} Total Users Found
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-foreground/[0.02] border-b border-border">
              <th className="p-5 text-[10px] font-black uppercase tracking-widest text-foreground/40">Name</th>
              <th className="p-5 text-[10px] font-black uppercase tracking-widest text-foreground/40">Email</th>
              <th className="p-5 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-center">Premium</th>
              <th className="p-5 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-center">Total CO₂</th>
              <th className="p-5 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {users
              .filter(u =>
                u.name.toLowerCase().includes(searchPremium.toLowerCase()) ||
                u.email.toLowerCase().includes(searchPremium.toLowerCase())
              )
              .map(u => {
                const userLogs = footprintLogs.filter(
                  f => f.firebaseUID === u.firebaseUID
                );

                const userTotal = userLogs.reduce(
                  (sum, log) => sum + (log.totals?.total || 0),
                  0
                );

                return (
                  <tr key={u._id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {u.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {u.name || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="p-5 text-sm text-foreground/60 font-medium">
                      {u.email}
                    </td>
                    <td className="p-5 text-center">
                      {u.premium ? (
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-tighter border border-amber-500/20">
                          Premium
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-foreground/5 text-foreground/40 text-[10px] font-black uppercase tracking-tighter border border-border">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      <div className="text-sm font-black text-foreground">
                        {userTotal.toFixed(2)}
                        <span className="text-[10px] text-foreground/40 ml-1 uppercase">kg</span>
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <button
                        onClick={async () => {
                          await adminApi.post("/admin/block-user", {
                            userId: u._id,
                            block: !u.isBlocked,
                            reason: u.isBlocked ? "" : "Misbehavior with consultant",
                          });
                          const refreshed = await adminApi.get("/admin/users");
                          setUsers(
                            (refreshed.data || []).map(user => ({
                              _id: user._id,
                              firebaseUID: user.firebaseUID,
                              name: user.name || "-",
                              email: user.email || "-",
                              premium: Boolean(user.premium),
                              isBlocked: Boolean(user.isBlocked || user.blockedAt),
                              blockedReason: user.blockedReason || "",
                            }))
                          );
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${
                          u.isBlocked
                            ? "bg-green-600 text-white shadow-green-600/20 hover:bg-green-700"
                            : "bg-red-600 text-white shadow-red-600/20 hover:bg-red-700"
                        }`}
                      >
                        {u.isBlocked ? "Unblock User" : "Block User"}
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  </section>
)}

        {/* PROFESSIONALS SECTION */}
{section === "professionals" && (
  <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* Page Header */}
    <div className="mb-6 px-1">
      <h3 className="text-3xl font-black tracking-tight text-foreground">Consultants Approvals</h3>
      <p className="text-sm text-foreground/50 font-medium">Verify credentials and manage platform experts.</p>
    </div>

    {/* Integrated Search Card */}
    <div className="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden mb-8">
      <div className="p-4 bg-foreground/[0.01] flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-96">
          <SearchInput
            value={searchConsultations}
            onChange={setSearchConsultations}
            placeholder="Search professionals by name or email..."
            className="w-full bg-background/50 border-border rounded-xl text-sm"
          />
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-foreground/30 px-4">
          {professionals.length} Experts Registered
        </div>
      </div>
    </div>

    {/* Professionals List */}
    <div className="space-y-6">
      {professionals
        .filter(p =>
          p.name.toLowerCase().includes(searchConsultations.toLowerCase()) ||
          p.email.toLowerCase().includes(searchConsultations.toLowerCase())
        )
        .map(p => (
          <div
            key={p._id}
            className="p-6 rounded-[2rem] bg-card border border-border shadow-sm hover:border-primary/30 transition-all group"
          >
            {/* Main Info Grid - Now with Status Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Column 1: Identity (Span 4) */}
              <div className="lg:col-span-4 flex gap-4 items-center">
                {p.documents.length > 0 && (
                  <button
                    onClick={() => toggleDocs(p._id)}
                    className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors text-xs shrink-0"
                  >
                    {openDocs[p._id] ? "▼" : "▶"}
                  </button>
                )}
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-lg text-foreground truncate">{p.name}</h4>
                    {p.isStarred && <span className="text-yellow-500">⭐</span>}
                  </div>
                  <p className="text-xs text-foreground/50 truncate font-medium">{p.email}</p>
                </div>
              </div>

              {/* Column 2: Details (Span 3) */}
              <div className="lg:col-span-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1">Consultation</div>
                <div className="text-sm font-bold text-primary">₹{p.consultationFee} / session</div>
              </div>

              {/* Column 3: STATUS COLUMN (Span 2) */}
              <div className="lg:col-span-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1">Status</div>
                {p.approvalStatus === "approved" && (
                  <span className="text-green-500 font-black text-[10px] uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Approved
                  </span>
                )}
                {p.approvalStatus === "rejected" && (
                  <span className="text-red-500 font-black text-[10px] uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Rejected
                  </span>
                )}
                {p.approvalStatus === "pending" && (
                  <span className="text-amber-500 font-black text-[10px] uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pending
                  </span>
                )}
              </div>

              {/* Column 4: ORIGINAL BUTTONS (Span 3) */}
              <div className="lg:col-span-3 flex gap-2 flex-wrap justify-end">
                {p.approvalStatus === "pending" && (
                  <>
                    <button className="bg-green-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-colors" onClick={() => approveProfessional(p._id)}>
                      Approve
                    </button>
                    <button className="bg-red-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors" onClick={() => rejectProfessional(p._id)}>
                      Reject
                    </button>
                  </>
                )}
                {p.approvalStatus === "approved" && (
                  <button className="bg-red-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors" onClick={() => rejectProfessional(p._id)}>
                    Revoke
                  </button>
                )}
                {p.approvalStatus === "rejected" && (
                  <button className="bg-green-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-colors" onClick={() => approveProfessional(p._id)}>
                    Approve
                  </button>
                )}
                <button
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    p.isStarred ? "bg-foreground/10 text-foreground/40 cursor-not-allowed" : "bg-primary text-white hover:scale-105"
                  }`}
                  onClick={() => !p.isStarred && handleRequest(p._id)}
                >
                  {p.isStarred ? "Assigned ⭐" : "Request Advice"}
                </button>
              </div>
            </div>

            {/* Documents Sub-Table */}
            {openDocs[p._id] && p.documents.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-background/50 rounded-2xl border border-border overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-foreground/[0.03] border-b border-border">
                      <tr>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-foreground/40">File</th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-foreground/40">Type</th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-foreground/40">Date</th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-foreground/40">Status</th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-foreground/40 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {p.documents.map(d => (
                        <tr key={d._id} className="hover:bg-foreground/[0.02] transition-colors">
                          <td className="p-4">
                            <a href={`http://localhost:5000${d.url}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary hover:underline">
                              {d.filename}
                            </a>
                          </td>
                          <td className="p-4 text-[10px] font-black text-foreground/40 uppercase">{d.type}</td>
                          <td className="p-4 text-[10px] font-medium text-foreground/60">{new Date(d.uploadedAt).toLocaleDateString()}</td>
                          <td className="p-4 text-[10px] font-bold text-foreground/60 uppercase">{d.approvalStatus || "pending"}</td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button className="bg-green-500 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase disabled:opacity-30" disabled={d.approvalStatus === "approved"} onClick={() => approveDocument(d._id, true)}>
                              Approve
                            </button>
                            <button className="bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase disabled:opacity-30" disabled={d.approvalStatus === "rejected"} onClick={() => rejectDocument(d._id)}>
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  </section>
)}

        {/* PAYMENTS SECTION */}
{section === "payments" && (
  <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* Page Header */}
    <div className="mb-8 px-1">
      <h3 className="text-3xl font-black tracking-tight text-foreground">Financial Overview</h3>
      <p className="text-sm text-foreground/50 font-medium">Track revenue streams and platform commissions.</p>
    </div>

    {/* Summary Cards Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <div className="p-6 bg-card rounded-[2rem] border border-border shadow-sm group hover:border-primary/30 transition-all">
        <div className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-2">Total Premium</div>
        <div className="text-2xl font-black text-foreground group-hover:text-primary transition-colors">₹{paymentSummary.totalPremium}</div>
      </div>
      <div className="p-6 bg-card rounded-[2rem] border border-border shadow-sm group hover:border-primary/30 transition-all">
        <div className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-2">Total Donations</div>
        <div className="text-2xl font-black text-foreground group-hover:text-primary transition-colors">₹{paymentSummary.totalDonations}</div>
      </div>
      <div className="p-6 bg-card rounded-[2rem] border border-border shadow-sm group hover:border-primary/30 transition-all">
        <div className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-2">Total Consultations</div>
        <div className="text-2xl font-black text-foreground group-hover:text-primary transition-colors">₹{paymentSummary.totalConsultations}</div>
      </div>
      <div className="p-6 bg-primary/10 rounded-[2rem] border border-primary/20 shadow-sm group">
        <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Total Balance</div>
        <div className="text-2xl font-black text-primary">₹{paymentSummary.totalBalance}</div>
      </div>
    </div>

    <div className="space-y-6">
      {/* 🔽 Premium Payments */}
      <AnimatedDropdown
        title={`Premium Upgrades (${filteredPremium.length})`}
        isOpen={openPayment === "premium"}
        onClick={() => setOpenPayment(openPayment === "premium" ? "" : "premium")}
      >
        <div className="p-4 pt-0">
          <SearchInput
            value={searchPremium}
            onChange={setSearchPremium}
            placeholder="Search by user email..."
            className="mb-4 bg-background/50 border-border rounded-xl"
          />
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left border-collapse bg-background/30">
              <thead>
                <tr className="bg-foreground/[0.03] border-b border-border">
                  <th className="p-4 text-[10px] font-black uppercase text-foreground/40">User</th>
                  <th className="p-4 text-[10px] font-black uppercase text-foreground/40 text-center">Purpose</th>
                  <th className="p-4 text-[10px] font-black uppercase text-foreground/40 text-center">Amount</th>
                  <th className="p-4 text-[10px] font-black uppercase text-foreground/40 text-center">Date</th>
                  <th className="p-4 text-[10px] font-black uppercase text-foreground/40 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredPremium.map(p => (
                  <tr key={p._id} className="hover:bg-foreground/[0.02] transition-colors">
                    <td className="p-4 text-sm font-bold text-foreground">{p.email}</td>
                    <td className="p-4 text-center text-[10px] font-black text-foreground/40 uppercase">{p.purpose}</td>
                    <td className="p-4 text-center font-black text-foreground">₹{p.amount}</td>
                    <td className="p-4 text-center text-xs text-foreground/50">{p.createdAt.toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <span className="px-2 py-1 rounded-md text-[9px] font-black bg-green-500/10 text-green-500 border border-green-500/20">SUCCESS</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedDropdown>

      {/* 🔽 Donation Payments */}
      <AnimatedDropdown
        title={`Donations (${filteredDonations.length})`}
        isOpen={openPayment === "donations"}
        onClick={() => setOpenPayment(openPayment === "donations" ? "" : "donations")}
      >
        <div className="p-4 pt-0">
          <SearchInput
            value={searchDonations}
            onChange={setSearchDonations}
            placeholder="Search by user email..."
            className="mb-4 bg-background/50 border-border rounded-xl"
          />
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left border-collapse bg-background/30">
              <thead>
                <tr className="bg-foreground/[0.03] border-b border-border">
                  <th className="p-4 text-[10px] font-black uppercase text-foreground/40">User</th>
                  <th className="p-4 text-[10px] font-black uppercase text-foreground/40 text-center">Purpose</th>
                  <th className="p-4 text-[10px] font-black uppercase text-foreground/40 text-center">Amount</th>
                  <th className="p-4 text-[10px] font-black uppercase text-foreground/40 text-center">Date</th>
                  <th className="p-4 text-[10px] font-black uppercase text-foreground/40 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredDonations.map(p => (
                  <tr key={p._id} className="hover:bg-foreground/[0.02] transition-colors">
                    <td className="p-4 text-sm font-bold text-foreground">{p.email}</td>
                    <td className="p-4 text-center text-[10px] font-black text-foreground/40 uppercase">{p.purpose}</td>
                    <td className="p-4 text-center font-black text-foreground">₹{p.amount}</td>
                    <td className="p-4 text-center text-xs text-foreground/50">{p.createdAt.toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <span className="px-2 py-1 rounded-md text-[9px] font-black bg-green-500/10 text-green-500 border border-green-500/20">SUCCESS</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedDropdown>

      {/* 🔽 Consultation Payments */}
      <AnimatedDropdown
        title={`Consultations (${filteredConsultations.length})`}
        isOpen={openPayment === "consultations"}
        onClick={() => setOpenPayment(openPayment === "consultations" ? "" : "consultations")}
      >
        <div className="p-4 pt-0">
          <SearchInput
            value={searchConsultations}
            onChange={setSearchConsultations}
            placeholder="Search by professional name..."
            className="mb-4 bg-background/50 border-border rounded-xl"
          />
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left border-collapse bg-background/30">
              <thead>
                <tr className="bg-foreground/[0.03] border-b border-border">
                  <th className="p-4 text-[10px] font-black uppercase text-foreground/40">Professional</th>
                  <th className="p-4 text-[10px] font-black uppercase text-foreground/40 text-center">Professional (90%)</th>
                  <th className="p-4 text-[10px] font-black uppercase text-foreground/40 text-center">Admin (10%)</th>
                  <th className="p-4 text-[10px] font-black uppercase text-foreground/40 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredConsultations.map(p => (
                  <tr key={p._id} className="hover:bg-foreground/[0.02] transition-colors">
                    <td className="p-4 text-sm font-bold text-foreground">{p.professional}</td>
                    <td className="p-4 text-center font-black text-foreground/60">₹{p.professionalAmount}</td>
                    <td className="p-4 text-center font-black text-primary">₹{p.adminAmount}</td>
                    <td className="p-4 text-right text-xs text-foreground/50">{new Date(p.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedDropdown>
    </div>
  </section>
)}

      </main>
    </div>
    
  );
}
