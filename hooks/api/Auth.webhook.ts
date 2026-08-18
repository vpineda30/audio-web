import { request } from "./api";

export const authWebhook = {
  login(email: string, password: string) {
    return request<{ token: string, userId: string }>("/auth/login", {
      method: "POST",
      body: {
        email,
        password,
      },
    });
  },

  test(token: string) {
    return request<{ message: string }>("/test", {
      token,
    });
  },
};