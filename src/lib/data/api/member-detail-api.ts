import type { MemberDetail } from "$model/members/member-detail";
import {
  getLocalTimeZone,
  parseAbsolute,
  parseDate,
} from "@internationalized/date";

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Fetch member detail by ID from the API
 */
export async function fetchMemberDetail(
  memberId: number,
  season?: string,
): Promise<MemberDetail> {
  const url = new URL(`${API_BASE_URL}/api/v1.0/members/${memberId}`);
  if (season) {
    url.searchParams.set("season", season);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Member with ID ${memberId} not found`);
    }
    throw new Error(`Failed to fetch member detail: ${response.statusText}`);
  }

  const data = await response.json();

  // Transform API response to MemberDetail type
  const memberDetail: MemberDetail = {
    id: data.id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    birthDate: parseDate(data.birthDate),
    addresses: data.addresses.map((address: any) => ({
      country: address.country,
      city: address.city,
      zipCode: address.zipCode,
      street: address.street,
      number: address.streetNumber,
    })),
    phoneNumbers:
      data.phoneNumbers?.map((phone: any) => ({
        number: phone.number,
      })) || [],
    memberships: data.memberships.map((membership: any) => ({
      id: membership.id,
      number: membership.number,
      status: membership.status,
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
