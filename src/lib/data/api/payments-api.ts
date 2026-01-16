import type { Payment } from "$model/payments/payment";
import {
  getLocalTimeZone,
  parseAbsolute,
} from "@internationalized/date";

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export interface CreatePaymentRequest {
  membershipPeriodId?: number | null;
  rentedFacilityId?: number | null;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionRef?: string | null;
}

export interface UpdatePaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionRef?: string | null;
}

export interface CreatePaymentResponse {
  id: number;
}

/**
 * Create a new payment for a membership period or rented facility
 * @param request - The payment creation request data
 * @returns The created payment ID
 */
export async function createPayment(
  request: CreatePaymentRequest,
): Promise<CreatePaymentResponse> {
  const url = `${API_BASE_URL}/api/v1.0/payments`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    // Try to parse error message from response
    let errorMessage = `Failed to create payment: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If parsing fails, use the default message
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

/**
 * Update an existing payment
 * @param paymentId - The ID of the payment to update
 * @param request - The payment update request data
 * @returns Success status
 */
export async function updatePayment(
  paymentId: number,
  request: UpdatePaymentRequest,
): Promise<{ success: boolean }> {
  const url = `${API_BASE_URL}/api/v1.0/payments/${paymentId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    // Try to parse error message from response
    let errorMessage = `Failed to update payment: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If parsing fails, use the default message
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

/**
 * Delete a payment
 * @param paymentId - The ID of the payment to delete
 * @returns Success status
 */
export async function deletePayment(
  paymentId: number,
): Promise<{ success: boolean }> {
  const url = `${API_BASE_URL}/api/v1.0/payments/${paymentId}`;

  const response = await fetch(url, {
    method: "DELETE",
  });

  if (!response.ok) {
    // Try to parse error message from response
    let errorMessage = `Failed to delete payment: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If parsing fails, use the default message
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}
