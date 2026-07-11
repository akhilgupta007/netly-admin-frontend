"use client";

import React, { useState } from "react";
import { ChevronDown, Download, ArrowUpDown, ArrowUp, ArrowDown, MapPin, Info } from "lucide-react";
import { toast } from "react-toastify";
import Pagination from "@/components/ui/Pagination";
import { exportCSV } from "@/utils/exportHelper";

// Mock stats data matching Screenshot 4
const mockStats = [
  { id: "STA-001", city: "Maputo", country: "Mozambique", category: "Golf Lessons", clients: 620, providers: 31, ratio: 4.1, volume: 180, gmv: 7560, demandLevel: "High demand", bubbleLabel: "Map", left: "28%", top: "45%" },
  { id: "STA-002", city: "Banjul", country: "Gambia", category: "Surfing Lessons", clients: 550, providers: 26, ratio: 4.2, volume: 150, gmv: 6600, demandLevel: "High demand", bubbleLabel: "Ban", left: "15%", top: "35%" },
  { id: "STA-003", city: "Cairo", country: "Egypt", category: "Zumba", clients: 720, providers: 29, ratio: 3.7, volume: 220, gmv: 8640, demandLevel: "Medium", bubbleLabel: "Cai", left: "42%", top: "25%" },
  { id: "STA-004", city: "Lusaka", country: "Zambia", category: "Strength Training", clients: 800, providers: 36, ratio: 4.0, volume: 210, gmv: 9600, demandLevel: "High demand", bubbleLabel: "Lus", left: "48%", top: "65%" },
  { id: "STA-005", city: "Nairobi", country: "Kenya", category: "Pilates", clients: 580, providers: 32, ratio: 4.3, volume: 170, gmv: 6776, demandLevel: "High demand", bubbleLabel: "Nai", left: "55%", top: "45%" },
  { id: "STA-006", city: "Abuja", country: "Nigeria", category: "Spinning Classes", clients: 650, providers: 38, ratio: 3.8, volume: 200, gmv: 7800, demandLevel: "Medium", bubbleLabel: "Abu", left: "33%", top: "40%" },
  { id: "STA-007", city: "Freetown", country: "Sierra Leone", category: "Outdoor Bootcamp", clients: 550, providers: 34, ratio: 3.6, volume: 160, gmv: 6600, demandLevel: "Medium", bubbleLabel: "Fre", left: "18%", top: "52%" },
  { id: "STA-008", city: "Kampala", country: "Uganda", category: "Martial Arts", clients: 550, providers: 33, ratio: 4.1, volume: 160, gmv: 6600, demandLevel: "High demand", bubbleLabel: "Kam", left: "51%", top: "50%" },
  { id: "STA-009", city: "Accra", country: "Ghana", category: "Dance Fitness", clients: 500, providers: 25, ratio: 4.0, volume: 150, gmv: 6000, demandLevel: "High demand", bubbleLabel: "Acc", left: "26%", top: "50%" },
  { id: "STA-010", city: "Lagos", country: "Nigeria", category: "General Cleaning", clients: 950, providers: 42, ratio: 4.9, volume: 310, gmv: 14500, demandLevel: "High demand", bubbleLabel: "Lag", left: "30%", top: "58%" }
];

export default function UserStatsTab() {
  const [data, setData] = useState(mockStats);
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [mapView, setMapView] = useState(false); // Default map view toggled ON matching Screenshot 5
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sorting state: "" (unsorted default), "desc", "asc"
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("desc");

  // Hover state for SVG bubble tooltips
  const [hoveredNode, setHoveredNode] = useState(null);

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === "desc") {
        setSortDirection("asc");
      } else {
        // After asc, clear sorting completely and return to default data order
        setSortField("");
      }
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-text-muted/60 shrink-0" />;
    }
    return sortDirection === "asc"
      ? <ArrowUp size={12} className="text-text-primary shrink-0" />
      : <ArrowDown size={12} className="text-text-primary shrink-0" />;
  };

  // Filter lists
  const countries = ["All", ...Array.from(new Set(data.map(item => item.country)))];
  const cities = ["All", ...Array.from(new Set(data.map(item => item.city)))];
  const categories = ["All", ...Array.from(new Set(data.map(item => item.category)))];

  // Filter application
  const filtered = data.filter((item) => {
    const matchesCountry = selectedCountry === "All" || item.country === selectedCountry;
    const matchesCity = selectedCity === "All" || item.city === selectedCity;
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesCountry && matchesCity && matchesCategory;
  });

  // Sort application
  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (typeof aVal === "string") {
      return sortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    } else {
      return sortDirection === "asc"
        ? aVal - bVal
        : bVal - aVal;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CSV Exporter
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("No data to export.");
      return;
    }
    const headers = ["City", "Country", "Category", "Clients", "Providers", "D/S Ratio", "Transaction Vol", "GMV"];
    const rows = filtered.map(item => `"${item.city}","${item.country}","${item.category}",${item.clients},${item.providers},"${item.ratio}x",${item.volume},${item.gmv}`);
    exportCSV(headers, rows, `user_stats_${Date.now()}.csv`);
  };

  return (
    <div className="space-y-4 animate-scale-up font-onest text-xs text-text-primary">
      
      {/* Filters row bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-secondary-bg rounded-3xl shadow-2xs">
        
        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Country select */}
          <div className="relative">
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
            >
              <option value="All">Country</option>
              {countries.filter(c => c !== "All").map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          </div>

          {/* City select */}
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
            >
              <option value="All">City</option>
              {cities.filter(c => c !== "All").map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          </div>

          {/* Category select */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5"
            >
              <option value="All">Category</option>
              {categories.filter(c => c !== "All").map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Map toggle */}
          <div className="flex items-center gap-2 select-none mr-2">
            <span className="text-[10px] text-text-muted font-light">Map View</span>
            <button
              type="button"
              onClick={() => setMapView(!mapView)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                mapView ? "bg-[#6FB5BD]" : "bg-secondary-bg"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  mapView ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="bg-[#6FB5BD] hover:bg-[#5da0a8] text-white font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer select-none flex items-center gap-1.5 shadow-2xs h-9.5 shrink-0"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Interactive SVG map panel matching Screenshot 5 */}
      {mapView && (
        <div className="bg-white border border-secondary-bg rounded-3xl p-6 relative shadow-2xs overflow-hidden select-none animate-fade-in h-[320px] flex items-center justify-center bg-sky-50/10">
          
          {/* Background geographical contour mesh grid map */}
          <svg className="absolute inset-0 w-full h-full opacity-10 text-sky-900/60 pointer-events-none" viewBox="0 0 800 350" fill="none" stroke="currentColor" strokeWidth="0.8">
            <path d="M50 150 C 100 130, 150 160, 200 140 C 250 120, 300 90, 350 100 C 400 110, 450 130, 500 110 C 550 90, 600 110, 650 130 C 700 150, 750 120, 800 140" />
            <path d="M80 180 C 130 190, 180 160, 230 180 C 280 200, 330 220, 380 200 C 430 180, 480 160, 530 170 C 580 180, 630 200, 680 190" />
            <path d="M120 220 C 170 240, 220 210, 270 230 C 320 250, 370 260, 420 240 C 470 220, 520 230, 570 210" />
            <circle cx="150" cy="110" r="1.5" />
            <circle cx="380" cy="80" r="1.5" />
            <circle cx="560" cy="140" r="1.5" />
            <circle cx="680" cy="240" r="1.5" />
          </svg>

          {/* Render bubbles dynamically */}
          <div className="absolute inset-0 w-full h-full">
            {filtered.map((item) => {
              const isLagos = item.city === "Lagos";
              // Lagos has custom dark blue styling in Screenshot 5
              const bubbleClass = isLagos
                ? "bg-slate-900 border-2 border-slate-700 text-white shadow-lg hover:scale-105"
                : "bg-sky-100 border-2 border-sky-300 text-sky-800 shadow-xs hover:scale-105 hover:bg-sky-200/80";

              // Dynamically scale size between 30px and 68px proportional to GMV
              const sizePx = Math.max(30, Math.min(68, 28 + (item.gmv / 14500) * 40));

              return (
                <div
                  key={item.id}
                  style={{ left: item.left, top: item.top, width: `${sizePx}px`, height: `${sizePx}px` }}
                  onMouseEnter={() => setHoveredNode(item)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all duration-200 select-none ${bubbleClass}`}
                >
                  {item.bubbleLabel}
                </div>
              );
            })}
          </div>

          {/* Hover overlay tooltip details card */}
          {hoveredNode && (
            <div className="absolute top-4 right-4 z-20 w-48 bg-white/95 backdrop-blur-xs border border-secondary-bg rounded-2xl shadow-xl p-3.5 space-y-2 animate-scale-up text-left">
              <div className="flex items-center gap-1.5 border-b border-secondary-bg pb-1.5">
                <MapPin size={12} className="text-[#6FB5BD]" />
                <div>
                  <strong className="font-bold text-text-primary block leading-none">{hoveredNode.city}</strong>
                  <span className="text-[9px] text-text-muted font-light">{hoveredNode.country}</span>
                </div>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-text-muted font-light">Category:</span>
                  <span className="font-medium text-text-primary text-right max-w-[90px] truncate">{hoveredNode.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted font-light">Clients:</span>
                  <span className="font-semibold text-text-primary">{hoveredNode.clients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted font-light">Providers:</span>
                  <span className="font-semibold text-text-primary">{hoveredNode.providers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted font-light">D/S Ratio:</span>
                  <span className="font-bold text-[#6FB5BD]">{hoveredNode.ratio}x</span>
                </div>
                <div className="flex justify-between border-t border-secondary-bg/50 pt-1 mt-1 font-semibold text-text-primary">
                  <span>GMV:</span>
                  <span>${hoveredNode.gmv.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Legend block on bottom right matching Screenshot 5 */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-xs border border-secondary-bg/60 rounded-xl px-3 py-2 flex flex-wrap items-center gap-3 shadow-2xs text-[9px] font-semibold text-text-primary">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>High demand</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6FB5BD]" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Balanced</span>
            </div>
            <div className="border-l border-secondary-bg/60 h-3 ml-0.5 pl-2 text-text-muted font-light">
              Circle size = GMV
            </div>
          </div>

        </div>
      )}

      {/* Data Table Grid card */}
      <div className="bg-white border border-secondary-bg rounded-3xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-bg text-sm tracking-tight text-left">
            <thead className="bg-secondary-bg text-text-primary text-sm">
              <tr>
                <th
                  onClick={() => handleSort("city")}
                  className="px-4 py-3 font-semibold w-1/4 cursor-pointer hover:bg-page-bg/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    City
                    {renderSortIcon("city")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("category")}
                  className="px-4 py-3 font-semibold w-1/4 cursor-pointer hover:bg-page-bg/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    Category
                    {renderSortIcon("category")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("clients")}
                  className="px-4 py-3 font-semibold w-24 cursor-pointer hover:bg-page-bg/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    Clients
                    {renderSortIcon("clients")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("providers")}
                  className="px-4 py-3 font-semibold w-24 cursor-pointer hover:bg-page-bg/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    Providers
                    {renderSortIcon("providers")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("ratio")}
                  className="px-4 py-3 font-semibold w-28 cursor-pointer hover:bg-page-bg/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    D/S Ratio
                    {renderSortIcon("ratio")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("volume")}
                  className="px-4 py-3 font-semibold w-32 cursor-pointer hover:bg-page-bg/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    Transaction Vol.
                    {renderSortIcon("volume")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("gmv")}
                  className="px-4 py-3 font-semibold w-28 cursor-pointer hover:bg-page-bg/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    GMV
                    {renderSortIcon("gmv")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-bg text-sm text-text-primary">
              {paginated.map((item) => (
                <tr key={item.id} className="hover:bg-page-bg/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-text-muted shrink-0" />
                      <div>
                        <span className="block">{item.city}</span>
                        <span className="text-[10px] text-text-muted block mt-0.5">{item.country}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">{item.clients}</td>
                  <td className="px-4 py-3">{item.providers}</td>
                  <td className="px-4 py-3">{item.ratio}x</td>
                  <td className="px-4 py-3">{item.volume}</td>
                  <td className="px-4 py-3">${item.gmv.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={sorted.length}
          onPageChange={setCurrentPage}
        />
      </div>

    </div>
  );
}
