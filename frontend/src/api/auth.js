import { api } from "./client";

export const authApi = {
  signup: (data) => api.post("/auth/signup", data),
  signin: (data) => api.post("/auth/signin", data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  getMe: () => api.get("/auth/me"),
};
