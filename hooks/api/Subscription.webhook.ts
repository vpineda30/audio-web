import { request } from "./api";

export const subscriptionWebhook = {
  createCheckoutSession(
    plan: string,
    options?: {
      successUrl?: string;
      cancelUrl?: string;
    },
  ) {
    return request("/payment/create-checkout-session", {
      method: "POST",
      body: {
        plan,
        ...(options?.successUrl ? { successUrl: options.successUrl } : {}),
        ...(options?.cancelUrl ? { cancelUrl: options.cancelUrl } : {}),
      },
    });
  },

  createBillingPortalSession(
  ) {
    return request("/payment/create-billing-portal-session", {
      method: "POST",
      body: {
      },
    });
  },

  updateSubscriptionPlan(
    plan: string
  ) {
    return request("/payment/update-plan", {
      method: "POST",
      body: {
        plan,
      },
    });
  },

  cancelSubscription(reason?: string) {
    return request<{
      message: string;
      subscriptionId?: string;
      status?: string;
      cancelAtPeriodEnd?: boolean;
      cancelAt?: number | null;
      currentPeriodEnd?: number;
    }>('/payment/cancel-subscription', {
      method: "POST",
      body: reason ? { reason } : undefined,
    });
  },
};