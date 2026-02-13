"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import DatabasePanel from "@/components/DatabasePanel";
import CollectionPanel from "@/components/CollectionPanel";
import QueryPanel from "@/components/QueryPanel";
import ForecastPanel from "@/components/ForecastPanel";
import DatabaseModal from "@/components/DatabaseModal";
import CollectionModal from "@/components/CollectionModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { Database, Collection, databaseApi, collectionApi } from "@/lib/api";

export default function WorkspacePage() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(true);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [isCreateDbModalOpen, setIsCreateDbModalOpen] = useState(false);
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);
  const [isDeleteDbModalOpen, setIsDeleteDbModalOpen] = useState(false);
  const [isDeleteCollectionModalOpen, setIsDeleteCollectionModalOpen] = useState(false);
  const [dbToDelete, setDbToDelete] = useState<string>("");
  const [collectionToDelete, setCollectionToDelete] = useState<string>("");
  const [activePanel, setActivePanel] = useState<'query' | 'forecast'>('query');

  useEffect(() => {
    loadDatabases();
  }, []);

  useEffect(() => {
    if (selectedDatabase) {
      const database = databases.find(db => db.name === selectedDatabase);
      if (database?.collections) {
        setCollections(database.collections);
      } else {
        loadCollections(selectedDatabase);
      }
    } else {
      setCollections([]);
      setSelectedCollection(null);
    }
  }, [selectedDatabase, databases]);

  const loadDatabases = async () => {
    try {
      setIsLoadingDatabases(true);
      const data = await databaseApi.list();
      setDatabases(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load databases");
      setDatabases([]);
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  const loadCollections = async (dbName: string) => {
    try {
      setIsLoadingCollections(true);
      const data = await collectionApi.list(dbName);
      setCollections(data);
    } catch (err) {
      toast.error("Failed to load collections");
      setCollections([]);
    } finally {
      setIsLoadingCollections(false);
    }
  };

  const handleSelectDatabase = (dbName: string) => {
    setSelectedDatabase(dbName);
    setSelectedCollection(null);
  };

  const handleSelectCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    // Load collection fields
    if (selectedDatabase) {
      loadCollectionFields(selectedDatabase, collection.name);
    }
  };

  const loadCollectionFields = async (database: string, collectionName: string) => {
    try {
      const collectionInfo = await collectionApi.getInfo(database, collectionName);
      if (collectionInfo.fields) {
        // fields is now an object: { "field_0": "float", "field_1": "float", ... }
        const fieldNames = Object.keys(collectionInfo.fields)
          .filter(name => name !== "time" && name !== "id");
        setAvailableFields(fieldNames);
      }
    } catch (err) {
      console.error("Failed to load collection fields", err);
    }
  };

  const handleDeleteDatabase = (dbName: string) => {
    setDbToDelete(dbName);
    setIsDeleteDbModalOpen(true);
  };

  const confirmDeleteDatabase = async () => {
    try {
      await databaseApi.delete(dbToDelete);
      toast.success(`Database "${dbToDelete}" deleted successfully!`);
      if (selectedDatabase === dbToDelete) {
        setSelectedDatabase(null);
        setCollections([]);
        setSelectedCollection(null);
      }
      setIsDeleteDbModalOpen(false);
      setDbToDelete("");
      await loadDatabases();
    } catch (err: any) {
      const errorData = err?.error || {};
      const errorMessage = errorData.message || "Failed to delete database.";
      const errorCode = errorData.code || "UNKNOWN_ERROR";
      toast.error(`[${errorCode}] ${errorMessage}`);
    }
  };

  const handleDeleteCollection = (collectionName: string) => {
    setCollectionToDelete(collectionName);
    setIsDeleteCollectionModalOpen(true);
  };

  const confirmDeleteCollection = async () => {
    if (!selectedDatabase) return;

    try {
      await collectionApi.delete(selectedDatabase, collectionToDelete);
      toast.success(`Collection "${collectionToDelete}" deleted successfully!`);
      if (selectedCollection?.name === collectionToDelete) {
        setSelectedCollection(null);
      }
      setIsDeleteCollectionModalOpen(false);
      setCollectionToDelete("");
      await loadCollections(selectedDatabase);
    } catch (err: any) {
      const errorData = err?.error || {};
      const errorMessage = errorData.message || "Failed to delete collection.";
      const errorCode = errorData.code || "UNKNOWN_ERROR";
      toast.error(`[${errorCode}] ${errorMessage}`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Panel - Databases */}
      <DatabasePanel
        databases={databases}
        selectedDatabase={selectedDatabase}
        isLoading={isLoadingDatabases}
        onSelectDatabase={handleSelectDatabase}
        onCreateDatabase={() => setIsCreateDbModalOpen(true)}
        onDeleteDatabase={handleDeleteDatabase}
      />

      {/* Middle Panel - Collections */}
      <CollectionPanel
        collections={collections}
        selectedDatabase={selectedDatabase}
        selectedCollection={selectedCollection}
        isLoading={isLoadingCollections}
        onSelectCollection={handleSelectCollection}
        onCreateCollection={() => setIsCreateCollectionModalOpen(true)}
        onDeleteCollection={handleDeleteCollection}
      />

      {/* Right Panel - Query/Forecast with Tab Switcher */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Collection Info - Always at top */}
        {selectedCollection ? (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {selectedDatabase}/{selectedCollection.name}
            </h3>
            {selectedCollection.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedCollection.description}
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <p className="text-lg">Select a collection to query data</p>
            </div>
          </div>
        )}

        {/* Query/Forecast Tabs and Content - Only show when collection selected */}
        {selectedCollection && (
          <>
            {/* Tab Switcher */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
              <div className="flex justify-center">
                <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                  <button
                    onClick={() => setActivePanel('query')}
                    className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                      activePanel === 'query'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Query
                    </span>
                  </button>
                  <button
                    onClick={() => setActivePanel('forecast')}
                    className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                      activePanel === 'forecast'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Forecast
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Panel Content */}
            {activePanel === 'query' ? (
              <QueryPanel
                selectedDatabase={selectedDatabase}
                selectedCollection={selectedCollection}
                availableFields={availableFields}
              />
            ) : (
              <ForecastPanel
                selectedDatabase={selectedDatabase}
                selectedCollection={selectedCollection?.name || null}
                availableDevices={selectedCollection?.device_ids || []}
                availableFields={availableFields}
              />
            )}
          </>
        )}
      </div>

      {/* Database Modal */}
      <DatabaseModal
        isOpen={isCreateDbModalOpen}
        onClose={() => setIsCreateDbModalOpen(false)}
        onDatabaseCreated={loadDatabases}
      />

      {/* Collection Modal */}
      <CollectionModal
        isOpen={isCreateCollectionModalOpen}
        onClose={() => setIsCreateCollectionModalOpen(false)}
        onCollectionSaved={() => selectedDatabase && loadCollections(selectedDatabase)}
        selectedDatabase={selectedDatabase}
      />

      {/* Delete Database Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteDbModalOpen}
        onClose={() => {
          setIsDeleteDbModalOpen(false);
          setDbToDelete("");
        }}
        onConfirm={confirmDeleteDatabase}
        itemName={dbToDelete}
        itemType="database"
        additionalWarning="This database will be queued for deletion and removed shortly. This action cannot be undone."
      />

      {/* Delete Collection Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteCollectionModalOpen}
        onClose={() => {
          setIsDeleteCollectionModalOpen(false);
          setCollectionToDelete("");
        }}
        onConfirm={confirmDeleteCollection}
        itemName={collectionToDelete}
        itemType="collection"
      />
    </div>
  );
}
