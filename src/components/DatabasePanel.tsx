"use client";

import Image from "next/image";
import { Database } from "@/lib/api";
import { MdStorage, MdAdd, MdMoreVert, MdDelete } from "react-icons/md";

interface DatabasePanelProps {
  databases: Database[];
  selectedDatabase: string | null;
  isLoading: boolean;
  onSelectDatabase: (dbName: string) => void;
  onCreateDatabase: () => void;
  onDeleteDatabase: (dbName: string) => void;
}

export default function DatabasePanel({
  databases,
  selectedDatabase,
  isLoading,
  onSelectDatabase,
  onCreateDatabase,
  onDeleteDatabase,
}: DatabasePanelProps) {
  const currentYear = new Date().getFullYear();
  const [openMenuDb, setOpenMenuDb] = React.useState<string | null>(null);

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image 
              src="/logo.png" 
              alt="Soltix Logo" 
              width={40} 
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Soltix
            </span>
          </a>
          <button
            onClick={onCreateDatabase}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            title="Add Database"
          >
            <MdAdd size={24} />
          </button>
        </div>
      </div>
      <div className="p-2 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            Loading...
          </div>
        ) : databases.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            No databases
          </div>
        ) : (
          databases.map((db) => (
            <div key={db.name} className="relative">
              <div
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center gap-2 transition-colors cursor-pointer ${
                  selectedDatabase === db.name
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <div
                  onClick={() => onSelectDatabase(db.name)}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <MdStorage size={18} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{db.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {db.collections?.length || 0} collections
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuDb(openMenuDb === db.name ? null : db.name);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <MdMoreVert size={18} />
                </button>
              </div>
              {openMenuDb === db.name && (
                <div className="absolute right-2 top-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                  <button
                    onClick={() => {
                      onDeleteDatabase(db.name);
                      setOpenMenuDb(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                  >
                    <MdDelete size={16} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          © {currentYear} Soltix. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// Add React import at the top
import React from "react";
