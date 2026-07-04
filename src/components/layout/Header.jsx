"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, User } from "lucide-react";
import { navigation } from "./Sidebar";

export default function Header({ setSidebarOpen }) {
  const pathname = usePathname();

  // Extract all navigation items into a single flat array
  const allItems = navigation.flatMap((group) => group.items);
  
  // Find active item matching current pathname (or prefix match for child routes)
  const activeItem =
    allItems.find((item) => item.href === pathname) ||
    allItems.find((item) => pathname.startsWith(item.href) && item.href !== "/");

  const title = activeItem ? activeItem.name : "Dashboard";
  const subtitle = activeItem ? activeItem.description : "Operational overview and key platform metrics";

  return (
    <header className="flex h-16 items-center justify-between lg:px-4 px-8 bg-white border-b border-secondary-bg">
      {/* Breadcrumbs / Page title info */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-xl text-text-primary hover:bg-secondary-bg transition"
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">{title}</h1>
          <p className="text-xs text-text-muted">{subtitle}</p>
        </div>
      </div>

      {/* Right Header actions */}
      <div className="flex items-center gap-6">

        {/* Notification Bell */}
        <button className="relative p-3 rounded-xl border border-secondary-bg text-text-primary bg-primary-bg/10 hover:bg-secondary-bg transition">
          <Bell size={18} />
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-bg"></span>
          </span>
        </button>

        <div className="w-px h-10 bg-black/10"></div>

        {/* Profile Menu */}
        <div className="flex items-center gap-3 py-1.5 pl-2 pr-4 rounded-xl border border-primary-bg/40 bg-page-bg">
          {/* Avatar Icon Wrapper */}
          <div className="flex p-1 items-center justify-center rounded-lg border border-primary-bg/50 bg-primary-bg/10 text-primary-bg">
            <User size={18} fill="var(--color-primary-bg)" />
          </div>
          {/* User details text */}
          <div className="flex flex-col text-left">
            <span className="text-sm font-medium text-text-primary leading-tight">Sophia</span>
            <span className="text-xs text-text-muted font-light leading-none">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
