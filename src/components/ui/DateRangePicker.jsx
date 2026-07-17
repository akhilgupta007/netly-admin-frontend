"use client";

import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

export default function DateRangePicker({ startDate, endDate, onChange, isWeekView }) {
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showMonthYearSelector, setShowMonthYearSelector] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(
    startDate ? new Date(startDate) : new Date(2026, 6, 1)
  );

  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    if (startDate) {
      setCurrentCalendarDate(new Date(startDate));
    }
  }, [startDate, endDate]);

  // Sync temp dates with applied dates when opening calendar
  const toggleCalendar = () => {
    if (!calendarOpen) {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      setShowMonthYearSelector(false);
      if (startDate) {
        setCurrentCalendarDate(new Date(startDate));
      }
    }
    setCalendarOpen(!calendarOpen);
  };

  const handleApply = () => {
    if (tempStartDate) {
      if (isWeekView) {
        const day = tempStartDate.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const monday = new Date(tempStartDate);
        monday.setDate(tempStartDate.getDate() + diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        onChange(monday, sunday);
      } else {
        const end = tempEndDate || tempStartDate;
        onChange(tempStartDate, end);
      }
    } else {
      onChange(null, null);
    }
    setCalendarOpen(false);
  };

  const handleReset = () => {
    if (isWeekView) {
      const { monday, sunday } = getMondayAndSunday(new Date());
      setTempStartDate(monday);
      setTempEndDate(sunday);
      onChange(monday, sunday);
    } else {
      setTempStartDate(null);
      setTempEndDate(null);
      onChange(null, null);
    }
    setCalendarOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleCalendar}
        className="border border-border-main text-xs rounded-full px-4 py-2.5 text-text-muted cursor-pointer flex items-center gap-1.5 bg-white hover:bg-page-bg transition select-none"
      >
        {startDate ? (
          endDate ? (
            `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          ) : (
            `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ...`
          )
        ) : (
          "Date Range"
        )}
        <Calendar size={13} className="text-text-muted" />
      </button>

      {calendarOpen && (
        <div className="absolute right-0 top-12 mt-1 z-50 bg-white border border-secondary-bg p-4 rounded-2xl shadow-xl w-72 select-none">
          {showMonthYearSelector ? (
            <div>
              {/* Selector Title Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-text-primary">
                  Select Month & Year
                </span>
                <button
                  onClick={() => setShowMonthYearSelector(false)}
                  className="text-[10px] text-primary-bg hover:underline font-semibold cursor-pointer"
                >
                  Back to Days
                </button>
              </div>

              {/* Side-by-side columns selection */}
              <div className="grid grid-cols-2 gap-2 h-40">
                {/* Month selection column */}
                <div className="overflow-y-auto space-y-1 pr-1 border-r border-secondary-bg scrollbar-thin">
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((mName, mIdx) => {
                    const isSelected = currentCalendarDate.getMonth() === mIdx;
                    return (
                      <button
                        key={mName}
                        onClick={() => {
                          setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), mIdx, 1));
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                          isSelected 
                            ? "bg-primary-bg text-white font-bold" 
                            : "hover:bg-page-bg text-text-primary"
                        }`}
                      >
                        {mName}
                      </button>
                    );
                  })}
                </div>

                {/* Year selection column */}
                <div className="overflow-y-auto space-y-1 pl-1 scrollbar-thin">
                  {Array.from({ length: 50 }, (_, idx) => 2000 + idx).map((yearVal) => {
                    const isSelected = currentCalendarDate.getFullYear() === yearVal;
                    return (
                      <button
                        key={yearVal}
                        onClick={() => {
                          setCurrentCalendarDate(new Date(yearVal, currentCalendarDate.getMonth(), 1));
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                          isSelected 
                            ? "bg-primary-bg text-white font-bold" 
                            : "hover:bg-page-bg text-text-primary"
                        }`}
                      >
                        {yearVal}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom done action */}
              <div className="flex justify-end mt-4 pt-3 border-t border-secondary-bg">
                <button
                  onClick={() => setShowMonthYearSelector(false)}
                  className="bg-primary-bg text-white hover:opacity-90 px-4 py-1.5 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                >
                  OK
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Calendar Month Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
                  }}
                  className="p-1 hover:bg-page-bg rounded-lg text-text-primary text-xs font-bold"
                >
                  &larr;
                </button>
                <span 
                  onClick={() => setShowMonthYearSelector(true)}
                  className="text-xs font-bold text-text-primary cursor-pointer hover:text-primary-bg transition"
                >
                  {currentCalendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <button
                  onClick={() => {
                    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));
                  }}
                  className="p-1 hover:bg-page-bg rounded-lg text-text-primary text-xs font-bold"
                >
                  &rarr;
                </button>
              </div>

              {/* Weekday Names Row */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-text-muted mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Empty padding cells for start of month */}
                {Array.from({ length: new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1).getDay() }).map((_, i) => (
                  <span key={`empty-${i}`} className="w-8 h-8" />
                ))}
                
                {/* Days of Month */}
                {Array.from({ length: new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                  const dayNumber = i + 1;
                  const thisDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), dayNumber);
                  
                  const isStart = tempStartDate && thisDate.toDateString() === tempStartDate.toDateString();
                  const isEnd = tempEndDate && thisDate.toDateString() === tempEndDate.toDateString();
                  const isBetween = tempStartDate && tempEndDate && thisDate > tempStartDate && thisDate < tempEndDate;
                  
                  const today = new Date();
                  today.setHours(23, 59, 59, 999);
                  
                  let isFuture = thisDate > today;
                  if (isWeekView) {
                    const end = new Date(thisDate);
                    end.setDate(end.getDate() + 6);
                    if (end > today) {
                      isFuture = true;
                    }
                  }

                  return (
                    <button
                      key={dayNumber}
                      disabled={isFuture}
                      onClick={() => {
                        if (isFuture) return;
                        if (isWeekView) {
                          const day = thisDate.getDay();
                          const diffToMonday = day === 0 ? -6 : 1 - day;
                          const monday = new Date(thisDate);
                          monday.setDate(thisDate.getDate() + diffToMonday);
                          const sunday = new Date(monday);
                          sunday.setDate(monday.getDate() + 6);
                          setTempStartDate(monday);
                          setTempEndDate(sunday);
                        } else {
                          if (!tempStartDate || (tempStartDate && tempEndDate)) {
                            setTempStartDate(thisDate);
                            setTempEndDate(null);
                          } else if (tempStartDate && !tempEndDate) {
                            if (thisDate < tempStartDate) {
                              setTempStartDate(thisDate);
                            } else {
                              setTempEndDate(thisDate);
                            }
                          }
                        }
                      }}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium cursor-pointer transition ${
                        isFuture
                          ? "opacity-30 cursor-not-allowed pointer-events-none text-text-muted/40"
                          : isStart || isEnd
                          ? "bg-primary-bg text-white font-bold animate-scale-up"
                          : isBetween
                          ? "bg-primary-bg/10 text-primary-bg rounded-none"
                          : "hover:bg-page-bg text-text-primary"
                      }`}
                    >
                      {dayNumber}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Reset & Close */}
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-secondary-bg">
                <button
                  onClick={handleReset}
                  className="text-[10px] text-text-muted hover:text-rose-500 font-semibold cursor-pointer"
                >
                  Reset
                </button>
                <button
                  onClick={handleApply}
                  className="bg-primary-bg text-white hover:opacity-90 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
