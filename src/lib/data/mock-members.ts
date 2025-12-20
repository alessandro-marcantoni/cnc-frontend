import type { Member } from "$model/members/member";

export const mockMembers: Member[] = [
    {
        id: 1,
        firstName: "James",
        lastName: "Morrison",
        birthDate: new Date("1975-05-12"),
        email: "james.morrison@email.com",
        addresses: [
            {
                country: "Italy",
                city: "Cattolica",
                zipCode: "47841",
                street: "Via Roma",
                number: "15",
            },
        ],
        phoneNumbers: [
            {
                number: "+39 338 1234567",
            },
        ],
        membership: {
            id: 1,
            number: 1001,
            status: "ACTIVE",
            validFrom: new Date("2018-03-15"),
            expiresAt: new Date("2025-03-15"),
        },
    },
    {
        id: 2,
        firstName: "Sarah",
        lastName: "Mitchell",
        birthDate: new Date("1982-08-23"),
        email: "sarah.mitchell@email.com",
        addresses: [
            {
                country: "Italy",
                city: "Rimini",
                zipCode: "47921",
                street: "Viale Regina Elena",
                number: "42",
            },
        ],
        phoneNumbers: [
            {
                number: "+39 349 9876543",
            },
        ],
        membership: {
            id: 2,
            number: 1002,
            status: "ACTIVE",
            validFrom: new Date("2019-06-22"),
            expiresAt: new Date("2025-06-22"),
        },
    },
    {
        id: 3,
        firstName: "Robert",
        lastName: "Chen",
        birthDate: new Date("1988-11-30"),
        email: "robert.chen@email.com",
        addresses: [
            {
                country: "Italy",
                city: "Riccione",
                zipCode: "47838",
                street: "Via Dante",
                number: "78",
            },
        ],
        phoneNumbers: [
            {
                number: "+39 340 5551234",
            },
        ],
        membership: {
            id: 3,
            number: 1003,
            status: "ACTIVE",
            validFrom: new Date("2020-01-10"),
            expiresAt: new Date("2025-01-10"),
        },
    },
    {
        id: 4,
        firstName: "Emma",
        lastName: "Thompson",
        birthDate: new Date("1970-04-18"),
        email: "emma.thompson@email.com",
        addresses: [
            {
                country: "Italy",
                city: "Cattolica",
                zipCode: "47841",
                street: "Via Mazzini",
                number: "23",
            },
        ],
        phoneNumbers: [
            {
                number: "+39 335 7778899",
            },
        ],
        membership: {
            id: 4,
            number: 1004,
            status: "SUSPENDED",
            validFrom: new Date("2017-09-05"),
            expiresAt: new Date("2024-09-05"),
        },
    },
    {
        id: 5,
        firstName: "Michael",
        lastName: "Rodriguez",
        birthDate: new Date("1995-02-14"),
        email: "michael.rodriguez@email.com",
        addresses: [
            {
                country: "Italy",
                city: "Pesaro",
                zipCode: "61121",
                street: "Corso XI Settembre",
                number: "101",
            },
        ],
        phoneNumbers: [
            {
                number: "+39 342 3334455",
            },
        ],
        membership: {
            id: 5,
            number: 1005,
            status: "ACTIVE",
            validFrom: new Date("2021-04-18"),
            expiresAt: new Date("2025-04-18"),
        },
    },
    {
        id: 6,
        firstName: "Patricia",
        lastName: "Williams",
        birthDate: new Date("1968-12-08"),
        email: "patricia.williams@email.com",
        addresses: [
            {
                country: "Italy",
                city: "Gabicce Mare",
                zipCode: "61011",
                street: "Via Panoramica",
                number: "56",
            },
        ],
        phoneNumbers: [
            {
                number: "+39 338 6667788",
            },
        ],
        membership: {
            id: 6,
            number: 1006,
            status: "EXPIRED",
            validFrom: new Date("2016-11-30"),
            expiresAt: new Date("2023-11-30"),
        },
    },
    {
        id: 7,
        firstName: "David",
        lastName: "Anderson",
        birthDate: new Date("1990-07-25"),
        email: "david.anderson@email.com",
        addresses: [
            {
                country: "Italy",
                city: "Cattolica",
                zipCode: "47841",
                street: "Via Garibaldi",
                number: "89",
            },
        ],
        phoneNumbers: [
            {
                number: "+39 345 1112233",
            },
        ],
        membership: {
            id: 7,
            number: 1007,
            status: "ACTIVE",
            validFrom: new Date("2022-02-14"),
            expiresAt: new Date("2026-02-14"),
        },
    },
    {
        id: 8,
        firstName: "Maria",
        lastName: "Rossi",
        birthDate: new Date("1985-09-10"),
        email: "maria.rossi@email.com",
        addresses: [
            {
                country: "Italy",
                city: "Cattolica",
                zipCode: "47841",
                street: "Via Verdi",
                number: "12",
            },
        ],
        phoneNumbers: [
            {
                number: "+39 347 4445566",
            },
        ],
        membership: {
            id: 8,
            number: 1008,
            status: "ACTIVE",
            validFrom: new Date("2023-01-20"),
            expiresAt: new Date("2027-01-20"),
        },
    },
    {
        id: 9,
        firstName: "Luca",
        lastName: "Bianchi",
        birthDate: new Date("1978-03-05"),
        email: "luca.bianchi@email.com",
        addresses: [
            {
                country: "Italy",
                city: "Misano Adriatico",
                zipCode: "47843",
                street: "Via Platani",
                number: "67",
            },
        ],
        phoneNumbers: [
            {
                number: "+39 339 8889990",
            },
        ],
        membership: {
            id: 9,
            number: 1009,
            status: "SUSPENDED",
            validFrom: new Date("2019-05-15"),
            expiresAt: new Date("2024-05-15"),
        },
    },
    {
        id: 10,
        firstName: "Sofia",
        lastName: "Ferrari",
        birthDate: new Date("1992-11-28"),
        email: "sofia.ferrari@email.com",
        addresses: [
            {
                country: "Italy",
                city: "Rimini",
                zipCode: "47921",
                street: "Via Tripoli",
                number: "34",
            },
        ],
        phoneNumbers: [
            {
                number: "+39 346 2223344",
            },
        ],
        membership: {
            id: 10,
            number: 1010,
            status: "ACTIVE",
            validFrom: new Date("2020-08-10"),
            expiresAt: new Date("2025-08-10"),
        },
    },
    {
        id: 11,
        firstName: "Giovanni",
        lastName: "Greco",
        birthDate: new Date("1965-06-15"),
        email: "giovanni.greco@email.com",
        addresses: [
            {
                country: "Italy",
                city: "Cattolica",
                zipCode: "47841",
                street: "Via Marconi",
                number: "45",
            },
        ],
        phoneNumbers: [
            {
                number: "+39 333 5556677",
            },
        ],
        membership: {
            id: 11,
            number: 1011,
            status: "EXPIRED",
            validFrom: new Date("2015-03-22"),
            expiresAt: new Date("2023-03-22"),
        },
    },
    {
        id: 12,
        firstName: "Francesca",
        lastName: "Romano",
        birthDate: new Date("1987-01-30"),
        email: "francesca.romano@email.com",
        addresses: [
            {
                country: "Italy",
                city: "Riccione",
                zipCode: "47838",
                street: "Viale Ceccarini",
                number: "88",
            },
        ],
        phoneNumbers: [
            {
                number: "+39 348 9990001",
            },
        ],
        membership: {
            id: 12,
            number: 1012,
            status: "ACTIVE",
            validFrom: new Date("2021-07-12"),
            expiresAt: new Date("2025-07-12"),
        },
    },
];
