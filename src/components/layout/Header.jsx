"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, User } from "lucide-react";
import { navigation } from "./Sidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";

export default function Header({ setSidebarOpen, title: propTitle, subtitle: propSubtitle }) {
  const pathname = usePathname();
  
  const authRole = useAuthStore((state) => state.role);
  const [adminName, setAdminName] = useState("Sophia");

  useEffect(() => {
    const storedProfile = localStorage.getItem("netly_admin_profile");
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        if (parsed.firstName) {
          setAdminName(parsed.firstName);
        }
      } catch (e) {}
    }
  }, []);

  // Extract all navigation items into a single flat array
  const allItems = navigation.flatMap((group) => group.items);

  // Find active item matching current pathname (or prefix match for child routes)
  const activeItem =
    allItems.find((item) => item.href === pathname) ||
    allItems.find((item) => pathname.startsWith(item.href) && item.href !== "/");

  let resolvedTitle = propTitle || (activeItem ? activeItem.name : "Dashboard");
  let resolvedSubtitle = propSubtitle || (activeItem ? activeItem.description : "Operational overview and key platform metrics");

  // Dynamic fallback calculation if props are not supplied directly
  if (!propTitle && !propSubtitle) {
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
            resolvedTitle = `${singularParent} Detail`;
            resolvedSubtitle = `Review timeline, transaction parameters, and administrative controls for this ${singularParent.toLowerCase()}`;
          } else {
            const formattedSub = subSegment
              .split(/[-_]/)
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
            resolvedTitle = formattedSub;
            resolvedSubtitle = `View details and operational metrics for ${formattedSub.toLowerCase()}`;
          }
        }
      }
    } else {
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length > 0) {
        resolvedTitle = segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
        resolvedSubtitle = `Operational overview and key platform metrics for ${resolvedTitle.toLowerCase()}`;
      }
    }
  }

  return (
    <header className="flex h-16 items-center justify-between lg:px-4 px-4 bg-white border-b border-border-main">
      {/* Breadcrumbs / Page title info */}
      <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-xl text-text-primary hover:bg-secondary-bg transition shrink-0"
        >
          <Menu size={24} />
        </button>
        <div className="truncate">
          <h1 className="text-base sm:text-xl font-bold text-text-primary truncate">{resolvedTitle}</h1>
          <p className="sm:text-xs text-[10px] text-text-muted truncate">{resolvedSubtitle}</p>
        </div>
      </div>

      {/* Right Header actions */}
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">

        {/* Notification Bell */}
        <button className="relative p-2.5 sm:p-3 rounded-xl border border-border-main text-text-primary bg-primary-bg/10 hover:bg-secondary-bg transition shrink-0">
          <Bell size={18} />
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-bg"></span>
          </span>
        </button>

        <div className="w-px h-10 bg-black/10 shrink-0"></div>

        {/* Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-3 py-1.5 pl-2 pr-2 sm:pr-4 rounded-xl border border-primary-bg/40 bg-page-bg shrink-0">
          {/* Avatar Icon Wrapper */}
          <div className="flex p-1 items-center justify-center rounded-lg border border-primary-bg/50 bg-primary-bg/10 text-primary-bg shrink-0">
            <User size={18} fill="var(--color-primary-bg)" />
          </div>
          {/* User details text */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-sm font-medium text-text-primary leading-tight">{adminName}</span>
            <span className="text-xs text-text-muted font-light leading-none">{authRole || "Admin"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
