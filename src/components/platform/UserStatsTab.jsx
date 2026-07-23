"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Download, ArrowUpDown, ArrowUp, ArrowDown, MapPin, Info } from "lucide-react";
import { toast } from "react-toastify";
import Pagination from "@/components/ui/Pagination";
import { exportCSV } from "@/utils/exportHelper";

// Mock stats data matching Screenshot 4 / 5
const baseStats = [
  { city: "New York", country: "United States", category: "Photography", subCategory: "Wildlife Photography", clients: 610, providers: 32, ratio: 4.4, volume: 175, gmv: 7200, demandLevel: "High demand", bubbleLabel: "NYC", left: "28%", top: "45%" },
  { city: "Toronto", country: "Canada", category: "Cooking", subCategory: "African Cuisine", clients: 550, providers: 28, ratio: 4.2, volume: 160, gmv: 6800, demandLevel: "High demand", bubbleLabel: "TOR", left: "15%", top: "35%" },
  { city: "Los Angeles", country: "United States", category: "Writing", subCategory: "Creative Writing", clients: 530, providers: 27, ratio: 4.0, volume: 145, gmv: 5300, demandLevel: "Medium", bubbleLabel: "LA", left: "47%", top: "52%" },
  { city: "Vancouver", country: "Canada", category: "Art & Design", subCategory: "Painting", clients: 450, providers: 20, ratio: 4.0, volume: 120, gmv: 4800, demandLevel: "Medium", bubbleLabel: "VAN", left: "42%", top: "25%" },
  { city: "Chicago", country: "United States", category: "Academic", subCategory: "Math Tutoring", clients: 800, providers: 40, ratio: 5.0, volume: 210, gmv: 10500, demandLevel: "High demand", bubbleLabel: "CHI", left: "48%", top: "65%" },
  { city: "Montreal", country: "Canada", category: "Performing Arts", subCategory: "Dance", clients: 480, providers: 22, ratio: 4.3, volume: 130, gmv: 4200, demandLevel: "High demand", bubbleLabel: "MTL", left: "15%", top: "35%" },
  { city: "Houston", country: "United States", category: "Health & Wellness", subCategory: "Nutrition Coaching", clients: 520, providers: 26, ratio: 3.5, volume: 140, gmv: 5600, demandLevel: "Balanced", bubbleLabel: "HOU", left: "28%", top: "45%" },
  { city: "Calgary", country: "Canada", category: "Language", subCategory: "Swahili", clients: 600, providers: 30, ratio: 3.7, volume: 170, gmv: 6300, demandLevel: "High demand", bubbleLabel: "CAL", left: "51%", top: "47%" },
  { city: "San Francisco", country: "United States", category: "Business", subCategory: "Entrepreneurship", clients: 900, providers: 50, ratio: 6.0, volume: 250, gmv: 13500, demandLevel: "High demand", bubbleLabel: "SF", left: "56%", top: "41%" },
  { city: "Ottawa", country: "Canada", category: "Performing Arts", subCategory: "Dance Fitness", clients: 500, providers: 25, ratio: 4.0, volume: 150, gmv: 6000, demandLevel: "High demand", bubbleLabel: "OTT", left: "43%", top: "43%" },
  { city: "Seattle", country: "United States", category: "Health & Wellness", subCategory: "Spinning Classes", clients: 650, providers: 38, ratio: 3.8, volume: 200, gmv: 7800, demandLevel: "Medium", bubbleLabel: "SEA", left: "64%", top: "43%" },
  { city: "Edmonton", country: "Canada", category: "Academic", subCategory: "English Tutoring", clients: 680, providers: 34, ratio: 4.1, volume: 165, gmv: 8200, demandLevel: "High demand", bubbleLabel: "EDM", left: "60%", top: "37%" },
  { city: "Boston", country: "United States", category: "Technology", subCategory: "Coding Bootcamp", clients: 1200, providers: 48, ratio: 5.5, volume: 340, gmv: 18000, demandLevel: "High demand", bubbleLabel: "BOS", left: "68%", top: "43%" },
  { city: "Quebec City", country: "Canada", category: "General Cleaning", subCategory: "Office Cleaning", clients: 950, providers: 42, ratio: 4.9, volume: 310, gmv: 9500, demandLevel: "High demand", bubbleLabel: "QBC", left: "72%", top: "37%" }
];

const mockStats = [];
for (let i = 0; i < 100; i++) {
  const base = baseStats[i % baseStats.length];
  mockStats.push({
    id: `STA-${String(i + 1).padStart(3, "0")}`,
    city: base.city,
    country: base.country,
    category: base.category,
    subCategory: base.subCategory,
    clients: base.clients + (i * 2) % 30,
    providers: base.providers + (i % 5),
    ratio: parseFloat((base.ratio + (i % 4) * 0.1).toFixed(1)),
    volume: base.volume + (i % 10),
    gmv: base.gmv + (i % 20) * 100,
    demandLevel: base.demandLevel,
    bubbleLabel: base.bubbleLabel,
    left: base.left,
    top: base.top
  });
}

export default function UserStatsTab() {
  const [data, setData] = useState(mockStats);
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [mapView, setMapView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sorting state: "" (unsorted default), "desc", "asc"
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("desc");

  // Hover state for SVG bubble tooltips
  const [hoveredNode, setHoveredNode] = useState(null);

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const categoryDropdownRef = useRef(null);

  // Close category dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === "desc") {
        setSortDirection("asc");
      } else {
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
      return <span className="text-text-muted/50 ml-1">↓</span>;
    }
    return sortDirection === "asc"
      ? <span className="text-text-primary ml-1">↑</span>
      : <span className="text-text-primary ml-1">↓</span>;
  };

  // Filter lists
  const countries = ["All", ...Array.from(new Set(data.map(item => item.country)))];
  const cities = ["All", ...Array.from(new Set(
    (selectedCountry === "All" ? data : data.filter(item => item.country === selectedCountry))
      .map(item => item.city)
  ))];
  const categoriesOnly = Array.from(new Set(data.map(item => item.category)));

  // Map of category -> subcategories
  const subCategoriesByCategory = categoriesOnly.reduce((acc, cat) => {
    const subs = Array.from(new Set(
      data.filter(item => item.category === cat && item.subCategory)
        .map(item => item.subCategory)
    ));
    acc[cat] = subs;
    return acc;
  }, {});

  // Filter application
  const filtered = data.filter((item) => {
    const matchesCountry = selectedCountry === "All" || item.country === selectedCountry;
    const matchesCity = selectedCity === "All" || item.city === selectedCity;

    let matchesCategory = true;
    if (selectedCategory !== "All") {
      if (selectedCategory.startsWith("sub:")) {
        const subCatName = selectedCategory.substring(4);
        matchesCategory = item.subCategory === subCatName;
      } else {
        matchesCategory = item.category === selectedCategory;
      }
    }
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
    const headers = ["City", "Country", "Category", "Sub Category", "Clients", "Providers", "D/S Ratio", "Transaction Vol", "GMV"];
    const rows = filtered.map(item => `"${item.city}","${item.country}","${item.category}","${item.subCategory}",${item.clients},${item.providers},"${item.ratio}x",${item.volume},${item.gmv}`);
    exportCSV(headers, rows, `user_stats_${Date.now()}.csv`);
  };

  return (
    <div className="animate-scale-up font-onest text-xs text-text-primary">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center sm:justify-end justify-center gap-3 select-none p-4 w-full">

        {/* Country select */}
        <div className="relative">
          <select
            value={selectedCountry}
            onChange={(e) => {
              setSelectedCountry(e.target.value);
              setSelectedCity("All");
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

        {/* Category custom cascade select dropdown */}
        <div
          ref={categoryDropdownRef}
          className="relative"
        >
          <button
            type="button"
            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
            className="appearance-none bg-white border border-border-main text-xs rounded-full pl-3 pr-8 py-2 focus:outline-none text-text-muted hover:bg-page-bg/50 cursor-pointer min-w-22.5 text-left relative"
          >
            {selectedCategory === "All"
              ? "Category"
              : selectedCategory.startsWith("sub:")
                ? selectedCategory.substring(4)
                : selectedCategory}
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          </button>

          {categoryDropdownOpen && (
            <div
              onMouseLeave={() => setHoveredCategory(null)}
              className="absolute top-full right-0 mt-1.5 bg-white border border-border-main shadow-lg rounded-2xl p-1.5 z-50 flex animate-scale-up min-w-44"
            >
              {/* Main categories list */}
              <div className="flex flex-col gap-0.5 whitespace-nowrap min-w-36 text-left">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("All");
                    setCategoryDropdownOpen(false);
                    setCurrentPage(1);
                  }}
                  className={`text-left px-3 py-1.5 rounded-lg hover:bg-page-bg transition cursor-pointer text-xs font-normal ${selectedCategory === "All" ? "bg-page-bg font-medium text-primary-bg" : "text-text-primary"
                    }`}
                >
                  All Categories
                </button>
                {categoriesOnly.map((cat, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredCategory(cat)}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCategoryDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-page-bg transition cursor-pointer text-xs select-none ${selectedCategory === cat ? "bg-page-bg font-medium text-primary-bg" : "text-text-primary"
                      }`}
                  >
                    <span>{cat}</span>
                    {subCategoriesByCategory[cat] && subCategoriesByCategory[cat].length > 0 && (
                      <span className="text-[10px] text-text-muted pl-3 font-semibold">&gt;</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Side sub-menu on hover of a category */}
              {hoveredCategory && subCategoriesByCategory[hoveredCategory] && subCategoriesByCategory[hoveredCategory].length > 0 && (
                <div className="border-l border-border-main ml-1.5 pl-1.5 flex flex-col gap-0.5 min-w-40 justify-start animate-fade-in whitespace-nowrap text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(hoveredCategory);
                      setCategoryDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`text-left px-3 py-1.5 rounded-lg hover:bg-page-bg transition cursor-pointer text-xs font-semibold ${selectedCategory === hoveredCategory ? "bg-page-bg text-primary-bg" : "text-text-primary"
                      }`}
                  >
                    {hoveredCategory} (All)
                  </button>
                  {subCategoriesByCategory[hoveredCategory].map((sub, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(`sub:${sub}`);
                        setCategoryDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`text-left px-3 py-1.5 rounded-lg hover:bg-page-bg transition cursor-pointer text-xs font-normal ${selectedCategory === `sub:${sub}` ? "bg-page-bg text-primary-bg" : "text-text-muted"
                        }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map toggle */}
        <div className="p-2 border border-border-main rounded-full flex items-center gap-2">
          <span className="text-xs text-text-muted font-light">Map View</span>
          <button
            type="button"
            onClick={() => setMapView(!mapView)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${mapView ? "bg-primary-bg-muted" : "bg-secondary-bg"
              }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${mapView ? "translate-x-4" : "translate-x-0"
                }`}
            />
          </button>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-primary-bg hover:opacity-90 text-white font-medium text-xs py-3 px-4 rounded-lg transition cursor-pointer flex items-center gap-1.5"
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Interactive SVG map panel matching Screenshot 5 */}
      {mapView && (
        <div className="mx-4 mb-4 mt-2 bg-[#E6F3F5] border border-[#C5DFE2] rounded-3xl p-6 relative overflow-hidden select-none animate-fade-in h-80 flex items-center justify-center">

          {/* Render bubbles dynamically */}
          <div className="absolute inset-0 w-full h-full">
            {filtered.map((item) => {
              const isLagos = item.city === "Lagos";
              // Lagos has custom dark blue styling in Screenshot 5
              const bubbleClass = isLagos
                ? "bg-[#0F172A] text-white border-[3px] border-white hover:scale-105"
                : "bg-primary-bg-muted text-white border-[3px] border-white hover:scale-105 hover:bg-primary-bg/85";

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
            <div className="absolute top-4 right-4 z-20 w-48 bg-white/95 backdrop-blur-xs border border-border-main rounded-2xl shadow-xl p-3.5 space-y-2 animate-scale-up text-left">
              <div className="flex items-center gap-1.5 border-b border-border-main pb-1.5">
                <MapPin size={12} className="text-primary-bg" />
                <div>
                  <strong className="font-bold text-text-primary block leading-none">{hoveredNode.city}</strong>
                  <span className="text-[9px] text-text-muted font-light">{hoveredNode.country}</span>
                </div>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-text-muted font-light">Category:</span>
                  <span className="font-medium text-text-primary text-right max-w-22.5 truncate">{hoveredNode.category}</span>
                </div>
                {hoveredNode.subCategory && (
                  <div className="flex justify-between">
                    <span className="text-text-muted font-light">Sub Category:</span>
                    <span className="font-medium text-text-primary text-right max-w-22.5 truncate">{hoveredNode.subCategory}</span>
                  </div>
                )}
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
                  <span className="font-bold text-primary-bg">{hoveredNode.ratio}x</span>
                </div>
                <div className="flex justify-between border-t border-border-main/50 pt-1 mt-1 font-semibold text-text-primary">
                  <span>GMV:</span>
                  <span>${hoveredNode.gmv.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Legend block on bottom right matching Screenshot 5 */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-xs border border-border-main/60 rounded-xl px-3 ml-4 py-2 flex flex-wrap items-center gap-3 shadow-2xs text-xs text-text-primary">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>High demand</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-bg-muted" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F172A]" />
              <span>Balanced</span>
            </div>
            <div className="border-l border-border-main/60 ml-0.5 pl-2 text-text-muted font-light">
              Circle size = GMV
            </div>
          </div>

        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-bg text-left md:text-sm text-xs">
          <thead className="bg-secondary-bg text-text-primary md:text-sm text-xs">
            <tr>
              <th
                onClick={() => handleSort("city")}
                className="px-4 py-3 font-semibold cursor-pointer hover:bg-page-bg/60 select-none"
              >
                <div className="flex items-center gap-1">
                  City
                  {renderSortIcon("city")}
                </div>
              </th>
              <th
                onClick={() => handleSort("category")}
                className="px-4 py-3 font-semibold cursor-pointer hover:bg-page-bg/60 select-none"
              >
                <div className="flex items-center gap-1">
                  Category
                  {renderSortIcon("category")}
                </div>
              </th>
              <th
                onClick={() => handleSort("subCategory")}
                className="px-4 py-3 font-semibold cursor-pointer hover:bg-page-bg/60 select-none"
              >
                <div className="flex items-center gap-1">
                  Sub Category
                  {renderSortIcon("subCategory")}
                </div>
              </th>
              <th
                onClick={() => handleSort("clients")}
                className="px-4 py-3 font-semibold cursor-pointer hover:bg-page-bg/60 select-none"
              >
                <div className="flex items-center gap-1">
                  Clients
                  {renderSortIcon("clients")}
                </div>
              </th>
              <th
                onClick={() => handleSort("providers")}
                className="px-4 py-3 font-semibold cursor-pointer hover:bg-page-bg/60 select-none"
              >
                <div className="flex items-center gap-1">
                  Providers
                  {renderSortIcon("providers")}
                </div>
              </th>
              <th
                onClick={() => handleSort("ratio")}
                className="px-4 py-3 font-semibold cursor-pointer hover:bg-page-bg/60 select-none"
              >
                <div className="flex items-center gap-1">
                  D/S Ratio
                  {renderSortIcon("ratio")}
                </div>
              </th>
              <th
                onClick={() => handleSort("volume")}
                className="px-4 py-3 font-semibold cursor-pointer hover:bg-page-bg/60 select-none"
              >
                <div className="flex items-center gap-1">
                  Transaction Vol.
                  {renderSortIcon("volume")}
                </div>
              </th>
              <th
                onClick={() => handleSort("gmv")}
                className="px-4 py-3 font-semibold cursor-pointer hover:bg-page-bg/60 select-none"
              >
                <div className="flex items-center gap-1">
                  GMV
                  {renderSortIcon("gmv")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs text-text-primary">
            {paginated.map((item) => (
              <tr key={item.id} className="hover:bg-page-bg/50 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={20} className="text-text-primary shrink-0" />
                    <div>
                      <span className="block font-medium">{item.city}</span>
                      <span className="text-[10px] text-text-muted block mt-0.5">{item.country}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{item.category}</td>
                <td className="px-4 py-3">{item.subCategory || "—"}</td>
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
  );
}
