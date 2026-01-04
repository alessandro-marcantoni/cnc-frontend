import type { MemberDetail } from "$model/members/member-detail";

export const mockMemberDetails: Record<number, MemberDetail> = {
  1: {
    id: 1,
    firstName: "Marco",
    lastName: "Rossi",
    birthDate: new Date("1985-03-15"),
    email: "marco.rossi@email.com",
    addresses: [
      {
        country: "Italy",
        city: "Cattolica",
        zipCode: "47841",
        street: "Via Porto",
        number: "12",
      },
    ],
    phoneNumbers: [
      { number: "+39 333 1234567" },
      { number: "+39 0541 123456" },
    ],
    memberships: [
      {
        id: 1,
        number: 1001,
        status: "ACTIVE",
        validFrom: new Date("2020-01-15"),
        expiresAt: new Date("2025-01-15"),
      },
      {
        id: 101,
        number: 1001,
        status: "EXPIRED",
        validFrom: new Date("2015-01-15"),
        expiresAt: new Date("2020-01-15"),
      },
    ],
    rentedFacilities: [
      {
        id: 1,
        facilityIdentifier: "BERTH-A-012",
        facilityName: "Berth A12 - 12m Marina Slip",
        rentedAt: new Date("2023-04-01"),
        expiresAt: new Date("2024-12-31"),
        payment: {
          amount: 3500.0,
          paidAt: new Date("2023-03-28"),
          currency: "EUR",
          paymentMethod: "Bank Transfer",
          transactionRef: "TRX-2023-0428",
        },
      },
      {
        id: 2,
        facilityIdentifier: "LOCKER-B-045",
        facilityName: "Storage Locker B45",
        rentedAt: new Date("2023-06-01"),
        expiresAt: new Date("2024-05-31"),
        payment: {
          amount: 250.0,
          paidAt: new Date("2023-05-30"),
          currency: "EUR",
          paymentMethod: "Credit Card",
          transactionRef: "TRX-2023-0530",
        },
      },
    ],
  },
  2: {
    id: 2,
    firstName: "Laura",
    lastName: "Bianchi",
    birthDate: new Date("1990-07-22"),
    email: "laura.bianchi@email.com",
    addresses: [
      {
        country: "Italy",
        city: "Rimini",
        zipCode: "47921",
        street: "Viale Regina Margherita",
        number: "78",
      },
    ],
    phoneNumbers: [{ number: "+39 347 9876543" }],
    memberships: [
      {
        id: 2,
        number: 1002,
        status: "ACTIVE",
        validFrom: new Date("2021-06-01"),
        expiresAt: new Date("2025-06-01"),
      },
    ],
    rentedFacilities: [
      {
        id: 3,
        facilityIdentifier: "BERTH-C-023",
        facilityName: "Berth C23 - 10m Marina Slip",
        rentedAt: new Date("2023-05-15"),
        expiresAt: new Date("2024-11-15"),
        payment: {
          amount: 2800.0,
          paidAt: new Date("2023-05-10"),
          currency: "EUR",
          paymentMethod: "Bank Transfer",
          transactionRef: "TRX-2023-0510",
        },
      },
    ],
  },
  3: {
    id: 3,
    firstName: "Giuseppe",
    lastName: "Verdi",
    birthDate: new Date("1978-11-03"),
    email: "giuseppe.verdi@email.com",
    addresses: [
      {
        country: "Italy",
        city: "Pesaro",
        zipCode: "61121",
        street: "Via Rossini",
        number: "34",
      },
    ],
    phoneNumbers: [{ number: "+39 339 2468135" }],
    memberships: [
      {
        id: 3,
        number: 1003,
        status: "SUSPENDED",
        validFrom: new Date("2019-09-10"),
        expiresAt: new Date("2024-09-10"),
      },
    ],
    rentedFacilities: [
      {
        id: 4,
        facilityIdentifier: "BERTH-D-007",
        facilityName: "Berth D07 - 15m Marina Slip",
        rentedAt: new Date("2022-03-01"),
        expiresAt: new Date("2024-02-29"),
        payment: {
          amount: 4200.0,
          paidAt: new Date("2022-02-25"),
          currency: "EUR",
          paymentMethod: "Cash",
          transactionRef: null,
        },
      },
      {
        id: 5,
        facilityIdentifier: "WORKSHOP-001",
        facilityName: "Workshop Access - Annual",
        rentedAt: new Date("2023-01-01"),
        expiresAt: new Date("2023-12-31"),
        payment: {
          amount: 500.0,
          paidAt: new Date("2022-12-20"),
          currency: "EUR",
          paymentMethod: "Bank Transfer",
          transactionRef: "TRX-2022-1220",
        },
      },
    ],
  },
  4: {
    id: 4,
    firstName: "Sofia",
    lastName: "Colombo",
    birthDate: new Date("1995-02-18"),
    email: "sofia.colombo@email.com",
    addresses: [
      {
        country: "Italy",
        city: "Bologna",
        zipCode: "40121",
        street: "Via Indipendenza",
        number: "156",
      },
    ],
    phoneNumbers: [{ number: "+39 348 5551234" }],
    memberships: [
      {
        id: 4,
        number: 1004,
        status: "ACTIVE",
        validFrom: new Date("2022-03-20"),
        expiresAt: new Date("2026-03-20"),
      },
    ],
    rentedFacilities: [],
  },
  5: {
    id: 5,
    firstName: "Antonio",
    lastName: "Ferrari",
    birthDate: new Date("1982-12-05"),
    email: "antonio.ferrari@email.com",
    addresses: [
      {
        country: "Italy",
        city: "Ravenna",
        zipCode: "48121",
        street: "Via Dante Alighieri",
        number: "89",
      },
    ],
    phoneNumbers: [{ number: "+39 335 7778899" }],
    memberships: [
      {
        id: 5,
        number: 1005,
        status: "EXPIRED",
        validFrom: new Date("2018-05-12"),
        expiresAt: new Date("2023-05-12"),
      },
    ],
    rentedFacilities: [
      {
        id: 6,
        facilityIdentifier: "BERTH-A-001",
        facilityName: "Berth A01 - 8m Marina Slip",
        rentedAt: new Date("2022-01-01"),
        expiresAt: new Date("2023-12-31"),
        payment: null,
      },
    ],
  },
};
