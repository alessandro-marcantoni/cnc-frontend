import type { Member } from "$model/members/member";
import { parseDate } from "@internationalized/date";
import { apiFetch } from "$lib/api-client";

/**
 * Fetch all members from the API
 * @param season - Optional season name to filter members by
 */
export async function fetchMembers(season?: string): Promise<Member[]> {
  const url = season
    ? `/api/v1.0/members?season=${season}`
    : "/api/v1.0/members";

  const response = await apiFetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch members: ${response.statusText}`);
  }

  const jsonResponse = await response.json();

  const members: Member[] = jsonResponse.map((member: any) => ({
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    birthDate: parseDate(member.birthDate),
    membershipNumber: member.membershipNumber,
    membershipStatus: member.membershipStatus,
    membershipPaid: member.membershipPaid,
    hasUnpaidFacilities: member.hasUnpaidFacilities,
  }));

  return members;
}
