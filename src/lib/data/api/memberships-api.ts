import type { MemberDetail } from "$model/members/member-detail";
import type { MembershipStatus } from "$model/members/member";
import type { Season } from "$model/shared/season";
import {
  getLocalTimeZone,
  parseAbsolute,
  parseDate,
} from "@internationalized/date";
import { apiFetch } from "$lib/api-client";

export interface AddMembershipRequest {
  memberId: number;
  seasonId: number;
  price: number;
}

export interface AddMembershipResponse {
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
      id: number;
      amount: number;
      currency: string;
      paidAt: string;
      paymentMethod: string;
      transactionRef: string;
    } | null;
  }>;
}

/**
 * Add a new membership period for an existing member
 * @param memberId - The ID of the member
 * @param season - The season object containing start and end dates
 * @param price - The price of the membership
 * @returns The updated member details with all memberships
 */
export async function addMembership(
  memberId: number,
  season: Season,
  price: number,
): Promise<MemberDetail> {
  const request: AddMembershipRequest = {
    memberId,
    seasonId: season.id,
    price,
  };

  const response = await apiFetch("/api/v1.0/memberships", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    // Try to parse error message from response
    let errorMessage = `Failed to add membership: ${response.statusText}`;
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

  const data: AddMembershipResponse = await response.json();

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
      periodId: membership.id,
      price: membership.price,
      payment: membership.payment
        ? {
            id: membership.payment.id,
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
