"use client";

import React from "react";
import { Collection } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { MdFolder, MdAdd, MdMoreVert, MdDelete } from "react-icons/md";

interface CollectionPanelProps {
  collections: Collection[];
  selectedDatabase: string | null;
  selectedCollection: Collection | null;
  isLoading: boolean;
  onSelectCollection: (collection: Collection) => void;
  onCreateCollection: () => void;
  onDeleteCollection: (collectionName: string) => void;
}

export default function CollectionPanel({
  collections,
  selectedDatabase,
  selectedCollection,
  isLoading,
  onSelectCollection,
  onCreateCollection,
  onDeleteCollection,
}: CollectionPanelProps) {
  const [openMenuCollection, setOpenMenuCollection] = React.useState<string | null>(null);

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Collections</h2>
            {selectedDatabase && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedDatabase}</p>
            )}
          </div>
          {selectedDatabase && (
            <button
              onClick={onCreateCollection}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
              title="Add Collection"
            >
              <MdAdd size={20} />
            </button>
          )}
        </div>
      </div>
      <div className="p-2">
        {!selectedDatabase ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            Select a database
          </div>
        ) : isLoading ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            Loading...
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            No collections
          </div>
        ) : (
          collections.map((collection) => (
            <div key={collection.name} className="relative">
              <div
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center gap-2 transition-colors cursor-pointer ${
                  selectedCollection?.name === collection.name
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <div
                  onClick={() => onSelectCollection(collection)}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <MdFolder size={18} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{collection.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {collection.data_start_time ? formatDate(collection.data_start_time) : "No data"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuCollection(openMenuCollection === collection.name ? null : collection.name);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <MdMoreVert size={18} />
                </button>
              </div>
              {openMenuCollection === collection.name && (
                <div className="absolute right-2 top-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                  <button
                    onClick={() => {
                      onDeleteCollection(collection.name);
                      setOpenMenuCollection(null);
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
    </div>
  );
}
