export type Member = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: Date;
  email: string;
  addresses: Address[];
  phoneNumbers: PhoneNumber[];
  membership: Membership;
};

export type Address = {
  country: string;
  city: string;
  zipCode: string;
  street: string;
  number: string;
};

export type PhoneNumber = {
  number: string;
};

export type Membership = {
  id: number;
  number: number;
  status: MembershipStatus;
  validFrom: Date;
  expiresAt: Date;
};

export type MembershipStatus = "ACTIVE" | "SUSPENDED" | "EXPIRED";
