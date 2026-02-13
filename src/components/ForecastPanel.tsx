'use client';

import { useState, useEffect } from 'react';
import { MdPlayArrow } from 'react-icons/md';
import { toast } from 'react-toastify';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ForecastPanelProps {
  selectedDatabase: string | null;
  selectedCollection: string | null;
  availableDevices: string[];
  availableFields: string[];
}

export default function ForecastPanel({ selectedDatabase, selectedCollection, availableDevices, availableFields }: ForecastPanelProps) {
  // Device & Field selection (single selection only)
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  
  // Time range
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Forecast options
  const [forecastHorizon, setForecastHorizon] = useState<number>(60); // in minutes
  const [forecastModel, setForecastModel] = useState<string>('auto');
  const [interval, setInterval] = useState('1m');
  
  // Results
  const [forecastResult, setForecastResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // View tabs
  const [activeViewTab, setActiveViewTab] = useState<'raw' | 'graph'>('raw');
  const [hasViewedGraph, setHasViewedGraph] = useState(false);
  
  // Pagination
  const [visibleRecords, setVisibleRecords] = useState<number>(100);
  
  // Graph controls
  const [graphPointsLimit, setGraphPointsLimit] = useState<number>(1000);
  const [graphGenerated, setGraphGenerated] = useState<boolean>(false);

  // Horizon options
  const horizonOptions = [
    { label: '5 minutes', value: 5 },
    { label: '10 minutes', value: 10 },
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: '6 hours', value: 360 },
    { label: '12 hours', value: 720 },
    { label: '1 day', value: 1440 },
    { label: '1 week', value: 10080 },
  ];

  // Set default time range
  useEffect(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    setEndTime(now.toISOString().slice(0, 16));
    setStartTime(yesterday.toISOString().slice(0, 16));
  }, []);

  const handleForecast = async () => {
    if (!selectedDatabase || !selectedCollection) {
      toast.error('Please select a database and collection');
      return;
    }
    
    if (!selectedDevice) {
      toast.error('Please select a device');
      return;
    }
    
    if (!selectedField) {
      toast.error('Please select a field');
      return;
    }
    
    if (!startTime || !endTime) {
      toast.error('Please select a time range');
      return;
    }
    
    setIsLoading(true);
    setForecastResult(null);
    setVisibleRecords(100);
    setGraphGenerated(false);
    setHasViewedGraph(false);
    
    try {
      const payload = {
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        ids: [selectedDevice],
        field: selectedField,
        interval: interval,
        horizon: forecastHorizon,
        method: forecastModel
      };
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/databases/${selectedDatabase}/collections/${selectedCollection}/forecast`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
          },
          body: JSON.stringify(payload)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Forecast failed: ${response.status}`);
      }
      
      const data = await response.json();
      setForecastResult(data);
      toast.success('Forecast completed successfully');
    } catch (error) {
      console.error('Forecast error:', error);
      toast.error(error instanceof Error ? error.message : 'Forecast failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when collection changes
  useEffect(() => {
    setForecastResult(null);
    setSelectedDevice('');
    setSelectedField('');
    setVisibleRecords(100);
    setGraphGenerated(false);
    setHasViewedGraph(false);
  }, [selectedDatabase, selectedCollection]);

  if (!selectedDatabase || !selectedCollection) {
    return null;
  }

  const forecast = forecastResult?.forecasts?.[0];
  const predictions = forecast?.predictions || [];
  const modelInfo = forecast?.model_info;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Forecast Options */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Forecast Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Row 1: Device & Field Selection */}
            {/* Device Selection (Single) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Device <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a device</option>
                {availableDevices.map((device) => (
                  <option key={device} value={device}>{device}</option>
                ))}
              </select>
            </div>

            {/* Field Selection (Single) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Field <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a field</option>
                {availableFields.map((field) => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>

            {/* Training Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Training Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Training End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Training End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Row 2: Forecast Parameters */}
            {/* Prediction Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prediction Duration
              </label>
              <select
                value={forecastHorizon}
                onChange={(e) => setForecastHorizon(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {horizonOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">How far into the future to predict</p>
            </div>

            {/* Interval */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interval
              </label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="1m">1 minute</option>
                <option value="5m">5 minutes</option>
                <option value="15m">15 minutes</option>
                <option value="30m">30 minutes</option>
                <option value="1h">1 hour</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Time between each prediction point</p>
            </div>

            {/* Forecast Model */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model
              </label>
              <select
                value={forecastModel}
                onChange={(e) => setForecastModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="auto">Auto (Recommended)</option>
                <option value="arima">ARIMA</option>
                <option value="prophet">Prophet</option>
                <option value="exponential">Exponential Smoothing</option>
                <option value="holt_winters">Holt-Winters</option>
                <option value="linear">Linear Regression</option>
                <option value="sma">Simple Moving Average (SMA)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Algorithm used for forecasting</p>
            </div>
          </div>

          {/* Forecast Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleForecast}
              disabled={isLoading || !selectedDevice || !selectedField}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Forecasting...
                </>
              ) : (
                <>
                  <MdPlayArrow className="w-5 h-5" />
                  Generate Forecast
                </>
              )}
            </button>
          </div>
        </div>

        {/* Forecast Results */}
        {forecastResult && (
          <>
            {/* View Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveViewTab('raw')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeViewTab === 'raw'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
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
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Graph
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Raw Data View */}
              {activeViewTab === 'raw' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Forecast Results</h4>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {predictions.length} prediction(s)
                    </div>
                  </div>

                  {/* Model Info */}
                  {modelInfo && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
                      <h5 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Model Information</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-purple-600 dark:text-purple-400">Algorithm:</span>
                          <span className="ml-2 text-purple-900 dark:text-purple-100">{modelInfo.algorithm}</span>
                        </div>
                        <div>
                          <span className="text-purple-600 dark:text-purple-400">MAPE:</span>
                          <span className="ml-2 text-purple-900 dark:text-purple-100">{modelInfo.mape?.toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-purple-600 dark:text-purple-400">MAE:</span>
                          <span className="ml-2 text-purple-900 dark:text-purple-100">{modelInfo.mae?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                          <span className="text-purple-600 dark:text-purple-400">Data Points:</span>
                          <span className="ml-2 text-purple-900 dark:text-purple-100">{modelInfo.data_points?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Device & Field Info */}
                  {forecast && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Device: <strong className="text-gray-900 dark:text-white">{forecast.device_id}</strong>
                        <span className="mx-2">•</span>
                        Field: <strong className="text-gray-900 dark:text-white">{forecast.field}</strong>
                      </span>
                    </div>
                  )}

                  {/* Predictions Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Predicted Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Lower Bound
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Upper Bound
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {predictions.slice(0, visibleRecords).map((pred: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              {pred.time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600 dark:text-purple-400">
                              {pred.value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {pred.lower_bound?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {pred.upper_bound?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Show More Button */}
                    {visibleRecords < predictions.length && (
                      <div className="flex justify-center mt-4 mb-2">
                        <button
                          onClick={() => setVisibleRecords(prev => prev + 100)}
                          className="px-6 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          Show more ({Math.min(100, predictions.length - visibleRecords)} of {predictions.length - visibleRecords} remaining)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Graph View */}
              {activeViewTab === 'graph' && hasViewedGraph && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Forecast Graph</h4>
                      {forecast && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {forecast.device_id} • {forecast.field}
                          {modelInfo && (
                            <span className="ml-2 text-purple-600 dark:text-purple-400">
                              ({modelInfo.algorithm})
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Graph Controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Points:</label>
                        <select
                          value={graphPointsLimit}
                          onChange={(e) => setGraphPointsLimit(Number(e.target.value))}
                          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          {[100, 500, 1000, 2500, 5000].map(limit => (
                            <option key={limit} value={limit}>{limit.toLocaleString()}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => setGraphGenerated(true)}
                        className="px-4 py-1.5 text-sm font-medium bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                      >
                        {graphGenerated ? 'Update Graph' : 'Generate Graph'}
                      </button>

                      {graphPointsLimit > 2500 && !graphGenerated && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          May cause lag
                        </span>
                      )}
                    </div>
                  </div>

                  {graphGenerated && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Displaying {Math.min(graphPointsLimit, predictions.length).toLocaleString()} of {predictions.length.toLocaleString()} prediction points
                    </div>
                  )}

                  {/* Graph */}
                  {graphGenerated ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart
                        data={predictions.slice(0, graphPointsLimit).map((pred: any) => ({
                          time: pred.time,
                          value: pred.value,
                          lower_bound: pred.lower_bound,
                          upper_bound: pred.upper_bound
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
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
                          formatter={(value, name) => {
                            const labels: Record<string, string> = {
                              value: 'Predicted',
                              lower_bound: 'Lower Bound',
                              upper_bound: 'Upper Bound'
                            };
                            return [typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(value), labels[String(name)] || String(name)];
                          }}
                        />
                        <Legend
                          formatter={(value) => {
                            const labels: Record<string, string> = {
                              value: 'Predicted Value',
                              lower_bound: 'Lower Bound (95% CI)',
                              upper_bound: 'Upper Bound (95% CI)'
                            };
                            return labels[value] || value;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="lower_bound"
                          stroke="#94a3b8"
                          strokeWidth={1}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="upper_bound"
                          stroke="#94a3b8"
                          strokeWidth={1}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] bg-gray-100 dark:bg-gray-900 rounded-lg">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p>Select prediction points and click "Generate Graph" to visualize</p>
                      </div>
                    </div>
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
