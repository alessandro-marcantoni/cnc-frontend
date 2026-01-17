import type { Member } from "$model/members/member";

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export interface WaitlistEntry {
  id: number;
  memberId: number;
  facilityTypeId: number;
  queuedAt: string;
  notes?: string;
}

export interface WaitlistResponse {
  facilityTypeId: number;
  entries: WaitlistEntry[];
}

export interface WaitlistMemberDetail extends WaitlistEntry {
  memberName: string;
  memberEmail: string;
  position: number;
}

export interface AddToWaitlistRequest {
  memberId: number;
  facilityTypeId: number;
  notes?: string;
}

/**
 * Fetch the waiting list for a specific facility type
 */
export async function fetchWaitlist(
  facilityTypeId: number,
): Promise<WaitlistResponse> {
  const url = `${API_BASE_URL}/api/v1.0/facilities/waiting-list?facility_type_id=${facilityTypeId}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      // No waitlist entries found, return empty list
      return {
        facilityTypeId,
        entries: [],
      };
    }
    throw new Error(`Failed to fetch waitlist: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Add a member to the waiting list for a facility type
 */
export async function addToWaitlist(
  request: AddToWaitlistRequest,
): Promise<WaitlistEntry> {
  const url = `${API_BASE_URL}/api/v1.0/facilities/waiting-list`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    // Try to parse error message from response
    let errorMessage = `Failed to add to waitlist: ${response.statusText}`;
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
 * Remove a member from the waiting list
 */
export async function removeFromWaitlist(
  memberId: number,
  facilityTypeId: number,
): Promise<WaitlistEntry> {
  const url = `${API_BASE_URL}/api/v1.0/facilities/waiting-list?member_id=${memberId}&facility_type_id=${facilityTypeId}`;

  const response = await fetch(url, {
    method: "DELETE",
  });

  if (!response.ok) {
    // Try to parse error message from response
    let errorMessage = `Failed to remove from waitlist: ${response.statusText}`;
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
 * Fetch the waiting list with enriched member details
 * This function combines waitlist data with member information
 */
export async function fetchWaitlistWithDetails(
  facilityTypeId: number,
  members: Member[],
): Promise<WaitlistMemberDetail[]> {
  const waitlistData = await fetchWaitlist(facilityTypeId);

  // Enrich waitlist entries with member details
  const enrichedEntries: WaitlistMemberDetail[] = waitlistData.entries.map(
    (entry, index) => {
      const member = members.find((m) => m.id === entry.memberId);

      return {
        ...entry,
        memberName: member
          ? `${member.firstName} ${member.lastName}`
          : "Unknown Member",
        memberEmail: "",
        position: index + 1,
      };
    },
  );

  return enrichedEntries;
}
