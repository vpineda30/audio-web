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

  test() {
    return request<{ message: string }>("/test", {
    });
  },
};