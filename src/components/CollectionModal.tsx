"use client";

import React, { useState } from "react";
import Modal from "./Modal";
import { toast } from "react-toastify";
import { collectionApi } from "@/lib/api";

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollectionSaved: () => void;
  selectedDatabase: string | null;
}

export default function CollectionModal({
  isOpen,
  onClose,
  onCollectionSaved,
  selectedDatabase,
}: CollectionModalProps) {
  const [collectionName, setCollectionName] = useState("");
  const [description, setDescription] = useState("");

  const handleClose = () => {
    setCollectionName("");
    setDescription("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionName.trim() || !selectedDatabase) return;

    try {
      // Always use default fields: time and id
      const defaultFields = [
        { name: "time", type: "timestamp" as const, required: true },
        { name: "id", type: "string" as const, required: true },
      ];
      
      await collectionApi.create(
        selectedDatabase,
        collectionName,
        description || undefined,
        defaultFields
      );
      toast.success(`Collection "${collectionName}" created successfully!`);
      handleClose();
      onCollectionSaved();
    } catch (err: any) {
      const errorData = err?.error || {};
      const errorMessage = errorData.message || "Failed to create collection.";
      const errorCode = errorData.code || "UNKNOWN_ERROR";
      toast.error(`[${errorCode}] ${errorMessage}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Collection"
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Collection Name
          </label>
          <input
            type="text"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., cpu_metrics"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., CPU metrics collection"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}
