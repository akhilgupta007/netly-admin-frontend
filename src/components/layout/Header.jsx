"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, User } from "lucide-react";
import { navigation } from "./Sidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { ADMIN_ROLE_LABELS } from "@/lib/adminRoles";
import NotificationBell from "./NotificationBell";

export default function Header({ setSidebarOpen, title: propTitle, subtitle: propSubtitle }) {
  const pathname = usePathname();
  
  const authRole = useAuthStore((state) => state.role);
  // Reads the admin's own users document. This previously came from a
  // localStorage copy that no longer exists, so it always fell back to a
  // placeholder name.
  const { profile } = useAdminProfile();

  // First name only — the header has room for one word.
  // An email prefix is not a name — "rojor83711+admin2" reads worse than the
  // generic label, so an admin who has not set a name gets "Admin" until they
  // save one in Profile Settings.
  const adminName =
    profile?.firstName ||
    (profile?.fullName || "").trim().split(" ")[0] ||
    "Admin";

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
        <NotificationBell />

        <div className="w-px h-10 bg-black/10 shrink-0"></div>

        {/* Profile Menu */}
        <Link
          href="/platform/settings"
          className="flex items-center gap-2 sm:gap-3 py-1.5 pl-2 pr-2 sm:pr-4 rounded-xl border border-primary-bg/40 bg-page-bg hover:bg-primary-bg/5 transition shrink-0 cursor-pointer"
        >
          {/* The admin's profile picture, falling back to the generic icon
              only while none is set. */}
          <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg border border-primary-bg/50 bg-primary-bg/10 text-primary-bg shrink-0 select-none">
            {profile?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={18} fill="var(--color-primary-bg)" />
            )}
          </div>
          {/* User details text */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-sm font-medium text-text-primary leading-tight">{adminName}</span>
            <span className="text-xs text-text-muted font-light leading-none">{ADMIN_ROLE_LABELS[authRole] || authRole || "Admin"}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
