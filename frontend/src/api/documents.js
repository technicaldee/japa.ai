import { api } from "./client";

export const documentApi = {
  list: () => api.get("/documents"),
  create: (data) => api.post("/documents", data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
};
