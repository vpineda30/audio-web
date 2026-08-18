import { request } from "./api";

export const subscriptionWebhook = {
  createCheckoutSession(
    token: string,
    userId: string,
    plan: string
  ) {
    return request("/payment/create-checkout-session", {
      method: "POST",
      token,
      body: {
        userId,
        plan,
      },
    });
  },

  createBillingPortalSession(
    token: string,
    userId: string
  ) {
    return request("/payment/create-billing-portal-session", {
      method: "POST",
      token,
      body: {
        userId,
      },
    });
  },

  updateSubscriptionPlan(
    token: string,
    userId: string,
    plan: string
  ) {
    return request("/payment/update-plan", {
      method: "POST",
      token,
      body: {
        userId,
        plan,
      },
    });
  },

  cancelSubscription(
    token: string,
    userId: string
  ) {
    return request("/payment/cancel-subscription", {
      method: "POST",
      token,
      body: {
        userId,
      },
    });
  },
};