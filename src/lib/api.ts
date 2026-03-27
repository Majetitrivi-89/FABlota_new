import { supabase } from "@/integrations/supabase/client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Utility to make authenticated requests to the Render backend
 */
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API Request Failed');
  }

  return response.json();
}

/**
 * Payment API Helper
 */
export const paymentsApi = {
  createIntent: (amount: number, currency: string = 'inr') => 
    apiRequest('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ amount, currency }),
    }),
};

/**
 * Admin API Helper
 */
export const adminApi = {
  getStats: () => apiRequest('/admin/stats'),
  getAllUsers: () => apiRequest('/admin/users'),
};
