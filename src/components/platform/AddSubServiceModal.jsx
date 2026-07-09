"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileImage, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

export default function AddSubServiceModal({ parentCategories, isOpen, onClose, onAdd }) {
  const [parentName, setParentName] = useState("");
  const [subServiceName, setSubServiceName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Set default parent if list is non-empty and parentName is empty
  if (parentCategories && parentCategories.length > 0 && !parentName) {
    setParentName(parentCategories[0].name);
  }

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
    if (!parentName) {
      toast.error("Parent category is required.");
      return;
    }
    if (!subServiceName.trim()) {
      toast.error("Sub Service name is required.");
      return;
    }

    onAdd({
      parentName,
      name: subServiceName.trim(),
      hasPhoto: !!selectedFile,
      fileName: selectedFile ? selectedFile.name : null
    });

    setSubServiceName("");
    setSelectedFile(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-alt-bg/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-secondary-bg shadow-xl overflow-hidden flex flex-col animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-bg">
          <h3 className="text-sm font-semibold text-text-primary">Add Sub-service</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-page-bg transition cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-text-primary font-onest">
          
          {/* Parent category selector */}
          <div className="space-y-1">
            <label className="text-xs text-text-primary block font-medium">
              Parent Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary appearance-none cursor-pointer"
              >
                {parentCategories && parentCategories.map((cat, idx) => (
                  <option key={idx} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-text-muted pointer-events-none" />
            </div>
          </div>

          {/* Sub Service name input */}
          <div className="space-y-1">
            <label className="text-xs text-text-primary block font-medium">
              Sub Service name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., oven deep clean..."
              value={subServiceName}
              onChange={(e) => setSubServiceName(e.target.value)}
              className="w-full bg-white border border-secondary-bg text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-bg text-text-primary placeholder:text-text-muted/60"
            />
          </div>

          {/* Drag & drop upload box */}
          <div className="space-y-1.5">
            <label className="text-xs text-text-primary block font-medium">Upload Image</label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerBrowse}
              className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-2 hover:bg-page-bg/40 transition cursor-pointer select-none relative ${
                dragActive ? "border-[#6FB5BD] bg-[#6FB5BD]/5" : "border-secondary-bg bg-white"
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
                  <FileImage size={24} className="text-[#6FB5BD]" />
                  <span className="text-xs font-semibold text-text-primary max-w-[250px] truncate block">
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
                    Drag & drop a file here or <span className="text-[#6FB5BD] font-medium underline">Browse</span>
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
              className="flex-1 bg-page-bg hover:bg-secondary-bg text-text-primary font-medium text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#6FB5BD] hover:bg-[#5da0a8] text-white font-medium text-xs py-2.5 rounded-xl transition cursor-pointer text-center shadow-2xs"
            >
              Add Sub Service
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
