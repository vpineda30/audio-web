import { request } from "./api";

export const authWebhook = {
  login(email: string, password: string) {
    return request<{ message: string; userId?: string }>("/auth/login", {
      method: "POST",
      body: {
        email,
        password,
      },
    });
  },

  logout() {
    return request<{ message: string }>('/auth/logout', { method: 'POST' });
  },

  test() {
    return request<{ message: string }>("/test", {
    });
  },
};