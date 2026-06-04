import { api } from "./client";

export const agentApi = {
  run: () => api.post("/agent/run"),
  runAll: () => api.post("/agent/run-all"),
  status: () => api.get("/agent/status"),
  search: (query) => api.post("/agent/search", query),
  saveProfile: (data) => api.post("/agent/profile", data),
  getProfile: (userId) => api.get(`/agent/profile/${userId}`),
};
