"use client";

import React, { useState } from "react";

interface Anomaly {
  time: string;
  tags?: {
    device_id?: string;
    id?: string;
    [key: string]: string | undefined;
  };
  field: string;
  value: number;
  expected?: {
    min: number;
    max: number;
  };
  score: number;
  type: string;
  algorithm?: string;
}

interface AnomalyModalProps {
  isOpen: boolean;
  onClose: () => void;
  anomalies: Anomaly[];
  algorithm: string;
  threshold: number;
}

export default function AnomalyModal({
  isOpen,
  onClose,
  anomalies,
  algorithm,
  threshold,
}: AnomalyModalProps) {
  const [visibleCount, setVisibleCount] = useState(100);
  const recordsPerPage = 100;

  if (!isOpen) return null;

  const displayedAnomalies = anomalies.slice(0, visibleCount);
  const hasMore = visibleCount < anomalies.length;

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + recordsPerPage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Anomaly Detection Results ({anomalies.length})
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-160px)]">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Device</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Field</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expected Range</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {displayedAnomalies.map((anomaly, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                    {anomaly.time}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                    {anomaly.tags?.device_id || anomaly.tags?.id || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                    {anomaly.field}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
                    {typeof anomaly.value === 'number' ? anomaly.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : anomaly.value}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {anomaly.expected ? `${anomaly.expected.min?.toFixed(2)} ~ ${anomaly.expected.max?.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      anomaly.score >= 4 ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                      anomaly.score >= 3 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                    }`}>
                      {anomaly.score?.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      anomaly.type === 'spike' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      anomaly.type === 'dip' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      anomaly.type === 'flatline' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {anomaly.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Show More Button */}
          {hasMore && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleShowMore}
                className="px-6 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                Show more ({Math.min(recordsPerPage, anomalies.length - visibleCount)} of {anomalies.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Algorithm: {anomalies[0]?.algorithm || algorithm}</span>
            <div className="flex items-center gap-4">
              <span>Showing: {displayedAnomalies.length} of {anomalies.length}</span>
              <span>Threshold: {threshold}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
