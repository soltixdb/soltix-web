"use client";

import React, { useState } from "react";
import { Collection } from "@/lib/api";
import { MdPlayArrow } from "react-icons/md";
import { toast } from "react-toastify";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnomalyModal from './AnomalyModal';

interface QueryPanelProps {
  selectedDatabase: string | null;
  selectedCollection: Collection | null;
  availableFields: string[];
}

export default function QueryPanel({
  selectedDatabase,
  selectedCollection,
  availableFields,
}: QueryPanelProps) {
  // Get default start time (00:00 today Tokyo time) and end time (now Tokyo time)
  const getDefaultStartTime = () => {
    const now = new Date();
    const tokyoTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    tokyoTime.setHours(0, 0, 0, 0);
    const year = tokyoTime.getFullYear();
    const month = String(tokyoTime.getMonth() + 1).padStart(2, '0');
    const day = String(tokyoTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00`;
  };

  const getDefaultEndTime = () => {
    const now = new Date();
    const tokyoTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const year = tokyoTime.getFullYear();
    const month = String(tokyoTime.getMonth() + 1).padStart(2, '0');
    const day = String(tokyoTime.getDate()).padStart(2, '0');
    const hours = String(tokyoTime.getHours()).padStart(2, '0');
    const minutes = String(tokyoTime.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [availableDeviceIds, setAvailableDeviceIds] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(getDefaultStartTime());
  const [endTime, setEndTime] = useState(getDefaultEndTime());
  const [interval, setInterval] = useState("1m");
  const [aggregation, setAggregation] = useState("sum");
  const [limit, setLimit] = useState(0);
  const [downsamplingAlgorithm, setDownsamplingAlgorithm] = useState("none");
  const [anomalyDetection, setAnomalyDetection] = useState("none");
  const [anomalyThreshold, setAnomalyThreshold] = useState(3.0);
  const [anomalyField, setAnomalyField] = useState("");
  const [showAnomalyModal, setShowAnomalyModal] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isQueryRunning, setIsQueryRunning] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState(0);
  const [activeViewTab, setActiveViewTab] = useState<'graph' | 'raw'>('raw');
  const [hasViewedGraph, setHasViewedGraph] = useState(false);
  const [visibleRecords, setVisibleRecords] = useState<{ [key: number]: number }>({});
  const [graphPointsLimit, setGraphPointsLimit] = useState<{ [key: number]: number }>({});
  const [graphGenerated, setGraphGenerated] = useState<{ [key: number]: boolean }>({});

  React.useEffect(() => {
    if (availableFields.length > 0 && selectedFields.length === 0) {
      setSelectedFields([availableFields[0]]);
    }
  }, [availableFields]);

  // Reset anomalyField if it's no longer in selectedFields
  React.useEffect(() => {
    if (anomalyField && !selectedFields.includes(anomalyField)) {
      setAnomalyField("");
    }
  }, [selectedFields, anomalyField]);

  React.useEffect(() => {
    if (selectedCollection?.device_ids) {
      setAvailableDeviceIds(selectedCollection.device_ids);
    } else {
      setAvailableDeviceIds([]);
    }
    setSelectedDeviceIds([]);
  }, [selectedCollection]);

  const handleRunQuery = async () => {
    if (!selectedDatabase || !selectedCollection) {
      toast.warning("Please select a collection");
      return;
    }

    if (!startTime || !endTime) {
      toast.warning("Please select start time and end time");
      return;
    }

    if (selectedFields.length === 0) {
      toast.warning("Please select at least one field");
      return;
    }

    setIsQueryRunning(true);
    try {
      const idsArray = selectedDeviceIds;
      
      const formatToTokyoTime = (dateTimeLocal: string) => {
        if (!dateTimeLocal) return '';
        return `${dateTimeLocal}:00+09:00`;
      };
      
      const startTimeRFC3339 = formatToTokyoTime(startTime);
      const endTimeRFC3339 = formatToTokyoTime(endTime);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/databases/${selectedDatabase}/collections/${selectedCollection.name}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify({
          start_time: startTimeRFC3339,
          end_time: endTimeRFC3339,
          ids: idsArray,
          fields: selectedFields,
          limit: limit,
          interval: interval,
          aggregation: aggregation,
          ...(interval === "1m" && downsamplingAlgorithm !== "none" && {
            downsampling: downsamplingAlgorithm
          }),
          ...(anomalyDetection !== "none" && {
            anomaly_detection: anomalyDetection,
            anomaly_threshold: anomalyThreshold,
            ...(anomalyField && { anomaly_field: anomalyField })
          }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      const result = await response.json();
      setQueryResult(result);
      setActiveDeviceTab(0);
      setVisibleRecords({});
      setGraphPointsLimit({});
      setGraphGenerated({});
      setIsQueryRunning(false);
      toast.success("Query executed successfully");
    } catch (err: any) {
      setIsQueryRunning(false);
      const errorData = err?.error || {};
      const errorMessage = errorData.message || "Failed to execute query";
      const errorCode = errorData.code || "UNKNOWN_ERROR";
      toast.error(`[${errorCode}] ${errorMessage}`);
    }
  };

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  if (!selectedCollection) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        {/* Query Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MdPlayArrow size={20} />
            Query
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Device IDs
              </label>
              <select
                multiple
                value={selectedDeviceIds}
                onChange={(e) => setSelectedDeviceIds(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                size={3}
              >
                {availableDeviceIds.map(deviceId => (
                  <option key={deviceId} value={deviceId}>{deviceId}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fields
              </label>
              <select
                multiple
                value={selectedFields}
                onChange={(e) => setSelectedFields(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                size={3}
              >
                {availableFields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interval
              </label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1m">1m (raw)</option>
                <option value="1h">1h</option>
                <option value="1d">1d</option>
                <option value="1mo">1mo</option>
                <option value="1y">1y</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Aggregation
              </label>
              <select
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="min">Min</option>
                <option value="max">Max</option>
                <option value="count">Count</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Limit (0 = no limit)
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
                min="0"
                max="10000"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Downsampling - only show when interval is 1m (raw) */}
            {interval === "1m" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Downsampling
                </label>
                <select
                  value={downsamplingAlgorithm}
                  onChange={(e) => setDownsamplingAlgorithm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">None</option>
                  <option value="auto">Auto</option>
                  <option value="lttb">LTTB (Largest Triangle)</option>
                  <option value="minmax">Min-Max</option>
                  <option value="avg">Average</option>
                  <option value="m4">M4</option>
                </select>
              </div>
            )}

            {/* Anomaly Detection Section */}
            <div className="col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Anomaly Detection</h5>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Algorithm
                  </label>
                  <select
                    value={anomalyDetection}
                    onChange={(e) => setAnomalyDetection(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None (Disabled)</option>
                    <option value="auto">Auto</option>
                    <option value="zscore">Z-Score</option>
                    <option value="iqr">IQR (Interquartile Range)</option>
                    <option value="moving_avg">Moving Average</option>
                  </select>
                </div>

                {anomalyDetection !== "none" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Threshold
                      </label>
                      <input
                        type="number"
                        value={anomalyThreshold}
                        onChange={(e) => setAnomalyThreshold(parseFloat(e.target.value) || 3.0)}
                        min="0.5"
                        max="10"
                        step="0.5"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Field (optional)
                      </label>
                      <select
                        value={anomalyField}
                        onChange={(e) => setAnomalyField(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Auto (first field)</option>
                        {selectedFields.map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Run Query Button */}
            <div className="col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 flex justify-center">
              <button
                onClick={handleRunQuery}
                disabled={isQueryRunning}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <MdPlayArrow size={20} />
                {isQueryRunning ? "Running..." : "Run Query"}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {queryResult && (
          <>
            {/* Anomaly Detection Results */}
            {queryResult.anomalies && queryResult.anomalies.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                        {queryResult.anomaly_count || queryResult.anomalies.length} Anomalies Detected
                      </h4>
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        Click to view details
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAnomalyModal(true)}
                    className="px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/70 transition-colors"
                  >
                    View Anomalies
                  </button>
                </div>
              </div>
            )}

            {/* Anomaly Modal */}
            <AnomalyModal
              isOpen={showAnomalyModal}
              onClose={() => setShowAnomalyModal(false)}
              anomalies={queryResult.anomalies || []}
              algorithm={anomalyDetection}
              threshold={anomalyThreshold}
            />

            {/* View Tabs (Graph / Raw Data) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                <nav className="flex -mb-px space-x-4">
                  <button
                    onClick={() => setActiveViewTab('raw')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeViewTab === 'raw'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    Raw Data
                  </button>
                  <button
                    onClick={() => {
                      setActiveViewTab('graph');
                      setHasViewedGraph(true);
                    }}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeViewTab === 'graph'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    Graph
                  </button>
                </nav>
              </div>

              {/* Graph View */}
              {activeViewTab === 'graph' && hasViewedGraph && (
                <div className="min-h-[500px]">
                  {queryResult.results && queryResult.results.map((result: any, deviceIdx: number) => {
                    const fieldKeys = Object.keys(result).filter(key => key !== 'id' && key !== 'times');
                    const timeArray = result.times || [];
                    const defaultPoints = 1000;
                    const currentLimit = graphPointsLimit[deviceIdx] || defaultPoints;
                    const isGenerated = graphGenerated[deviceIdx] || false;
                    
                    const chartData = timeArray.slice(0, isGenerated ? currentLimit : 0).map((time: string, idx: number) => {
                      const dataPoint: any = { time };
                      fieldKeys.forEach(fieldKey => {
                        dataPoint[fieldKey] = result[fieldKey]?.[idx];
                      });
                      return dataPoint;
                    });
                    
                    return (
                      <div key={deviceIdx} className="mb-8 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{result.id}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {timeArray.length.toLocaleString()} data points
                            </p>
                          </div>
                          
                          {/* Graph Controls */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600 dark:text-gray-400">Points:</label>
                              <select
                                value={currentLimit}
                                onChange={(e) => setGraphPointsLimit(prev => ({
                                  ...prev,
                                  [deviceIdx]: Number(e.target.value)
                                }))}
                                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              >
                                {[100, 500, 1000, 2500, 5000, 10000].map(limit => (
                                  <option key={limit} value={limit}>{limit.toLocaleString()}</option>
                                ))}
                              </select>
                            </div>
                            
                            <button
                              onClick={() => setGraphGenerated(prev => ({
                                ...prev,
                                [deviceIdx]: true
                              }))}
                              className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              {isGenerated ? 'Update Graph' : 'Generate Graph'}
                            </button>
                            
                            {currentLimit > 2500 && !isGenerated && (
                              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Generating many points may cause lag
                              </span>
                            )}
                          </div>
                          
                          {isGenerated && (
                            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                              Displaying {Math.min(currentLimit, timeArray.length).toLocaleString()} of {timeArray.length.toLocaleString()} data points
                            </div>
                          )}
                        </div>
                        
                        {/* Graph */}
                        {isGenerated ? (
                          <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                              <XAxis 
                                dataKey="time" 
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                                tickFormatter={(value) => {
                                  const date = new Date(value);
                                  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                                }}
                              />
                              <YAxis 
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.5rem'
                                }}
                                labelFormatter={(value) => `Time: ${value}`}
                              />
                              <Legend />
                              {fieldKeys.map((fieldKey, idx) => (
                                <Line 
                                  key={fieldKey}
                                  type="monotone" 
                                  dataKey={fieldKey} 
                                  stroke={colors[idx % colors.length]}
                                  strokeWidth={2}
                                  dot={false}
                                  activeDot={{ r: 4 }}
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-[400px] bg-gray-100 dark:bg-gray-900 rounded-lg">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <p>Select data points and click "Generate Graph" to visualize</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Raw Data View */}
              {activeViewTab === 'raw' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Raw Data</h4>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {queryResult.results?.length || 0} device(s)
                    </div>
                  </div>
          
                  {/* Device Tabs */}
                  {queryResult.results && queryResult.results.length > 0 && (
                    <>
                      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                        <nav className="flex -mb-px space-x-2 overflow-x-auto">
                          {queryResult.results.map((result: any, deviceIdx: number) => (
                            <button
                              key={deviceIdx}
                              onClick={() => setActiveDeviceTab(deviceIdx)}
                              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                                activeDeviceTab === deviceIdx
                                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                            >
                              {result.id}
                              <span className="ml-2 text-xs text-gray-400">
                                ({result.times?.length || 0})
                              </span>
                            </button>
                          ))}
                        </nav>
                      </div>
                      
                      {/* Active Device Data */}
                      {(() => {
                        const result = queryResult.results[activeDeviceTab];
                        const fieldKeys = Object.keys(result).filter(key => key !== 'id' && key !== 'times');
                        const timeArray = result.times || [];
                        const recordsPerPage = 100;
                        const currentVisible = visibleRecords[activeDeviceTab] || recordsPerPage;
                        const displayedRecords = timeArray.slice(0, currentVisible);
                        const hasMore = currentVisible < timeArray.length;
                        
                        return (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Time
                                  </th>
                                  {fieldKeys.map((fieldKey) => (
                                    <th
                                      key={fieldKey}
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                      {fieldKey}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {displayedRecords.map((time: string, rowIdx: number) => (
                                  <tr key={rowIdx}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                      {time}
                                    </td>
                                    {fieldKeys.map((fieldKey) => {
                                      const fieldValue = result[fieldKey]?.[rowIdx];
                                      return (
                                        <td
                                          key={fieldKey}
                                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300"
                                        >
                                          {typeof fieldValue === 'number' 
                                            ? fieldValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
                                            : String(fieldValue ?? '')}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            
                            {/* Show More Button */}
                            {hasMore && (
                              <div className="flex justify-center mt-4 mb-2">
                                <button
                                  onClick={() => {
                                    setVisibleRecords(prev => ({
                                      ...prev,
                                      [activeDeviceTab]: currentVisible + recordsPerPage
                                    }));
                                  }}
                                  className="px-6 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                  Show more ({Math.min(recordsPerPage, timeArray.length - currentVisible)} of {timeArray.length - currentVisible} remaining)
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
