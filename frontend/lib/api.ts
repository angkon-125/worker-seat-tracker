import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Runtime & Live Data (New Production Routes) ───────────────────────────

export const getStats = async () => {
  const response = await api.get('/runtime/stats');
  return response.data;
};

export const getRecentSessions = async () => {
  const response = await api.get('/runtime/recent-sessions');
  return response.data;
};

export const getLiveStatus = async () => {
  const response = await api.get('/runtime/live-status');
  return response.data;
};

export const getCameraWorkerStatus = async () => {
  const response = await api.get('/runtime/cameras/status');
  return response.data;
};

export const startCameraStream = async (cameraId: number) => {
  const response = await api.post(`/runtime/cameras/${cameraId}/start`);
  return response.data;
};

export const stopCameraStream = async (cameraId: number) => {
  const response = await api.post(`/runtime/cameras/${cameraId}/stop`);
  return response.data;
};

export const restartCameraStream = async (cameraId: number) => {
  const response = await api.post(`/runtime/cameras/${cameraId}/restart`);
  return response.data;
};

// ─── CRUD / Management ─────────────────────────────────────────────────────

export const getWorkers = async () => {
  const response = await api.get('/workers/');
  return response.data;
};

export const getSeats = async () => {
  const response = await api.get('/seats/');
  return response.data;
};

export const getCameras = async () => {
  const response = await api.get('/cameras/');
  return response.data;
};

export default api;
