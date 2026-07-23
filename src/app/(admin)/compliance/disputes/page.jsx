"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import Pagination from "@/components/ui/Pagination";
import CardWrapper from "@/components/ui/CardWrapper";

const defaultDisputes = [
  {
    id: "D-0019",
    txnId: "TXN-00188",
    bookingId: "BK234RFDW235E",
    client: "Amara Osei",
    clientEmail: "amara.osei@gmail.com",
    provider: "Blessing Okeke",
    providerEmail: "b.okeke@clearly.ca",
    category: "Window Cleaning",
    dateOpened: "Jul 5, 2027",
    status: "Under Review",
    serviceAmount: 126.00,
    clientFee: 6.30,
    commission: 18.90,
    totalCharged: 132.30,
    description: "Provider left after 45 minutes claiming the job was done. Client states that 3 of 8 windows were not cleaned and the sills were not wiped as per the listing description.",
    reason: "Service not completed",
    clientStatement: "Hi, I'm really unhappy with the service today. The provider left after less than an hour and 3 of my windows are still dirty. The sills weren't even touched.",
    providerStatement: "I completed all tasks listed in the booking. The client added new rooms verbally that were not included in the original scope. I worked 5 hours and completed what was agreed at booking.",
    chat: [
      { sender: "Amara Osei", role: "client", text: "Hi, I'm really unhappy with the service today. The provider left after less than an hour and 3 of my windows are still dirty. The sills weren't even touched.", time: "Jul 5, 2027 9:14 AM" },
      { sender: "Amara Osei", role: "client", text: "I've uploaded photos showing the state of the windows both before and after. You can clearly see the difference – windows 4, 6 and 7 are unchanged.", time: "Jul 5, 2027 9:22 AM", file: "window_photos_comparison.jpg" },
      { sender: "Blessing Okeke", role: "provider", text: "I completed all windows that were accessible. Windows 6 and 7 were blocked by furniture the client had not moved as required in the booking notes. I cannot be held responsible for client-side access issues.", time: "Jul 5, 2027 11:45 AM" },
      { sender: "Blessing Okeke", role: "provider", text: "I also have a completion photo showing my work on the windows I was given access to. This is standard practice – any inaccessible areas are noted at the time of service.", time: "Jul 5, 2027 11:48 AM", file: "provider_completion_photo.jpg" },
      { sender: "Amara Osei", role: "client", text: "The furniture was NOT blocking windows 4 and 7. The sofa is on the opposite wall. I have floor plan photos if needed. Window 6 I can accept but 4 and 7 were absolutely accessible.", time: "Jul 5, 2027 3:10 PM" },
      { sender: "System", role: "system", text: "Admin Priya Nair has joined this conversation. All messages are now being monitored by the Netly dispute team.", time: "Jul 6, 2027 10:30 AM" },
      { sender: "Admin - Priya Nair", role: "admin", text: "Hello Amara and Blessing. I'm Priya from the Netly disputes team. I've reviewed the evidence submitted by both parties. I have a few clarifying questions before we proceed.\n\nBlessing – can you confirm the exact time you arrived and departed? The booking was for 2 hours and our records show a 52-minute duration.", time: "Jul 6, 2027 10:31 AM" },
      { sender: "Blessing Okeke", role: "provider", text: "I arrived at 10:05 AM and departed at 10:58 AM. The booking was originally for 2 hours but I finished in under 1 hour because access was limited. I did not charge for the full 2 hours – my time log shows 52 minutes billed.", time: "Jul 6, 2027 11:02 AM" },
      { sender: "Amara Osei", role: "client", text: "Priya, thank you for getting involved. I just want a fair resolution. I'm happy with a partial refund for the windows that weren't done – I don't want to penalize the provider for the whole booking, just the incomplete part.", time: "Jul 6, 2027 11:20 AM" },
      { sender: "Admin - Priya Nair", role: "admin", text: "Thank you both for clarifying. Amara, that's a reasonable position. Blessing, given that 2 of 8 windows were unambiguously accessible (based on your own photos, which show the room layout), would you be open to a 25% partial refund? That would be $31.50 returned to Amara's wallet.", time: "Jul 6, 2027 2:45 PM" }
    ],
    timeline: [
      { event: "Service Request Submitted", time: "June 10, 2026 • 09:45 AM" },
      { event: "Negotiation Started", time: "June 10, 2026 • 09:52 AM" },
      { event: "Custom Offer Sent", time: "June 10, 2026 • 10:08 AM" },
      { event: "Offer Accepted", time: "June 10, 2026 • 10:15 AM" },
      { event: "Payment Completed", time: "June 10, 2026 • 10:15 AM" },
      { event: "Booking Confirmed", time: "June 10, 2026 • 10:15 AM" },
      { event: "Service Started", time: "June 10, 2026 • 10:15 AM" },
      { event: "Provider Marked Completed", time: "June 10, 2026 • 10:15 AM" },
      { event: "Dispute opened by client", time: "June 10, 2026 • 09:45 AM" },
      { event: "Status set to Open — in queue", time: "June 10, 2026 • 09:45 AM" },
      { event: "Status → Under Review", time: "June 10, 2026 • 09:45 AM" }
    ]
  },
  { id: "D-01270", txnId: "TXN00192123456809", bookingId: "BK234RFDW235L", client: "Patricia Thomas", provider: "Meek Nowise", category: "Carpet Shampooing", dateOpened: "Nov 20, 2028", status: "Under Review" },
  { id: "D-01268", txnId: "TXN00192123456807", bookingId: "BK234RFDW235J", client: "Linda Taylor", provider: "David Tennant", category: "Floor Polishing", dateOpened: "Oct 10, 2028", status: "Resolved", decision: "Split", resolvedDate: "Jun 25, 2027, 09:30", resolvedBy: "admin@netly.io", notes: "Both parties partially at fault. Provider lateness confirmed. Partial credit issued to client wallet. Provider commission reduced by 30%." },
  { id: "D-01263", txnId: "TXN00192123456802", bookingId: "BK234RFDW235E", client: "James Smith", provider: "Clara Barton", category: "Window Washing", dateOpened: "Jun 01, 2028", status: "Open" },
  { id: "D-01266", txnId: "TXN00192123456805", bookingId: "BK234RFDW235H", client: "Emily Davis", provider: "Gregory House", category: "Floor Polishing", dateOpened: "Aug 05, 2028", status: "Resolved", decision: "Favor Client", resolvedDate: "Aug 06, 2028, 14:00", resolvedBy: "admin@netly.io", notes: "Full refund issued to client." },
  { id: "D-01272", txnId: "TXN00192123456811", bookingId: "BK234RFDW235N", client: "Jessica Robinson", provider: "Arthur Pendelton", category: "Deep Cleaning", dateOpened: "Dec 15, 2028", status: "Open" },
  { id: "D-01265", txnId: "TXN00192123456804", bookingId: "BK234RFDW235G", client: "David Brown", provider: "Mia Wong", category: "Deep Cleaning", dateOpened: "Jul 10, 2028", status: "Under Review" },
  { id: "D-01267", txnId: "TXN00192123456806", bookingId: "BK234RFDW235I", client: "Michael Wilson", provider: "Isabella Ross", category: "Deep Cleaning", dateOpened: "Sep 15, 2028", status: "Open" },
  { id: "D-01262", txnId: "TXN00192123456801", bookingId: "BK234RFDW235D", client: "Mia Chen", provider: "Ezekiel Vance", category: "Window Washing", dateOpened: "May 15, 2028", status: "Resolved", decision: "Favor Provider", resolvedDate: "May 16, 2028, 16:30", resolvedBy: "admin@netly.io", notes: "No fault found on provider side. Funds released." },
  { id: "D-01271", txnId: "TXN00192123456810", bookingId: "BK234RFDW235M", client: "Daniel Martinez", provider: "Sofia Martinez", category: "Deep Cleaning", dateOpened: "Dec 01, 2028", status: "Open" }
];

export default function DisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Open");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Sync state with localStorage
  useEffect(() => {
    const saved = localStorage.getItem("netly_disputes");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasIssues = parsed.some(d => !d.provider || d.client === d.provider);
        if (hasIssues) {
          localStorage.removeItem("netly_disputes");
          setDisputes(defaultDisputes);
          localStorage.setItem("netly_disputes", JSON.stringify(defaultDisputes));
        } else {
          const updatedParsed = parsed.map(d => {
            if (d.id === "D-0019" && (!d.reason || d.timeline?.length < 5)) {
              return {
                ...d,
                ...defaultDisputes[0]
              };
            }
            return d;
          });
          setDisputes(updatedParsed);
          localStorage.setItem("netly_disputes", JSON.stringify(updatedParsed));
        }
      } catch (err) {
        localStorage.removeItem("netly_disputes");
        setDisputes(defaultDisputes);
        localStorage.setItem("netly_disputes", JSON.stringify(defaultDisputes));
      }
    } else {
      setDisputes(defaultDisputes);
      localStorage.setItem("netly_disputes", JSON.stringify(defaultDisputes));
    }
  }, []);

  // Statistics counters cards
  const counts = useMemo(() => {
    const res = { Open: 0, UnderReview: 0, Resolved: 0 };
    disputes.forEach((d) => {
      if (d.status === "Open") res.Open++;
      else if (d.status === "Under Review") res.UnderReview++;
      else if (d.status === "Resolved") res.Resolved++;
    });
    return res;
  }, [disputes]);

  // Filter disputes by active tab + search + date
  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      const matchSearch =
        d.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTab = d.status === activeTab;

      let matchDate = true;
      if (startDate && endDate) {
        const itemDate = new Date(d.dateOpened);
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        matchDate = itemDate >= start && itemDate <= end;
      }

      return matchSearch && matchTab && matchDate;
    });
  }, [disputes, searchTerm, activeTab, startDate, endDate]);

  // Sliced page data
  const paginated = useMemo(() => {
    return filteredDisputes.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredDisputes, currentPage]);

  // Render pill color status utilities
  const getStatusClass = (status) => {
    switch (status) {
      case "Resolved":
        return "text-emerald-500 bg-emerald-50";
      case "Under Review":
        return "text-amber-500 bg-amber-50";
      case "Open":
        return "text-red-500 bg-red-50";
      default:
        return "text-text-muted bg-page-bg";
    }
  };

  // Tab definitions
  const tabs = [
    { id: "Open", label: "Open" },
    { id: "Under Review", label: "Under Review" },
    { id: "Resolved", label: "Resolved" }
  ];

  // Dashboard list layout (default state)
  return (
    <div className="space-y-4 font-onest">

      {/* Summary Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        {[
          { label: "Open", count: counts.Open },
          { label: "Under Review", count: counts.UnderReview },
          { label: "Resolved", count: counts.Resolved }
        ].map((card, idx) => (
          <CardWrapper
            key={idx}
            name={card.label}
            value={card.count}
          />
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border-main text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 -mb-px font-semibold transition hover:text-primary-bg cursor-pointer ${activeTab === tab.id
                ? "border-b-2 border-text-primary text-text-primary font-bold"
                : "text-text-muted"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Table Container Box */}
      <div className="bg-white rounded-3xl border border-border-main hover:shadow-xs relative overflow-visible">

        {/* Filters control bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-t-3xl border-b border-border-main">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-md w-full border border-border-main md:text-xs text-[10px] rounded-full pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Date range picker */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Disputes Grid Table (or leak empty container if counts empty) */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl min-h-80">
            <span className="text-xs text-text-muted animate-pulse font-light">Loading Disputes Data...</span>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 select-none bg-white rounded-b-3xl min-h-80">
            <img src="/empty.png" alt="No data" className="w-24 h-24 object-contain opacity-80" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No Open Disputes</h3>
              <p className="text-xs text-text-muted font-light">Disputes raised by client/provider will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-b-3xl">
            <table className="min-w-full divide-y divide-secondary-bg md:text-sm text-xs tracking-tight">
              <thead className="bg-secondary-bg text-text-primary text-left md:text-sm text-xs font-bold">
                <tr>
                  <th className="px-4 py-2 font-semibold">Dispute ID</th>
                  <th className="px-4 py-2 font-semibold">Transaction ID</th>
                  <th className="px-4 py-2 font-semibold">Booking ID</th>
                  <th className="px-4 py-2 font-semibold">Client</th>
                  <th className="px-4 py-2 font-semibold">Provider</th>
                  <th className="px-4 py-2 font-semibold">Category</th>
                  <th className="px-4 py-2 font-semibold">Date Opened</th>
                  <th className="px-4 py-2 w-20 text-right pr-6 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs text-text-primary">
                {paginated.map((row) => (
                  <tr key={row.id} className="hover:bg-page-bg/50 transition">
                    <td className="px-4 py-3">{row.id}</td>
                    <td className="px-4 py-3 font-mono">{row.txnId}</td>
                    <td className="px-4 py-3 font-mono">{row.bookingId}</td>
                    <td className="px-4 py-3">{row.client}</td>
                    <td className="px-4 py-3">{row.provider}</td>
                    <td className="px-4 py-3">{row.category}</td>
                    <td className="px-4 py-3">{row.dateOpened}</td>
                    <td className="px-4 py-3 text-right pr-6">
                      <button
                        onClick={() => {
                          router.push(`/compliance/disputes/${row.id}`);
                        }}
                        className="inline-block border border-primary-bg-muted hover:border-primary-bg text-primary-bg font-medium px-3.5 py-1 rounded-lg transition cursor-pointer text-center"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Navigation Footer */}
        {filteredDisputes.length > 0 && (
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredDisputes.length}
            onPageChange={setCurrentPage}
          />
        )}

      </div>

    </div>
  );
}
