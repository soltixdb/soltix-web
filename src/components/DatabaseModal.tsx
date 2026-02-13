"use client";

import React, { useState } from "react";
import Modal from "./Modal";
import { toast } from "react-toastify";
import { databaseApi } from "@/lib/api";

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatabaseCreated: () => void;
}

export default function DatabaseModal({
  isOpen,
  onClose,
  onDatabaseCreated,
}: DatabaseModalProps) {
  const [newDbName, setNewDbName] = useState("");
  const [newDbDescription, setNewDbDescription] = useState("");

  const handleClose = () => {
    setNewDbName("");
    setNewDbDescription("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbName.trim()) return;

    try {
      await databaseApi.create(newDbName, newDbDescription || undefined);
      handleClose();
      toast.success(`Database "${newDbName}" created successfully!`);
      onDatabaseCreated();
    } catch (err: any) {
      const errorData = err?.error || {};
      const errorMessage = errorData.message || "Failed to create database.";
      const errorCode = errorData.code || "UNKNOWN_ERROR";
      toast.error(`[${errorCode}] ${errorMessage}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Database"
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Database Name
          </label>
          <input
            type="text"
            value={newDbName}
            onChange={(e) => setNewDbName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., monitoring"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            value={newDbDescription}
            onChange={(e) => setNewDbDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Monitoring metrics database"
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
