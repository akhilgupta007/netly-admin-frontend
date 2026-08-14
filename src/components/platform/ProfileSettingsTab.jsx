"use client";

import React, { useState, useEffect, useRef } from "react";
import { Edit2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ChangePasswordModal from "@/components/platform/ChangePasswordModal";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { updateAdminProfile, adminChangePassword } from "@/lib/callables";
import { ADMIN_ROLE_LABELS, canManageAdmins } from "@/lib/adminRoles";
import { readImageForUpload, AVATAR_MAX_EDGE } from "@/lib/imageFile";
import { useAuthStore } from "@/store/useAuthStore";

export default function ProfileSettingsTab() {
  const queryClient = useQueryClient();
  const { profile, isLoading } = useAdminProfile();
  const currentRole = useAuthStore((state) => state.role);
  const isSuperAdmin = canManageAdmins(currentRole);

  // Profile settings state — seeded from Firestore once the profile arrives.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Security config state
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [force2FA, setForce2FA] = useState(true);

  // Modal states
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Profile picture. Held until Save so a mis-picked file costs nothing, and
  // so the picture and the name are committed by one action rather than the
  // avatar quietly saving itself on click.
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  // Distinct from "no photo": the admin asked for the stored one to go.
  const [clearPhoto, setClearPhoto] = useState(false);
  const photoInputRef = useRef(null);

  // What the avatar shows right now — the staged file wins over the stored
  // one, and a pending removal shows initials.
  const shownPhoto =
    pendingPhoto?.dataUrl || (clearPhoto ? "" : profile?.photoUrl || "");

  const handlePickPhoto = async (e) => {
    const file = e.target.files?.[0];
    // Cleared immediately, or re-picking the same file fires no change event.
    e.target.value = "";
    if (!file) return;

    setIsReadingPhoto(true);
    try {
      setPendingPhoto(
        await readImageForUpload(file, { maxEdge: AVATAR_MAX_EDGE }),
      );
      setClearPhoto(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsReadingPhoto(false);
    }
  };

  /** Stages removal of the stored picture; applied on Save Changes. */
  const handleRemovePhoto = () => {
    setPendingPhoto(null);
    setClearPhoto(true);
  };

  // Seed the form from Firestore once the profile lands. Adjusting state during
  // render rather than in an effect avoids a cascading second render, and the
  // uid guard means a later refetch will not clobber in-progress edits.
  const [seededFor, setSeededFor] = useState(null);
  if (profile && seededFor !== profile.uid) {
    setSeededFor(profile.uid);
    setFirstName(profile.firstName || "");
    setLastName(profile.lastName || "");
    setEmail(profile.email || "");
    setPhone(profile.phoneNumber || "");
  }

  // Session timeout and 2FA are client-side platform preferences with no
  // backend behind them yet, so they stay in localStorage rather than
  // pretending to be persisted server-side.
  useEffect(() => {
    const storedSecurity = localStorage.getItem("netly_platform_security");
    if (storedSecurity) {
      try {
        const parsed = JSON.parse(storedSecurity);
        setSessionTimeout(parsed.sessionTimeout || 30);
        setForce2FA(parsed.force2FA !== undefined ? parsed.force2FA : true);
      } catch (e) {}
    }
  }, []);

  const saveProfile = useMutation({
    mutationFn: updateAdminProfile,
    onSuccess: () => {
      setPendingPhoto(null);
      setClearPhoto(false);
      queryClient.invalidateQueries({ queryKey: ["adminProfile"] });
      // The admin list shows the same name, so refresh it too.
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Profile changes saved successfully!");
    },
    onError: (err) => toast.error(err.message),
  });

  const changePassword = useMutation({
    mutationFn: adminChangePassword,
    onSuccess: () => {
      setPasswordModalOpen(false);
      toast.success("Password updated successfully!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and Last name are required.");
      return;
    }
    saveProfile.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phone.trim(),
      photoBase64: pendingPhoto?.dataUrl,
      photoContentType: pendingPhoto?.contentType,
      removePhoto: clearPhoto && !pendingPhoto,
    });
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    const timeout = parseInt(sessionTimeout);
    if (isNaN(timeout) || timeout < 5 || timeout > 120) {
      toast.error(
        "Session timeout must be a valid number between 5 and 120 minutes.",
      );
      return;
    }

    const security = { sessionTimeout: timeout, force2FA };
    localStorage.setItem("netly_platform_security", JSON.stringify(security));
    toast.success("Security configuration updated successfully!");
  };

  const handleUpdatePassword = (currentPassword, newPassword) => {
    changePassword.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="space-y-4 animate-scale-up text-xs text-text-primary font-onest">
      {/* Profile Settings Card */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white rounded-3xl border border-border-main hover:shadow-xs p-4 space-y-4 relative"
      >
        <h3 className="text-sm font-semibold text-text-primary">
          Profile Settings
        </h3>

        {/* Avatar block. The pencil was decorative markup with no handler
            behind it — picking a file now stages the picture, and it is
            written by the same Save Changes that writes the rest of the
            form, so one action commits the whole profile. */}
        <div className="flex items-center gap-3">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handlePickPhoto}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={isReadingPhoto || saveProfile.isPending}
            title="Change profile picture"
            className="relative w-14 h-14 rounded-full overflow-hidden text-white flex items-center justify-center font-medium text-lg bg-primary-bg-muted select-none hover:opacity-95 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            {shownPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shownPhoto}
                alt="Your profile picture"
                className="w-full h-full object-cover"
              />
            ) : (
              (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || "—"
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white border border-border-main rounded-full flex items-center justify-center text-text-muted shadow-2xs">
              {isReadingPhoto ? (
                <Loader2 size={9} className="animate-spin" />
              ) : (
                <Edit2 size={9} />
              )}
            </span>
          </button>

          {/* Both staging states say so plainly and offer a way back —
              nothing here reaches Firestore until Save Changes. */}
          <div className="text-[10px] space-y-0.5">
            {pendingPhoto ? (
              <p className="text-amber-600">
                New picture selected — press Save Changes to apply it.
              </p>
            ) : clearPhoto ? (
              <p className="text-amber-600">
                Picture will be removed when you save.
              </p>
            ) : (
              <p className="text-text-muted font-light">
                JPEG, PNG, WebP or GIF.
              </p>
            )}

            {pendingPhoto ? (
              <button
                type="button"
                onClick={() => setPendingPhoto(null)}
                className="text-text-muted hover:underline cursor-pointer"
              >
                Discard selection
              </button>
            ) : clearPhoto ? (
              <button
                type="button"
                onClick={() => setClearPhoto(false)}
                className="text-text-muted hover:underline cursor-pointer"
              >
                Keep current picture
              </button>
            ) : profile?.photoUrl ? (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-red-500 hover:underline cursor-pointer"
              >
                Remove picture
              </button>
            ) : null}
          </div>
        </div>

        {/* Inputs layout */}
        <div className="space-y-4 max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-muted block">
                First Name
              </label>
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
              value={ADMIN_ROLE_LABELS[profile?.role] || profile?.role || "—"}
              className="w-full bg-page-bg border border-border-main text-xs rounded-xl p-3 focus:outline-none text-text-muted cursor-not-allowed font-light"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-muted block">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={email}
                title="Email is your sign-in identity and cannot be changed here."
                className="w-full bg-page-bg border border-border-main text-xs rounded-xl p-3 focus:outline-none text-text-muted cursor-not-allowed font-light"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted block">
                Phone Number
              </label>
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
            disabled={saveProfile.isPending || isLoading}
            className="bg-primary-bg hover:bg-primary-bg-muted text-white font-semibold text-xs py-3 px-5 rounded-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveProfile.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Security configuration card.

          Platform-wide policy — session timeout and forced 2FA apply to every
          admin, not to the person editing their own profile — so it belongs to
          the super admin alone. */}
      {/* {isSuperAdmin && (
      <form onSubmit={handleSaveSecurity} className="bg-white rounded-3xl border border-border-main hover:shadow-xs p-4 space-y-5 relative">
        <h3 className="text-sm font-semibold text-text-primary">Security configuration</h3> */}

      {/* Session Timeout */}
      {/* <div className="space-y-1.5 p-3 border border-border-main rounded-xl w-full">
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
        </div> */}

      {/* 2FA switch toggle */}
      {/* <div className="flex items-center justify-between p-3 border border-border-main rounded-xl w-full gap-4">
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
        </div> */}

      {/* Warn banner block */}
      {/* <div className="bg-amber-50/45 border border-amber-200/50 rounded-xl p-4 flex items-start gap-2.5 w-full text-[10px] text-amber-800 font-light">
          <AlertCircle size={15} className="text-amber-600/80 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            All admin actions are logged to audit_logs. IP addresses are captured per session. Logs are immutable.
          </p>
        </div> */}

      {/* Submit action */}
      {/* <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-primary-bg hover:bg-primary-bg-muted text-white font-semibold text-xs py-3 px-5 rounded-lg transition cursor-pointer"
          >
            Save Settings
          </button>
        </div>
      </form> */}
      {/* )} */}

      {/* Change password modal overlay */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onUpdate={handleUpdatePassword}
      />
    </div>
  );
}
