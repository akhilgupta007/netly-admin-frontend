"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LogoutModal from "./LogoutModal";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Users,
  ShieldCheck,
  AlertOctagon,
  FileCheck,
  Percent,
  TrendingUp,
  FileText,
  UserPlus,
  Network,
  Compass,
  Settings,
  LogOut,
  X
} from "lucide-react";

export const navigation = [
  {
    label: "",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Operational overview and key platform metrics" },
      { name: "Transactions", href: "/transactions", icon: ArrowLeftRight, description: "Overview across client and provider" },
      { name: "Wallets & Refunds", href: "/wallets", icon: Wallet, description: "Client wallet balances and fund movements" },
      { name: "Accounts", href: "/accounts", icon: Users, description: "Client and provider account management" },
    ]
  },
  {
    label: "Compliance",
    items: [
      { name: "KYC/ Identity Verification", href: "/compliance/kyc", icon: ShieldCheck, description: "Identity audits and credential updates" },
      { name: "Disputes", href: "/compliance/disputes", icon: AlertOctagon, description: "Review and resolve user conflict claims" },
      { name: "Compliance & Audit Logs", href: "/compliance/logs", icon: FileCheck, description: "Audit history and platform access logs" },
    ]
  },
  {
    label: "Finance",
    items: [
      { name: "Commission & Payouts", href: "/finance/commissions", icon: Percent, description: "Track and authorize provider payout transfers" },
      { name: "Reports", href: "/finance/reports", icon: TrendingUp, description: "Generate and schedule financial exports" },
    ]
  },
  {
    label: "Platform",
    items: [
      { name: "Content Moderation", href: "/platform/moderation", icon: FileText, description: "Flagged profiles, listing approvals, and content audits" },
      { name: "Founding Partners", href: "/platform/founding-partners", icon: UserPlus, description: "Manage platform equity partner credentials" },
      { name: "Service Categories", href: "/platform/categories", icon: Network, description: "Manage service catalog definitions" },
      { name: "Market Intelligence", href: "/platform/market-intelligence", icon: Compass, description: "Geographic demand gaps and trending searches" },
      { name: "Admin Settings", href: "/platform/settings", icon: Settings, description: "Configure administrative controls and parameters" },
    ]
  }
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-alt-bg/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-66 flex-col border-r border-secondary-bg bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex h-16 items-center lg:justify-center justify-between px-6 border-b border-secondary-bg w-full">
          <Link href="/dashboard" className="gap-2">
            <Image
              src="/logo.png"
              alt="Netly Logo"
              width={70}
              height={14}
              className="object-contain"
              priority
            />
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 hover:bg-secondary-bg lg:hidden text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-2 overflow-y-auto p-4 scrollbar-thin">
          {navigation.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {group.label && (
                <h3 className=" text-sm">
                  {group.label}
                </h3>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 text-sm font-light rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-primary-bg text-white shadow-sm animate-fade-in"
                          : "text-text-muted hover:bg-secondary-bg hover:text-text-primary"
                      }`}
                    >
                      <item.icon 
                        size={18} 
                        className={isActive ? "text-white" : "text-text-muted"} 
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer / Log Out */}
        <div className="border-t border-secondary-bg p-4 bg-white">
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-muted rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 cursor-pointer"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Logout warning confirmation popup modal */}
      <LogoutModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          router.push("/login");
        }}
      />
    </>
  );
}
