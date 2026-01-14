import type { MemberDetail } from "$model/members/member-detail";
import type { MembershipStatus } from "$model/members/member";
import {
  getLocalTimeZone,
  parseAbsolute,
  parseDate,
} from "@internationalized/date";

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export interface CreateMemberRequest {
  firstName: string;
  lastName: string;
  birthDate: string; // ISO date string (YYYY-MM-DD)
  email: string;
  phoneNumbers: Array<{
    prefix: string;
    number: string;
  }>;
  addresses: Array<{
    country: string;
    city: string;
    street: string;
    streetNumber: string;
    zipCode: string;
  }>;
  createMembership: boolean;
  seasonId?: number;
  price?: number;
}

export interface CreateMemberResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  phoneNumbers: Array<{
    prefix: string;
    number: string;
  }>;
  addresses: Array<{
    country: string;
    city: string;
    street: string;
    streetNumber: string;
    zipCode: string;
  }>;
  memberships: Array<{
    id: number;
    number: number;
    status: string;
    validFrom: string;
    expiresAt: string;
    price: number;
    payment: {
      amount: number;
      currency: string;
      paidAt: string;
      paymentMethod: string;
      transactionRef: string;
    } | null;
  }>;
}

/**
 * Create a new member via the API
 * @param request - The member creation request data
 * @returns The created member details
 */
export async function createMember(
  request: CreateMemberRequest,
): Promise<MemberDetail> {
  const url = `${API_BASE_URL}/api/v1.0/members`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    // Try to parse error message from response
    let errorMessage = `Failed to create member: ${response.statusText}`;
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

  const data: CreateMemberResponse = await response.json();

  // Transform API response to MemberDetail type
  const memberDetail: MemberDetail = {
    id: data.id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    birthDate: parseDate(data.birthDate),
    addresses: data.addresses.map((address) => ({
      country: address.country,
      city: address.city,
      zipCode: address.zipCode,
      street: address.street,
      number: address.streetNumber,
    })),
    phoneNumbers: data.phoneNumbers.map((phone) => ({
      number: `${phone.prefix}${phone.number}`,
    })),
    memberships: data.memberships.map((membership) => ({
      id: membership.id,
      number: membership.number,
      status: membership.status as MembershipStatus,
      validFrom: parseDate(membership.validFrom),
      expiresAt: parseDate(membership.expiresAt),
      price: membership.price,
      payment: membership.payment
        ? {
            amount: membership.payment.amount,
            currency: membership.payment.currency,
            paidAt: parseAbsolute(
              membership.payment.paidAt,
              getLocalTimeZone(),
            ),
            paymentMethod: membership.payment.paymentMethod,
            transactionRef: membership.payment.transactionRef,
          }
        : null,
    })),
  };

  return memberDetail;
}
