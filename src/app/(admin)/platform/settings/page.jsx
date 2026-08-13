"use client";

import React, { useState } from "react";
import AdminUsersTab from "@/components/platform/AdminUsersTab";
import ProfileSettingsTab from "@/components/platform/ProfileSettingsTab";
import { useAuthStore } from "@/store/useAuthStore";
import { canManageAdmins } from "@/lib/adminRoles";

export default function AdminSettingsPage() {
  const role = useAuthStore((state) => state.role);
  // Inviting an admin, changing a role and revoking access are all
  // super-admin-only on the backend, so for everybody else the whole tab is a
  // list of buttons that return permission-denied. They get their own profile.
  const isSuperAdmin = canManageAdmins(role);

  const tabs = isSuperAdmin ? ["Admin Users", "Settings"] : ["Settings"];
  const [activeTab, setActiveTab] = useState(tabs[0]);

  // A role change while the page is open must not leave a non-super-admin
  // looking at the admin list.
  const currentTab = tabs.includes(activeTab) ? activeTab : tabs[0];

  return (
    <div className="space-y-4 font-onest">

      {/* Dynamic Tab Navigation headers matching Accounts/Wallets/Compliance styling */}
      <div className="flex border-b border-border-main text-xs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 -mb-px font-semibold transition hover:text-primary-bg cursor-pointer ${currentTab === tab
                ? "border-b-2 border-text-primary text-text-primary font-bold"
                : "text-text-muted"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* RENDER CURRENT ACTIVE TAB COMPONENT */}
      <div>
        {currentTab === "Admin Users" && isSuperAdmin && <AdminUsersTab />}
        {currentTab === "Settings" && <ProfileSettingsTab />}
      </div>
    </div>
  );
}
