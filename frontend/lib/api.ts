import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
const INTEL_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '/api/v1')
  : 'http://localhost:8001/api/v1';

const api   = axios.create({ baseURL: API_BASE,   headers: { 'Content-Type': 'application/json' } });
const intel = axios.create({ baseURL: INTEL_BASE, headers: { 'Content-Type': 'application/json' } });

// ── Core occupancy API ──────────────────────────────────────────────────────
export const getRooms    = () => api.get('/rooms');
export const getCameras  = () => api.get('/cameras');
export const getSeats    = (cameraId?: number) => api.get('/seats', { params: { camera_id: cameraId } });
export const getStats    = () => api.get('/stats');
export const startCamera = (id: number) => api.post(`/cameras/${id}/start`);
export const stopCamera  = (id: number) => api.post(`/cameras/${id}/stop`);

// ── Intelligence Engine API ─────────────────────────────────────────────────
export const getIntelSummary = () => intel.get('/intelligence/summary');
export const getHeatmap      = (sinceHours = 24) => intel.get('/intelligence/heatmap', { params: { since_hours: sinceHours } });
export const getAlerts       = () => intel.get('/intelligence/alerts');
export const getInsights     = () => intel.get('/intelligence/insights');
export const getWorkerScore  = (seatId: number) => intel.get(`/intelligence/worker/${seatId}`);
export const getAllScores     = () => intel.get('/intelligence/scores');
export const getPatterns     = (sinceHours = 168) => intel.get('/intelligence/patterns', { params: { since_hours: sinceHours } });

// ── Floor Maps API ──────────────────────────────────────────────────────────
export const getFloorMapData = () => api.get('/rooms');

// ── Camera Feeds API ────────────────────────────────────────────────────────
export const getCameraStatus = (id: number) => api.get(`/cameras/${id}/status`);
export const restartCamera   = (id: number) => api.post(`/cameras/${id}/restart`);

// ── Audit Logs API ───────────────────────────────────────────────────────────
export const getLogs = (params?: { seat_id?: number; camera_id?: number; start_date?: string; end_date?: string; limit?: number; offset?: number }) => 
  api.get('/logs', { params });
export const getLogsSummary = () => api.get('/logs/summary');

// ── Settings API ────────────────────────────────────────────────────────────
export const getSettings = () => api.get('/settings');
export const updateSettings = (settings: any) => api.post('/settings', settings);

export default api;
