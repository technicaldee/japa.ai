import { api } from "./client";

export const adminApi = {
  overview: () => api.get("/admin/overview"),
  analyticsGrowth: () => api.get("/admin/analytics/growth"),
  analyticsUsers: () => api.get("/admin/analytics/users"),
  analyticsHotspots: () => api.get("/admin/analytics/hotspots"),
  analyticsSuccessRate: () => api.get("/admin/analytics/success-rate"),
  activity: () => api.get("/admin/activity"),
  scrapers: {
    list: () => api.get("/admin/scrapers"),
    create: (data) => api.post("/admin/scrapers", data),
    update: (id, data) => api.put(`/admin/scrapers/${id}`, data),
    delete: (id) => api.delete(`/admin/scrapers/${id}`),
    stats: () => api.get("/admin/scrapers/stats"),
    pending: () => api.get("/admin/scrapers/pending"),
    approve: (id) => api.post(`/admin/scrapers/pending/${id}/approve`),
    reject: (id) => api.post(`/admin/scrapers/pending/${id}/reject`),
    insights: () => api.get("/admin/scrapers/insights"),
  },
};
