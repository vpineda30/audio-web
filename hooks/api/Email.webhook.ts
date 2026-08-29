import { request } from "./api";

export const emailWebhook = {
  resendVerification(email: string) {
    return request<{ message: string }>('/email/resend-verification', {
      method: 'POST',
      body: { email },
    });
  },

  verifyEmail(token: string) {
    return request<{ message: string }>(`/verify-email?token=${encodeURIComponent(token)}`);
  },

  forgotPassword(email: string) {
    return request<{ message: string }>("/email/forgot-password", {
      method: "POST",
      body: { email },
    });
  },

  resetPassword(token: string, password: string) {
    return request<{ message: string }>("/email/reset-password", {
      method: "POST",
      body: { token, password },
    });
  },
};
