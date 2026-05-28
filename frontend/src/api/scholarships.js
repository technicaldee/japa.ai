import { api } from "./client";

export const scholarshipApi = {
  list: () => api.get("/scholarships"),
  get: (id) => api.get(`/scholarships/${id}`),
};
