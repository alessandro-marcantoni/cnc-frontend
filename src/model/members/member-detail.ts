import type { DateValue } from "@internationalized/date";
import type { Address, Membership, PhoneNumber } from "./member";

export type MemberDetail = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: DateValue;
  email: string;
  addresses: Address[];
  phoneNumbers: PhoneNumber[];
  memberships: Membership[];
};
