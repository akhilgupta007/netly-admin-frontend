"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileImage } from "lucide-react";
import { toast } from "react-toastify";

export default function AddCategoryModal({ isOpen, onClose, onAdd }) {
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
      } else {
        toast.error("Please drop an image file (.jpg, .png).");
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error("Category name is required.");
      return;
    }
    if (categoryName.length > 60) {
      toast.error("Category name cannot exceed 60 characters.");
      return;
    }

    onAdd({
      name: categoryName.trim(),
      description: description.trim(),
      hasPhoto: !!selectedFile,
      fileName: selectedFile ? selectedFile.name : null
    });

    setCategoryName("");
    setDescription("");
    setSelectedFile(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-border-main shadow-xl overflow-hidden flex flex-col animate-scale-up">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-main">
          <h3 className="font-semibold text-text-primary">Add Category</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs text-text-primary font-onest">

          {/* Category name input */}
          <div className="space-y-1">
            <label className="text-xs text-text-primary block">
              Category name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={60}
              placeholder="e.g., furniture..."
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full bg-white border border-border-main text-xs rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/60"
            />
            <span className="text-[10px] text-text-muted block mt-0.5">Max 60 characters</span>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs text-text-primary block">Description</label>
            <textarea
              placeholder="Optional"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-border-main text-xs rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/60 resize-none"
            />
          </div>

          {/* Drag & drop upload box */}
          <div className="space-y-1.5">
            <label className="text-xs text-text-primary block">Upload Image</label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerBrowse}
              className={`border-2 border-dashed rounded-lg p-6 text-center space-y-2 hover:bg-page-bg/40 transition cursor-pointer select-none relative ${dragActive ? "border-primary-bg bg-primary-bg/5" : "border-border-main bg-white"
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center justify-center text-center space-y-1">
                  <FileImage size={24} className="text-primary-bg" />
                  <span className="text-xs font-semibold text-text-primary max-w-62.5 truncate block">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-text-muted font-light">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB - Click to change
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center space-y-1">
                  <div className="w-8 h-8 rounded-full bg-page-bg flex items-center justify-center text-text-primary mb-1">
                    <Upload size={14} className="text-text-muted" />
                  </div>
                  <strong className="text-xs font-semibold text-text-primary flex items-center gap-1.5 justify-center">
                    Upload image
                  </strong>
                  <span className="text-[10px] text-text-muted font-light block">
                    Drag & drop a file here or <span className="text-primary-bg font-medium underline">Browse</span>
                  </span>
                  <span className="text-[9px] text-text-muted/75 font-light block">
                    .jpg, .png (max 2 GB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons footer */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-secondary-bg hover:bg-page-bg text-text-primary font-medium text-xs py-2.5 rounded-lg transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary-bg hover:bg-primary-bg-muted text-white font-medium text-xs py-2.5 rounded-lg transition cursor-pointer text-center shadow-2xs"
            >
              Add Category
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
