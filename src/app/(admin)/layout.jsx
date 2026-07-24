"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar, { navigation } from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const token = useAuthStore((state) => state.token);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const hydrate = useAuthStore((state) => state.hydrate);

  // Hydrate auth state on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Route guard redirect
  useEffect(() => {
    if (isHydrated && !token) {
      router.replace("/login");
    }
  }, [isHydrated, token, router]);

  // Extract all navigation items into a single flat array
  const allItems = navigation.flatMap((group) => group.items);

  // Show premium loading state during authentication check
  if (!isHydrated || (isHydrated && !token)) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-page-bg space-y-3 font-onest">
        <Loader2 size={32} className="animate-spin text-primary-bg" />
        <span className="text-xs text-text-muted font-medium">Verifying credentials...</span>
      </div>
    );
  }
  
  // Find active item matching current pathname (or prefix match for child routes)
  const activeItem =
    allItems.find((item) => item.href === pathname) ||
    allItems.find((item) => pathname.startsWith(item.href) && item.href !== "/");

  let activeTitle = activeItem ? activeItem.name : "Dashboard";
  let activeSubtitle = activeItem ? activeItem.description : "Operational overview and key platform metrics";

  // Dynamic child route titles (e.g. for /transactions/TXN001928 detail page)
  if (activeItem) {
    if (pathname.length > activeItem.href.length && activeItem.href !== "/") {
      const remainingPath = pathname.slice(activeItem.href.length).replace(/^\//, "");
      const segments = remainingPath.split("/").filter(Boolean);

      if (segments.length > 0) {
        const subSegment = segments[0];
        const isId = /[0-9]/.test(subSegment) || subSegment.toUpperCase() === subSegment || subSegment.length > 8;

        if (isId) {
          const parentName = activeItem.name;
          const singularParent = parentName.endsWith("s") ? parentName.slice(0, -1) : parentName;
          activeTitle = `${singularParent} Detail`;
          activeSubtitle = `Review timeline, transaction parameters, and administrative controls for this ${singularParent.toLowerCase()}`;
        } else {
          const formattedSub = subSegment
            .split(/[-_]/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          activeTitle = formattedSub;
          activeSubtitle = `View details and operational metrics for ${formattedSub.toLowerCase()}`;
        }
      }
    }
  } else {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      activeTitle = segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
      activeSubtitle = `Operational overview and key platform metrics for ${activeTitle.toLowerCase()}`;
    }
  }

  return (
    <div className="flex h-screen bg-page-bg overflow-hidden font-onest text-text-primary">
      {/* Sidebar component */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header component with dynamic props */}
        <Header setSidebarOpen={setSidebarOpen} title={activeTitle} subtitle={activeSubtitle} />

        {/* Content body wrapper */}
        <main className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-page-bg">
          {children}
        </main>
      </div>

      <ToastContainer position="top-right" autoClose={2000} hideProgressBar closeOnClick theme="light" />
    </div>
  );
}
