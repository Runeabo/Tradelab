// This service assumes you have a backend running on http://localhost:8000
// with the specified billing endpoints.

const API_BASE_URL = 'http://localhost:8000';

/**
 * Creates a Stripe Checkout session for a given plan.
 * @param plan - The plan identifier, e.g., "pro_monthly" or "pro_yearly".
 * @param token - The user's JWT for authentication.
 * @returns The URL for the Stripe Checkout page.
 */
export const createCheckoutSession = async (plan: 'pro_monthly' | 'pro_yearly', token: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/billing/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ plan }),
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session.');
  }

  const data = await response.json();
  return data.checkout_url;
};

/**
 * Creates a Stripe Customer Portal session for the user to manage their subscription.
 * @param token - The user's JWT for authentication.
 * @returns The URL for the Stripe Customer Portal.
 */
export const createPortalSession = async (token: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/billing/portal`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to create portal session.');
  }

  const data = await response.json();
  return data.portal_url;
};
