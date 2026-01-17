import type { Member } from "$model/members/member";
import { parseDate } from "@internationalized/date";

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Fetch all members from the API
 * @param season - Optional season name to filter members by
 */
export async function fetchMembers(season?: string): Promise<Member[]> {
  const url = new URL(`${API_BASE_URL}/api/v1.0/members`);
  if (season) {
    url.searchParams.set("season", season);
  }

  const response = await fetch(url.toString());

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
