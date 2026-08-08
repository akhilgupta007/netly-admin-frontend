"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCategories } from "@/hooks/useCatalogue";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createSubCategory,
  updateSubCategory,
} from "@/lib/callables";
import { ListSkeleton, RefreshingBar } from "@/components/ui/Skeleton";
import ImagePreviewModal from "@/components/platform/ImagePreviewModal";
import {
  Image as ImageIcon,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  Check,
  Plus,
} from "lucide-react";
import { toast } from "react-toastify";
import AddCategoryModal from "@/components/platform/AddCategoryModal";
import AddSubServiceModal from "@/components/platform/AddSubServiceModal";
import ConfirmDeactivationModal from "@/components/platform/ConfirmDeactivationModal";

// Initial Mock Categories matching Screenshot 4

export default function ServiceCategoriesPage() {
  const queryClient = useQueryClient();
  const { categories, isLoading, isFetching, isError } = useCategories();

  /** Refetches the catalogue and reports the outcome. */
  const afterWrite = (message) => ({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(message);
    },
    // The backend returns purposeful messages — how many listings block a
    // delete, which name clashes — so they are shown rather than replaced.
    onError: (err) => toast.error(err.message),
  });

  const addCategory = useMutation({
    mutationFn: createCategory,
    ...afterWrite("Category added."),
  });
  const editCategory = useMutation({
    mutationFn: updateCategory,
    ...afterWrite("Category updated."),
  });
  const removeCategory = useMutation({
    mutationFn: deleteCategory,
    ...afterWrite("Category deleted."),
  });
  const addSubService = useMutation({
    mutationFn: createSubCategory,
    ...afterWrite("Sub-service added."),
  });
  const editSubService = useMutation({
    mutationFn: updateSubCategory,
    ...afterWrite("Sub-service updated."),
  });

  const [preview, setPreview] = useState(null);

  /**
   * Opens the image preview.
   * @param {string} src - Image URL.
   * @param {string} name - Category or sub-service name.
   * @param {string} parent - Owning category, for sub-services.
   */
  const openPreview = (src, name, parent) => {
    if (!src) return;
    setPreview({ src, title: name, subtitle: parent ? `in ${parent}` : "" });
  };

  const busy =
    addCategory.isPending ||
    editCategory.isPending ||
    removeCategory.isPending ||
    addSubService.isPending ||
    editSubService.isPending;

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

  const handleToggleExpand = (catId) => {
    setExpandedCats((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Add category callback
  const handleAddCategory = (data) => {
    addCategory.mutate(
      {
        name: data.name,
        frenchName: data.frenchName,
        image: data.image || undefined,
      },
      { onSuccess: () => setCategoryModalOpen(false) },
    );
  };

  const handleAddSubService = (data) => {
    // The modal identifies the parent by name; the backend needs its id.
    const parent = categories.find((c) => c.name === data.parentName);
    if (!parent) {
      toast.error("Pick a parent category first.");
      return;
    }
    addSubService.mutate(
      {
        categoryId: parent.id,
        name: data.name,
        frenchName: data.frenchName,
        message: data.message || undefined,
        image: data.image || undefined,
      },
      { onSuccess: () => setSubServiceModalOpen(false) },
    );
  };

  const handleToggleClick = (item, isParent, parentId) => {
    // Turning something off hides it from clients, so it is confirmed first.
    if (item.active) {
      setPendingDeactivation({ item, isParent, parentId });
      setDeactivateModalOpen(true);
      return;
    }
    setActive(item, isParent, parentId, true);
  };

  /**
   * Activates or deactivates a category or sub-service.
   * @param {object} item - The row.
   * @param {boolean} isParent - True for a category.
   * @param {string} parentId - Owning category id, for sub-services.
   * @param {boolean} isActive - Desired state.
   */
  const setActive = (item, isParent, parentId, isActive) => {
    if (isParent) {
      editCategory.mutate({ categoryId: item.id, isActive });
    } else {
      editSubService.mutate({
        categoryId: parentId,
        subCategoryName: item.name,
        isActive,
      });
    }
  };

  const confirmDeactivation = () => {
    // The modal calls onConfirm(item) with the row only, so the parent context
    // comes from pendingDeactivation, which handleToggleClick already stored.
    if (!pendingDeactivation) return;
    const { item, isParent, parentId } = pendingDeactivation;
    setActive(item, isParent, parentId, false);
    setDeactivateModalOpen(false);
    setPendingDeactivation(null);
  };

  // Inline rename editors
  const startEditing = (item) => {
    setEditingRowId(item.id);
    setEditingName(item.name);
  };

  const handleSaveRename = (item, isParent, parentId) => {
    const name = editingName.trim();
    if (!name) {
      toast.error("Name cannot be empty.");
      return;
    }
    if (name === item.name) {
      setEditingRowId(null);
      return;
    }

    // A rename also rewrites the denormalised name on every listing that
    // points here, which the backend handles and reports back.
    const done = { onSuccess: () => setEditingRowId(null) };
    if (isParent) {
      editCategory.mutate({ categoryId: item.id, name }, done);
    } else {
      editSubService.mutate(
        { categoryId: parentId, subCategoryName: item.name, name },
        done,
      );
    }
  };

  return (
    <div className="space-y-4 font-onest animate-scale-up">
      <div className="flex justify-end items-center gap-2">
        <button
          onClick={() => setSubServiceModalOpen(true)}
          className="border border-border-main hover:bg-secondary-bg text-primary-bg font-medium text-sm py-2 px-4 rounded-lg transition cursor-pointer select-none flex items-center gap-1.5 bg-white"
        >
          <Plus size={16} /> Add Sub Service
        </button>
        <button
          onClick={() => setCategoryModalOpen(true)}
          className="bg-primary-bg hover:bg-primary-bg-muted text-white font-medium text-sm py-2 px-4 rounded-lg transition cursor-pointer select-none flex items-center gap-1.5 shadow-2xs"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Accordion Table Card */}
      <div className="bg-white border border-border-main rounded-3xl overflow-hidden shadow-2xs relative">
        <RefreshingBar active={isFetching && !isLoading} />

        {isLoading ? (
          <ListSkeleton rows={6} columns={5} firstColAvatar={false} />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-2 select-none bg-white">
            <h3 className="text-sm font-semibold text-text-primary">
              Could not load the catalogue
            </h3>
            <p className="text-xs text-text-muted font-light">
              Check your connection and refresh. Categories are read directly
              from Firestore.
            </p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center space-y-4 select-none bg-white">
            <img
              src="/empty.png"
              alt="No categories"
              className="w-16 h-16 object-contain opacity-75 animate-pulse"
            />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">
                No categories added yet
              </h3>
              <p className="text-xs text-text-muted font-light">
                Create categories and sub categories to help users find services
                easily.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto select-none">
            <table className="min-w-full divide-y divide-secondary-bg md:text-sm text-xs tracking-tight">
              <thead className="bg-secondary-bg text-text-primary text-left md:text-sm text-xs">
                <tr>
                  <th className="px-4 py-3 font-semibold w-1/3">
                    Category / Sub-service
                  </th>
                  <th className="px-4 py-3 font-semibold text-center w-24">
                    Photo
                  </th>
                  <th className="px-4 py-3 font-semibold text-center w-24">
                    Active
                  </th>
                  <th className="px-4 py-3 font-semibold text-center w-28">
                    Bookings
                  </th>
                  <th className="px-4 py-3 font-semibold text-center w-28">
                    Listings
                  </th>
                  <th className="px-4 py-3 font-semibold text-right w-28">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-bg md:text-sm text-xs text-text-primary">
                {categories.map((cat) => {
                  const isExpanded = !!expandedCats[cat.id];
                  const isCatEditing = editingRowId === cat.id;

                  return (
                    <React.Fragment key={cat.id}>
                      {/* Parent Category Row */}
                      <tr
                        className={`hover:bg-page-bg/40 transition-colors ${!cat.active ? "opacity-60" : ""}`}
                      >
                        <td className="px-4 py-3 flex items-center gap-2">
                          <button
                            onClick={() => handleToggleExpand(cat.id)}
                            className="flex items-center justify-center hover:bg-secondary-bg/60 rounded transition cursor-pointer text-text-muted"
                          >
                            {isExpanded ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                          </button>

                          {isCatEditing ? (
                            <div className="flex items-center gap-2 animate-scale-up">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="border border-border-main rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-bg text-xs text-text-primary"
                                autoFocus
                              />
                              <button
                                onClick={() =>
                                  handleSaveRename(cat, true, null)
                                }
                                className="text-primary-bg font-semibold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingRowId(null)}
                                className="text-text-muted font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="font-semibold">{cat.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => openPreview(cat.image, cat.name)}
                            disabled={!cat.image}
                            title={cat.image ? "View image" : "No image uploaded"}
                            className="inline-flex p-1 border border-border-main rounded-lg items-center justify-center hover:border-primary-bg transition disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                          >
                            {cat.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-6 h-6 object-cover rounded"
                              />
                            ) : (
                              <ImageIcon size={18} className="text-text-muted" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {/* Switch toggle slider */}
                          <button
                            type="button"
                            onClick={() => handleToggleClick(cat, true, null)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              cat.active
                                ? "bg-primary-bg-muted"
                                : "bg-secondary-bg"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                cat.active ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-lg">
                          {cat.bookings}
                        </td>
                        <td
                          className="px-4 py-3 text-center"
                          title={
                            cat.listingsCount > 0
                              ? `${cat.listingsCount} provider listing(s) use this — it cannot be deleted until they are moved.`
                              : "No listings use this, so it can be deleted."
                          }
                        >
                          {cat.listingsCount}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isCatEditing ? (
                            <button className="border border-text-primary text-text-primary font-medium py-1.25 px-3.5 rounded-xl select-none bg-white">
                              Edit
                            </button>
                          ) : (
                            <button
                              disabled={!cat.active}
                              onClick={() => startEditing(cat)}
                              className="border border-primary-bg hover:bg-primary-bg-muted/20 text-primary-bg font-medium py-1.25 px-3.5 rounded-xl transition select-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Sub-services Child Rows */}
                      {isExpanded &&
                        cat.subServices &&
                        cat.subServices.map((sub) => {
                          const isSubEditing = editingRowId === sub.id;

                          return (
                            <tr
                              key={sub.id}
                              className={`bg-page-bg/70 hover:bg-page-bg transition-colors border-t border-border-main/25 ${
                                !sub.active || !cat.active ? "opacity-60" : ""
                              }`}
                            >
                              <td className="px-4 py-3 flex items-center pl-10 gap-2">
                                <span className="font-light select-none mr-1">
                                  —
                                </span>
                                {isSubEditing ? (
                                  <div className="flex items-center gap-2 animate-scale-up">
                                    <input
                                      type="text"
                                      value={editingName}
                                      onChange={(e) =>
                                        setEditingName(e.target.value)
                                      }
                                      className="border border-border-main rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-bg text-xs text-text-primary bg-white"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() =>
                                        handleSaveRename(sub, false, cat.id)
                                      }
                                      className="text-primary-bg font-semibold cursor-pointer"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingRowId(null)}
                                      className="text-text-muted font-semibold cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <span>{sub.name}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => openPreview(sub.image, sub.name, cat.name)}
                                  disabled={!sub.image}
                                  title={sub.image ? "View image" : "No image uploaded"}
                                  className="inline-flex p-1 border border-border-main rounded-lg items-center justify-center hover:border-primary-bg transition disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                                >
                                  {sub.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={sub.image}
                                      alt={sub.name}
                                      className="w-6 h-6 object-cover rounded"
                                    />
                                  ) : (
                                    <ImageIcon size={18} className="text-text-muted" />
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {/* Switch toggle slider */}
                                <button
                                  type="button"
                                  disabled={!cat.active}
                                  onClick={() =>
                                    handleToggleClick(sub, false, cat.id)
                                  }
                                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    sub.active && cat.active
                                      ? "bg-primary-bg-muted"
                                      : "bg-secondary-bg"
                                  } ${!cat.active ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                      sub.active && cat.active
                                        ? "translate-x-4"
                                        : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {sub.bookings}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {sub.listingsCount}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isSubEditing ? (
                                  <button className="border border-text-primary text-text-primary font-medium py-1.25 px-3.5 rounded-xl select-none bg-white">
                                    Edit
                                  </button>
                                ) : (
                                  <button
                                    disabled={!cat.active}
                                    onClick={() => startEditing(sub)}
                                    className="border border-primary-bg hover:bg-primary-bg-muted/20 text-primary-bg font-medium py-1.25 px-3.5 rounded-xl transition select-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white"
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

      <ImagePreviewModal
        isOpen={Boolean(preview)}
        onClose={() => setPreview(null)}
        src={preview?.src}
        title={preview?.title}
        subtitle={preview?.subtitle}
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
