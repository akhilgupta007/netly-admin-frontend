"use client";

import React, { useState, useEffect } from "react";
import { Edit2, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import ChangePasswordModal from "@/components/platform/ChangePasswordModal";

export default function ProfileSettingsTab() {
  // Profile settings state
  const [firstName, setFirstName] = useState("Sophia");
  const [lastName, setLastName] = useState("Patel");
  const [email, setEmail] = useState("sophia@netly.com");
  const [phone, setPhone] = useState("+44 7700 000000");

  // Security config state
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [force2FA, setForce2FA] = useState(true);

  // Modal states
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Load configs from localStorage
  useEffect(() => {
    const storedProfile = localStorage.getItem("netly_admin_profile");
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        setFirstName(parsed.firstName || "Sophia");
        setLastName(parsed.lastName || "Patel");
        setEmail(parsed.email || "sophia@netly.com");
        setPhone(parsed.phone || "+44 7700 000000");
      } catch (e) { }
    }

    const storedSecurity = localStorage.getItem("netly_platform_security");
    if (storedSecurity) {
      try {
        const parsed = JSON.parse(storedSecurity);
        setSessionTimeout(parsed.sessionTimeout || 30);
        setForce2FA(parsed.force2FA !== undefined ? parsed.force2FA : true);
      } catch (e) { }
    }
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and Last name are required.");
      return;
    }
    const profile = { firstName, lastName, email, phone };
    localStorage.setItem("netly_admin_profile", JSON.stringify(profile));
    toast.success("Profile changes saved successfully!");
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    const timeout = parseInt(sessionTimeout);
    if (isNaN(timeout) || timeout < 5 || timeout > 120) {
      toast.error("Session timeout must be a valid number between 5 and 120 minutes.");
      return;
    }

    const security = { sessionTimeout: timeout, force2FA };
    localStorage.setItem("netly_platform_security", JSON.stringify(security));
    toast.success("Security configuration updated successfully!");
  };

  const handleUpdatePassword = (current, newPass) => {
    setPasswordModalOpen(false);
    toast.success("Password updated successfully!");
  };

  return (
    <div className="space-y-4 animate-scale-up text-xs text-text-primary font-onest">

      {/* Profile Settings Card */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-border-main hover:shadow-xs p-4 space-y-4 relative">
        <h3 className="text-sm font-semibold text-text-primary">Profile Settings</h3>

        {/* Avatar block */}
        <div className="relative w-14 h-14 text-white rounded-full flex items-center justify-center font-medium text-lg bg-primary-bg-muted select-none hover:opacity-95 cursor-pointer">
          {firstName.charAt(0)}{lastName.charAt(0)}
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white border border-border-main rounded-full flex items-center justify-center text-text-muted hover:text-text-primary transition shadow-2xs">
            <Edit2 size={9} />
          </div>
        </div>

        {/* Inputs layout */}
        <div className="space-y-4 max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-muted block">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted block">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted block">Job Title</label>
            <input
              type="text"
              disabled
              value="Super Admin"
              className="w-full bg-page-bg border border-border-main text-xs rounded-xl p-3 focus:outline-none text-text-muted cursor-not-allowed font-light"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-muted block">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted block">Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary font-light"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted block">Password</label>
            <input
              type="password"
              disabled
              value="............"
              className="w-full bg-page-bg border border-border-main text-xs rounded-xl p-3 focus:outline-none text-text-muted cursor-not-allowed font-light tracking-widest"
            />
            <button
              type="button"
              onClick={() => setPasswordModalOpen(true)}
              className="text-primary-bg hover:underline cursor-pointer text-[10px] block mt-1.5"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Submit action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-primary-bg hover:bg-primary-bg-muted text-white font-semibold text-xs py-3 px-5 rounded-lg transition cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Security configuration card */}
      <form onSubmit={handleSaveSecurity} className="bg-white rounded-3xl border border-border-main hover:shadow-xs p-4 space-y-5 relative">
        <h3 className="text-sm font-semibold text-text-primary">Security configuration</h3>

        {/* Session Timeout */}
        <div className="space-y-1.5 p-3 border border-border-main rounded-xl w-full">
          <label className="text-xs text-text-primary block">Session timeout (minutes)</label>
          <div className="flex items-center">
            <input
              type="number"
              min="5"
              max="120"
              required
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              className="w-20 bg-white border border-border-main text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary text-center mr-2 font-semibold"
            />
            <span className="text-text-muted font-light text-xs">minutes</span>
          </div>
          <span className="text-[10px] text-text-muted block mt-0.5">
            Range: 5-120 minutes. Users are logged out after inactivity.
          </span>
        </div>

        {/* 2FA switch toggle */}
        <div className="flex items-center justify-between p-3 border border-border-main rounded-xl w-full gap-4">
          <div className="space-y-0.5">
            <div className="text-xs text-text-primary block">Force 2FA for all admin users</div>
            <span className="text-[10px] mt-2 text-text-muted font-light block">
              Enabled by default. Cannot be disabled per platform security policy.
            </span>
          </div>
          <div className="flex items-center gap-2 select-none">
            <span className={`text-[10px] font-semibold transition ${force2FA ? "text-emerald-500" : "text-text-muted"}`}>
              {force2FA ? "Enforced" : "Disabled"}
            </span>
            <button
              type="button"
              onClick={() => setForce2FA(!force2FA)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${force2FA ? "bg-primary-bg" : "bg-secondary-bg"
                }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${force2FA ? "translate-x-4" : "translate-x-0"
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Warn banner block */}
        <div className="bg-amber-50/45 border border-amber-200/50 rounded-xl p-4 flex items-start gap-2.5 w-full text-[10px] text-amber-800 font-light">
          <AlertCircle size={15} className="text-amber-600/80 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            All admin actions are logged to audit_logs. IP addresses are captured per session. Logs are immutable.
          </p>
        </div>

        {/* Submit action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-primary-bg hover:bg-primary-bg-muted text-white font-semibold text-xs py-3 px-5 rounded-lg transition cursor-pointer"
          >
            Save Settings
          </button>
        </div>
      </form>

      {/* Change password modal overlay */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onUpdate={handleUpdatePassword}
      />

    </div>
  );
}
