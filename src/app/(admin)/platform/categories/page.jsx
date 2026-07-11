"use client";

import React, { useState, useEffect } from "react";
import { Image as ImageIcon, ChevronRight, ChevronDown, PlusCircle, Check } from "lucide-react";
import { toast } from "react-toastify";
import AddCategoryModal from "@/components/platform/AddCategoryModal";
import AddSubServiceModal from "@/components/platform/AddSubServiceModal";
import ConfirmDeactivationModal from "@/components/platform/ConfirmDeactivationModal";

// Initial Mock Categories matching Screenshot 4
const initialCategories = [
  {
    id: "CAT-001",
    name: "Home Cleaning",
    active: true,
    bookings: 412,
    listingsCount: 294,
    hasPhoto: true,
    subServices: [
      { id: "SUB-001", name: "Deep Cleaning", active: true, bookings: 189, listingsCount: 45, hasPhoto: true },
      { id: "SUB-002", name: "Window Washing", active: true, bookings: 120, listingsCount: 32, hasPhoto: true },
      { id: "SUB-003", name: "Carpet Shampooing", active: true, bookings: 250, listingsCount: 55, hasPhoto: true },
      { id: "SUB-004", name: "Pressure Washing", active: true, bookings: 300, listingsCount: 40, hasPhoto: true },
      { id: "SUB-005", name: "Post-Construction Cleanup", active: true, bookings: 450, listingsCount: 67, hasPhoto: true },
      { id: "SUB-006", name: "Office Sanitization", active: true, bookings: 200, listingsCount: 25, hasPhoto: true },
      { id: "SUB-007", name: "Carpet Steam Cleaning", active: true, bookings: 200, listingsCount: 30, hasPhoto: true }
    ]
  },
  {
    id: "CAT-002",
    name: "Office & Commercial",
    active: true,
    bookings: 231,
    listingsCount: 80,
    hasPhoto: true,
    subServices: [
      { id: "SUB-008", name: "Janitorial Services", active: true, bookings: 131, listingsCount: 50, hasPhoto: true },
      { id: "SUB-009", name: "Floor Buffing", active: true, bookings: 100, listingsCount: 30, hasPhoto: true }
    ]
  }
];

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState([]);
  
  // Accordion open/close map
  const [expandedCats, setExpandedCats] = useState({ "CAT-001": true });

  // Modals controls
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [subServiceModalOpen, setSubServiceModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  
  // Pending deactivation entity state
  const [pendingDeactivation, setPendingDeactivation] = useState(null);

  // Inline editing row state
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingName, setEditingName] = useState("");

  // Load from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("netly_service_categories");
    if (stored) {
      try {
        setCategories(JSON.parse(stored));
      } catch (e) {
        setCategories(initialCategories);
      }
    } else {
      setCategories(initialCategories);
      localStorage.setItem("netly_service_categories", JSON.stringify(initialCategories));
    }
  }, []);

  const saveCategories = (updatedList) => {
    setCategories(updatedList);
    localStorage.setItem("netly_service_categories", JSON.stringify(updatedList));
  };

  const handleToggleExpand = (catId) => {
    setExpandedCats(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Add category callback
  const handleAddCategory = (data) => {
    const newCat = {
      id: `CAT-${Date.now()}`,
      name: data.name,
      active: true,
      bookings: 0,
      hasPhoto: data.hasPhoto,
      subServices: []
    };
    const updated = [...categories, newCat];
    saveCategories(updated);
    setCategoryModalOpen(false);
    toast.success(`Category "${data.name}" added successfully.`);
  };

  // Add sub service callback
  const handleAddSubService = (data) => {
    const newSub = {
      id: `SUB-${Date.now()}`,
      name: data.name,
      active: true,
      bookings: 0,
      hasPhoto: data.hasPhoto
    };
    const updated = categories.map((cat) => {
      if (cat.name === data.parentName) {
        return {
          ...cat,
          subServices: [...cat.subServices, newSub]
        };
      }
      return cat;
    });
    saveCategories(updated);
    setSubServiceModalOpen(false);
    toast.success(`Sub-service "${data.name}" added under ${data.parentName}.`);
  };

  // Active status toggle switches
  const handleToggleClick = (item, isParent, parentId) => {
    if (item.active) {
      // Toggle OFF prompts confirmation warning modal
      setPendingDeactivation({ item, isParent, parentId });
      setDeactivateModalOpen(true);
    } else {
      // Toggle ON directly activates
      const updated = categories.map((cat) => {
        if (isParent && cat.id === item.id) {
          return { ...cat, active: true };
        } else if (!isParent && cat.id === parentId) {
          return {
            ...cat,
            subServices: cat.subServices.map((sub) =>
              sub.id === item.id ? { ...sub, active: true } : sub
            )
          };
        }
        return cat;
      });
      saveCategories(updated);
      toast.success(`"${item.name}" has been activated.`);
    }
  };

  const confirmDeactivation = ({ item, isParent, parentId }) => {
    const updated = categories.map((cat) => {
      if (isParent && cat.id === item.id) {
        return { ...cat, active: false };
      } else if (!isParent && cat.id === parentId) {
        return {
          ...cat,
          subServices: cat.subServices.map((sub) =>
            sub.id === item.id ? { ...sub, active: false } : sub
          )
        };
      }
      return cat;
    });
    saveCategories(updated);
    setDeactivateModalOpen(false);
    setPendingDeactivation(null);
    toast.success(`"${item.name}" deactivation confirmed.`);
  };

  // Inline rename editors
  const startEditing = (item) => {
    setEditingRowId(item.id);
    setEditingName(item.name);
  };

  const handleSaveRename = (item, isParent, parentId) => {
    if (!editingName.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    const updated = categories.map((cat) => {
      if (isParent && cat.id === item.id) {
        return { ...cat, name: editingName.trim() };
      } else if (!isParent && cat.id === parentId) {
        return {
          ...cat,
          subServices: cat.subServices.map((sub) =>
            sub.id === item.id ? { ...sub, name: editingName.trim() } : sub
          )
        };
      }
      return cat;
    });

    saveCategories(updated);
    setEditingRowId(null);
    toast.success("Name updated successfully.");
  };

  return (
    <div className="space-y-4 font-onest animate-scale-up">

      {/* Top Header Controls bar */}
      <div className="flex justify-end items-center gap-2">
        <button
          onClick={() => setSubServiceModalOpen(true)}
          className="border border-[#6FB5BD] hover:bg-[#6FB5BD]/5 text-[#6FB5BD] font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer select-none flex items-center gap-1.5 bg-white"
        >
          + Add Sub Service
        </button>
        <button
          onClick={() => setCategoryModalOpen(true)}
          className="bg-[#6FB5BD] hover:bg-[#5da0a8] text-white font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer select-none flex items-center gap-1.5 shadow-2xs"
        >
          + Add Category
        </button>
      </div>

      {/* Accordion Table Card */}
      <div className="bg-white border border-secondary-bg rounded-3xl overflow-hidden shadow-2xs">
        
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-4 select-none bg-white">
            <img src="/empty.png" alt="No categories" className="w-16 h-16 object-contain opacity-75 animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No categories added yet</h3>
              <p className="text-xs text-text-muted font-light">Create categories and sub categories to help users find services easily.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto select-none">
            <table className="min-w-full divide-y divide-secondary-bg text-sm tracking-tight">
              <thead className="bg-secondary-bg text-text-primary text-left text-sm">
                <tr>
                  <th className="px-4 py-3 font-semibold w-1/3">Category / Sub-service</th>
                  <th className="px-4 py-3 font-semibold text-center w-24">Photo</th>
                  <th className="px-4 py-3 font-semibold text-center w-24">Active</th>
                  <th className="px-4 py-3 font-semibold text-center w-32">Bookings (30d)</th>
                  <th className="px-4 py-3 font-semibold text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-bg text-sm text-text-primary">
                {categories.map((cat) => {
                  const isExpanded = !!expandedCats[cat.id];
                  const isCatEditing = editingRowId === cat.id;

                  return (
                    <React.Fragment key={cat.id}>
                      {/* Parent Category Row */}
                      <tr className={`hover:bg-page-bg/40 transition-colors ${!cat.active ? "opacity-60" : ""}`}>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <button
                            onClick={() => handleToggleExpand(cat.id)}
                            className="w-5 h-5 flex items-center justify-center hover:bg-secondary-bg/60 rounded transition cursor-pointer text-text-muted"
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>

                          {isCatEditing ? (
                            <div className="flex items-center gap-2 animate-scale-up">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="border border-secondary-bg rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-bg text-xs text-text-primary"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveRename(cat, true, null)}
                                className="text-[#6FB5BD] hover:underline font-semibold cursor-pointer text-[10px]"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingRowId(null)}
                                className="text-text-muted hover:underline font-semibold cursor-pointer text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="font-semibold">{cat.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex w-7 h-7 bg-page-bg/40 border border-secondary-bg/50 rounded-lg items-center justify-center">
                            <ImageIcon size={13} className="text-text-muted" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {/* Switch toggle slider */}
                          <button
                            type="button"
                            onClick={() => handleToggleClick(cat, true, null)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              cat.active ? "bg-[#6FB5BD]" : "bg-secondary-bg"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                cat.active ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center font-bold">
                          {cat.bookings}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isCatEditing ? (
                            <button
                              className="border border-text-primary text-text-primary font-semibold text-[10px] py-1.25 px-3.5 rounded-lg select-none"
                            >
                              Edit
                            </button>
                          ) : (
                            <button
                              onClick={() => startEditing(cat)}
                              className="border border-secondary-bg hover:bg-page-bg text-text-muted hover:text-text-primary font-semibold text-[10px] py-1.25 px-3.5 rounded-lg transition cursor-pointer select-none"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Sub-services Child Rows */}
                      {isExpanded && cat.subServices && cat.subServices.map((sub) => {
                        const isSubEditing = editingRowId === sub.id;

                        return (
                          <tr key={sub.id} className={`bg-white hover:bg-page-bg/30 transition-colors border-t border-secondary-bg/25 ${
                            (!sub.active || !cat.active) ? "opacity-60" : ""
                          }`}>
                            <td className="px-4 py-3 flex items-center pl-10 gap-2">
                              <span className="text-text-muted/40 font-light select-none mr-1">—</span>
                              {isSubEditing ? (
                                <div className="flex items-center gap-2 animate-scale-up">
                                  <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="border border-secondary-bg rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-bg text-xs text-text-primary bg-white"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveRename(sub, false, cat.id)}
                                    className="text-[#6FB5BD] hover:underline font-semibold cursor-pointer text-[10px]"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingRowId(null)}
                                    className="text-text-muted hover:underline font-semibold cursor-pointer text-[10px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <span>{sub.name}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="inline-flex w-7 h-7 bg-page-bg/40 border border-secondary-bg/50 rounded-lg items-center justify-center bg-white">
                                <ImageIcon size={13} className="text-text-muted" />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {/* Switch toggle slider */}
                              <button
                                type="button"
                                disabled={!cat.active}
                                onClick={() => handleToggleClick(sub, false, cat.id)}
                                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  sub.active && cat.active ? "bg-[#6FB5BD]" : "bg-secondary-bg"
                                } ${!cat.active ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                    sub.active && cat.active ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {sub.bookings}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {isSubEditing ? (
                                <button
                                  className="border border-text-primary text-text-primary font-semibold text-[10px] py-1.25 px-3.5 rounded-lg select-none bg-white"
                                >
                                  Edit
                                </button>
                              ) : (
                                <button
                                  disabled={!cat.active}
                                  onClick={() => startEditing(sub)}
                                  className="border border-secondary-bg hover:bg-page-bg text-text-muted hover:text-text-primary font-semibold text-[10px] py-1.25 px-3.5 rounded-lg transition select-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white"
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog Modals */}
      <AddCategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onAdd={handleAddCategory}
      />

      <AddSubServiceModal
        parentCategories={categories}
        isOpen={subServiceModalOpen}
        onClose={() => setSubServiceModalOpen(false)}
        onAdd={handleAddSubService}
      />

      {pendingDeactivation && (
        <ConfirmDeactivationModal
          isOpen={deactivateModalOpen}
          item={pendingDeactivation.item}
          count={pendingDeactivation.item.listingsCount}
          onClose={() => {
            setDeactivateModalOpen(false);
            setPendingDeactivation(null);
          }}
          onConfirm={confirmDeactivation}
        />
      )}

    </div>
  );
}
