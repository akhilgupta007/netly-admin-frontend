"use client";

import React, { useState } from "react";
import { X, Loader2, Upload, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useCategories } from "@/hooks/useCatalogue";
import { readImageForUpload } from "@/lib/imageFile";

/** Caps from the briefing — enforced here and again server-side. */
const SHORT_MAX = 150;
const LONG_MAX = 500;

/** Canadian provinces and territories, plus the US states seen in the data. */
const PROVINCES = [
  ["QC", "QC — Québec"],
  ["ON", "ON — Ontario"],
  ["BC", "BC — British Columbia"],
  ["AB", "AB — Alberta"],
  ["MB", "MB — Manitoba"],
  ["SK", "SK — Saskatchewan"],
  ["NS", "NS — Nova Scotia"],
  ["NB", "NB — New Brunswick"],
  ["NL", "NL — Newfoundland and Labrador"],
  ["PE", "PE — Prince Edward Island"],
  ["NT", "NT — Northwest Territories"],
  ["YT", "YT — Yukon"],
  ["NU", "NU — Nunavut"],
];

/** A date input wants YYYY-MM-DD in local terms, not an ISO instant. */
function toDateInput(value) {
  if (!value) return "";
  const d =
    typeof value?.toDate === "function" ?
      value.toDate() :
      value?.seconds ?
        new Date(value.seconds * 1000) :
        new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Create or edit a sponsored listing.
 *
 * Laid out as the four blocks the briefing specifies — company, category,
 * contact and campaign — so the form reads in the same order as the spec it is
 * checked against.
 *
 * @param {object} props - Options.
 * @param {boolean} props.isOpen - Whether the dialog is shown.
 * @param {object} props.listing - The row being edited, or null to create.
 * @param {Function} props.onClose - Close handler.
 * @param {Function} props.onSubmit - Receives the assembled payload.
 * @param {boolean} props.isPending - True while the write is in flight.
 * @return {JSX.Element|null} The dialog.
 */
export default function SponsoredListingModal({
  isOpen,
  listing,
  onClose,
  onSubmit,
  isPending = false,
}) {
  const { categories } = useCategories();
  const isEdit = Boolean(listing);

  const [form, setForm] = useState(() => seed(listing));
  const [lastId, setLastId] = useState(listing?.id ?? null);
  const [logo, setLogo] = useState(null);
  const [isReadingLogo, setIsReadingLogo] = useState(false);

  // Re-seed when the dialog is reopened on a different row. Adjusted during
  // render rather than in an effect, which would show the previous listing's
  // values for a frame.
  if ((listing?.id ?? null) !== lastId) {
    setLastId(listing?.id ?? null);
    setForm(seed(listing));
    setLogo(null);
  }

  if (!isOpen) return null;

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // Sub-services belong to the selected category, so the list is rebuilt
  // whenever it changes — and a stale subcategory is dropped rather than left
  // pointing at a category it no longer belongs to.
  const selected = categories.find((c) => c.name === form.mainCategory) || null;
  const subOptions = (selected?.subServices || []).filter((s) => s.active);

  const onCategoryChange = (e) =>
    setForm((f) => ({ ...f, mainCategory: e.target.value, subcategory: "" }));

  const pickLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsReadingLogo(true);
    try {
      setLogo(await readImageForUpload(file, { maxEdge: 800 }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsReadingLogo(false);
    }
  };

  const shownLogo = logo?.dataUrl || form.logoUrl || "";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isPending) return;

    const required = [
      [form.companyName.trim(), "Company name"],
      [form.shortDescription.trim(), "Short description"],
      [form.mainCategory, "Main category"],
      [form.websiteUrl.trim(), "Website URL"],
      [form.city.trim(), "City"],
      [form.province, "Province"],
      [form.startDate, "Start date"],
      [form.endDate, "End date"],
    ].find(([value]) => !value);
    if (required) {
      toast.error(`${required[1]} is required.`);
      return;
    }
    // A logo is required by the briefing, but only on create — an edit that
    // does not touch it keeps the one already stored.
    if (!isEdit && !logo) {
      toast.error("A logo is required.");
      return;
    }
    if (form.endDate < form.startDate) {
      toast.error("The end date cannot fall before the start date.");
      return;
    }
    try {
      // Rejected here rather than at the callable, so the admin finds out
      // before the upload rather than after it.
      const url = new URL(form.websiteUrl.trim());
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("scheme");
    } catch {
      toast.error("Enter a full website URL, including https://");
      return;
    }

    onSubmit({
      listingId: listing?.id,
      company_name: form.companyName.trim(),
      short_description: form.shortDescription.trim(),
      long_description: form.longDescription.trim(),
      main_category: form.mainCategory,
      subcategory: form.subcategory,
      website_url: form.websiteUrl.trim(),
      phone_number: form.phoneNumber.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      province: form.province,
      postal_code: form.postalCode.trim(),
      start_date: form.startDate,
      end_date: form.endDate,
      display_position: form.displayPosition,
      geo_target: form.geoTarget,
      billing_reference: form.billingReference.trim(),
      status: form.status,
      ...(logo ?
        { logoBase64: logo.dataUrl, logoContentType: logo.contentType } :
        {}),
    });
  };

  const field =
    "w-full bg-white border border-border-main text-xs rounded-xl p-3 " +
    "focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary " +
    "placeholder:text-text-muted disabled:opacity-60";
  const label = "text-[11px] text-text-primary block font-medium mb-1";
  const req = <span className="text-red-500">*</span>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-onest p-4">
      <div
        className="absolute inset-0 bg-alt-bg/40 backdrop-blur-xs"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-3xl w-full max-w-3xl shadow-2xl z-10 border border-border-main animate-scale-up max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-border-main shrink-0">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              {isEdit ? "Edit Sponsored Listing" : "Create Sponsored Listing"}
            </h3>
            <p className="text-[10px] text-text-muted font-light mt-0.5">
              Paid placement for a business that does not transact on Netly.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-text-primary text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-4 space-y-5 overflow-y-auto scrollbar-thin flex-1">
          {/* ── Company Information ── */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-primary-bg uppercase tracking-wider">
              Company Information
            </h4>

            <div className="flex items-start gap-4">
              <div className="shrink-0 space-y-1.5">
                <span className={label}>Logo {req}</span>
                <label className="w-20 h-20 rounded-2xl border border-dashed border-border-main bg-page-bg/50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-bg transition">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={pickLogo}
                    className="hidden"
                  />
                  {isReadingLogo ? (
                    <Loader2 size={16} className="animate-spin text-text-muted" />
                  ) : shownLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shownLogo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={16} className="text-text-muted" />
                  )}
                </label>
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <label className={label}>Company name {req}</label>
                  <input
                    className={field}
                    value={form.companyName}
                    onChange={set("companyName")}
                    placeholder="e.g. ProLavage Auto"
                  />
                </div>
                <div>
                  <label className={label}>
                    Short description {req}
                    <span className="float-right font-light text-text-muted">
                      {form.shortDescription.length}/{SHORT_MAX}
                    </span>
                  </label>
                  <input
                    className={field}
                    maxLength={SHORT_MAX}
                    value={form.shortDescription}
                    onChange={set("shortDescription")}
                    placeholder="Shown on the listing card"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={label}>
                Long description
                <span className="float-right font-light text-text-muted">
                  {form.longDescription.length}/{LONG_MAX}
                </span>
              </label>
              <textarea
                rows={3}
                maxLength={LONG_MAX}
                className={`${field} resize-none`}
                value={form.longDescription}
                onChange={set("longDescription")}
                placeholder="Shown on the detail page only"
              />
            </div>
          </section>

          {/* ── Service Category ── */}
          <section className="space-y-3 pt-1 border-t border-border-main">
            <h4 className="text-xs font-semibold text-primary-bg uppercase tracking-wider pt-3">
              Service Category
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={label}>Main category {req}</label>
                {/* Read from the live catalogue, not a fixed list — a hardcoded
                    one would stop matching the moment a category is renamed,
                    and the app matches listings to categories by this value. */}
                <select
                  className={`${field} cursor-pointer`}
                  value={form.mainCategory}
                  onChange={onCategoryChange}
                >
                  <option value="">Select a category</option>
                  {categories
                      .filter((c) => c.active)
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                </select>
              </div>
              <div>
                <label className={label}>Subcategory</label>
                <select
                  className={`${field} cursor-pointer`}
                  value={form.subcategory}
                  onChange={set("subcategory")}
                  disabled={!form.mainCategory}
                >
                  <option value="">— All subcategories —</option>
                  {subOptions.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <span className="text-[9px] text-text-muted font-light block mt-1">
                  Left blank, the listing shows across every subcategory.
                </span>
              </div>
            </div>
          </section>

          {/* ── Contact & Redirect ── */}
          <section className="space-y-3 pt-1 border-t border-border-main">
            <h4 className="text-xs font-semibold text-primary-bg uppercase tracking-wider pt-3">
              Contact &amp; Redirect
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={label}>Website URL {req}</label>
                <input
                  className={field}
                  value={form.websiteUrl}
                  onChange={set("websiteUrl")}
                  placeholder="https://www.example.com"
                />
              </div>
              <div>
                <label className={label}>Phone number</label>
                <input
                  className={field}
                  value={form.phoneNumber}
                  onChange={set("phoneNumber")}
                  placeholder="(514) 000-0000"
                />
              </div>
              <div>
                <label className={label}>Physical address</label>
                <input
                  className={field}
                  value={form.address}
                  onChange={set("address")}
                  placeholder="Street address (optional)"
                />
              </div>
              <div>
                <label className={label}>City {req}</label>
                <input
                  className={field}
                  value={form.city}
                  onChange={set("city")}
                  placeholder="City"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Province {req}</label>
                  <select
                    className={`${field} cursor-pointer`}
                    value={form.province}
                    onChange={set("province")}
                  >
                    <option value="">—</option>
                    {PROVINCES.map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>Postal code</label>
                  <input
                    className={field}
                    value={form.postalCode}
                    onChange={set("postalCode")}
                    placeholder="A1A 1A1"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Campaign Settings ── */}
          <section className="space-y-3 pt-1 border-t border-border-main">
            <h4 className="text-xs font-semibold text-primary-bg uppercase tracking-wider pt-3">
              Campaign Settings
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={label}>Start date {req}</label>
                <input
                  type="date"
                  className={`${field} cursor-pointer`}
                  value={form.startDate}
                  onChange={set("startDate")}
                />
              </div>
              <div>
                <label className={label}>End date {req}</label>
                <input
                  type="date"
                  className={`${field} cursor-pointer`}
                  value={form.endDate}
                  onChange={set("endDate")}
                />
                <span className="text-[9px] text-text-muted font-light block mt-1">
                  The listing stops showing after this date.
                </span>
              </div>
              <div>
                <label className={label}>Display position {req}</label>
                <select
                  className={`${field} cursor-pointer`}
                  value={form.displayPosition}
                  onChange={set("displayPosition")}
                >
                  <option value="featured">Featured — top of results</option>
                  <option value="standard">Standard — within results</option>
                </select>
              </div>
              <div>
                <label className={label}>Geographic target {req}</label>
                <select
                  className={`${field} cursor-pointer`}
                  value={form.geoTarget}
                  onChange={set("geoTarget")}
                >
                  <option value="city">City</option>
                  <option value="province">Province</option>
                  <option value="national">National</option>
                </select>
              </div>
              <div>
                <label className={label}>Billing reference</label>
                <input
                  className={field}
                  value={form.billingReference}
                  onChange={set("billingReference")}
                  placeholder="VCI-2026-001"
                />
              </div>
              <div>
                <label className={label}>Status {req}</label>
                <select
                  className={`${field} cursor-pointer`}
                  value={form.status}
                  onChange={set("status")}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <span className="text-[9px] text-text-muted font-light block mt-1">
                  Expired is set automatically once the end date passes.
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between gap-2 p-4 border-t border-border-main shrink-0">
          {logo && (
            <button
              type="button"
              onClick={() => setLogo(null)}
              className="text-[11px] text-text-muted hover:text-red-500 transition cursor-pointer flex items-center gap-1"
            >
              <Trash2 size={12} /> Discard new logo
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="bg-white border border-border-main text-text-primary hover:bg-page-bg font-semibold text-xs py-2.5 px-5 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || isReadingLogo}
              className="bg-primary-bg hover:bg-primary-bg-muted text-white font-semibold text-xs py-2.5 px-5 rounded-lg transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isPending && <Loader2 size={13} className="animate-spin" />}
              {isPending ?
                "Saving…" :
                isEdit ? "Save changes" : "Publish listing"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/**
 * Form state for a listing, or the defaults for a new one.
 * @param {object} listing - Row being edited, or null.
 * @return {object} Field values.
 */
function seed(listing) {
  return {
    companyName: listing?.companyName || "",
    logoUrl: listing?.logoUrl || "",
    shortDescription: listing?.shortDescription || "",
    longDescription: listing?.longDescription || "",
    mainCategory: listing?.mainCategory || "",
    subcategory: listing?.subcategory || "",
    websiteUrl: listing?.websiteUrl || "",
    phoneNumber: listing?.phoneNumber || "",
    address: listing?.address || "",
    city: listing?.city || "",
    province: listing?.province || "",
    postalCode: listing?.postalCode || "",
    startDate: toDateInput(listing?.startDateRaw),
    endDate: toDateInput(listing?.endDateRaw),
    displayPosition: (listing?.displayPosition || "Standard").toLowerCase(),
    geoTarget: (listing?.geoTarget || "City").toLowerCase(),
    billingReference: listing?.billingReference || "",
    status: listing?.storedStatus === "inactive" ? "inactive" : "active",
  };
}
