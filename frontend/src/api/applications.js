import { api } from "./client";

export const applicationApi = {
  list: () => api.get("/applications"),
  get: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post("/applications", data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`),
  generateEssay: (id) => api.post(`/applications/${id}/generate-essay`),
};
