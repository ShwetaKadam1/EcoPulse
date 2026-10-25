"use client";

import "@/styles/globals.css";
import DashboardNavbar from "@/components/DashboardNavbar";
import { useState, useEffect } from "react";

export default function DashboardLayout({ children }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ecopulse-dark");
    if (saved === "1") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ecopulse-dark", next ? "1" : "0");
  };

  return (
    <div className="min-h-screen">
      <DashboardNavbar toggleDark={toggleDark} dark={dark} />
      {children}
    </div>
  );
}
