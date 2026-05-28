import { api } from "./client";

export const digestApi = {
  get: () => api.get("/digest"),
};
