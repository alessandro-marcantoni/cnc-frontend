import type { Member } from "$model/members/member";
import { parseDate } from "@internationalized/date";

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Fetch all members from the API
 */
export async function fetchMembers(): Promise<Member[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1.0/members`);

  if (!response.ok) {
    throw new Error(`Failed to fetch members: ${response.statusText}`);
  }

  const jsonResponse = await response.json();

  const members: Member[] = jsonResponse.map((member: any) => ({
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    birthDate: parseDate(member.birthDate),
    membership: {
      id: member.membership.id,
      status: member.membership.status,
      number: member.membership.number,
      validFrom: parseDate(member.membership.validFrom),
      expiresAt: parseDate(member.membership.expiresAt),
      payment: member.membership.payment
        ? {
            amount: member.membership.payment.amount,
            currency: member.membership.payment.currency,
            paidAt: member.membership.payment.paidAt,
            paymentMethod: member.membership.payment.paymentMethod,
            transactionRef: member.membership.payment.transactionRef,
          }
        : null,
    },
    addresses: member.addresses.map((address: any) => ({
      city: address.city,
      country: address.country,
      street: address.street,
      number: address.streetNumber,
      zipCode: address.zipCode,
    })),
    phoneNumbers: member.phoneNumbers?.map((phone: any) => ({
      number: phone.number,
    })) || [],
  }));

  return members;
}
