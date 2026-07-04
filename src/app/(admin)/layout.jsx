"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-page-bg overflow-hidden font-onest text-text-primary">
      {/* Sidebar component */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header component */}
        <Header setSidebarOpen={setSidebarOpen} />

        {/* Content body wrapper */}
        <main className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-page-bg">
          {children}
        </main>
      </div>

      <ToastContainer position="top-right" autoClose={2000} hideProgressBar closeOnClick theme="light" />
    </div>
  );
}
