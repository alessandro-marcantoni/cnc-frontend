import type { RentedFacility } from "$model/facilities/rented-facility";

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Fetch rented facilities for a specific member from the API
 */
export async function fetchRentedFacilities(memberId: number): Promise<RentedFacility[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1.0/facilities/rented?member_id=${memberId}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch rented facilities: ${response.statusText}`);
  }

  const data = await response.json();

  // Transform API response to RentedFacility type
  const rentedFacilities: RentedFacility[] = data.map((facility: any) => ({
    id: facility.id,
    facilityId: facility.facilityId,
    facilityIdentifier: facility.facilityIdentifier,
    facilityName: facility.facilityName,
    facilityTypeDescription: facility.facilityTypeDescription,
    rentedAt: new Date(facility.rentedAt),
    expiresAt: new Date(facility.expiresAt),
    payment: facility.payment
      ? {
          amount: facility.payment.amount,
          currency: facility.payment.currency,
          paidAt: facility.payment.paidAt,
          paymentMethod: facility.payment.paymentMethod,
          transactionRef: facility.payment.transactionRef,
        }
      : null,
    boatInfo: facility.boatInfo
      ? {
          name: facility.boatInfo.name,
          lengthMeters: facility.boatInfo.lengthMeters,
          widthMeters: facility.boatInfo.widthMeters,
        }
      : null,
  }));

  return rentedFacilities;
}
