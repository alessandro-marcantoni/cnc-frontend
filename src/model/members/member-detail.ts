import type { RentedFacility } from "$model/facilities/rented-facility";
import type { Address, Membership, PhoneNumber } from "./member";

export type MemberDetail = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: Date;
  email: string;
  addresses: Address[];
  phoneNumbers: PhoneNumber[];
  memberships: Membership[];
  rentedFacilities: RentedFacility[];
};
