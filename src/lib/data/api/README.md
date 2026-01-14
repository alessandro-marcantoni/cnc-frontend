# API Layer

This directory contains all the API communication logic for the CNC frontend application. The API layer is responsible for making HTTP requests to the backend and transforming the responses into the appropriate TypeScript types.

## Structure

```
api/
├── index.ts                  # Central export point for all API functions
├── members-api.ts            # Members list API calls
├── member-detail-api.ts      # Individual member details API calls
├── create-member-api.ts      # Create new member API calls
└── facilities-api.ts         # Facilities-related API calls
```

## Purpose

The API layer serves to:

1. **Separate concerns**: Keep HTTP logic separate from state management (repositories)
2. **Type safety**: Transform raw API responses into typed domain models
3. **Reusability**: API functions can be used by multiple repositories or components
4. **Testability**: Easier to mock and test API calls in isolation
5. **Maintainability**: Single source of truth for API endpoints and transformations

## Usage

### Importing API Functions

```typescript
// Import specific functions
import { fetchMembers, fetchMemberDetail } from "$lib/data/api";

// Or import from specific modules
import { fetchMembers } from "$lib/data/api/members-api";
```

### Example: Fetching Members

```typescript
import { fetchMembers } from "$lib/data/api";

try {
  const members = await fetchMembers();
  // members is typed as Member[]
  console.log(members);
} catch (error) {
  console.error("Failed to fetch members:", error);
}
```

### Example: Fetching Member Details

```typescript
import { fetchMemberDetail } from "$lib/data/api";

try {
  const memberDetail = await fetchMemberDetail(123);
  // memberDetail is typed as MemberDetail
  console.log(memberDetail);
} catch (error) {
  console.error("Failed to fetch member detail:", error);
}
```

### Example: Creating a Member

```typescript
import { createMember, type CreateMemberRequest } from "$lib/data/api";

try {
  const request: CreateMemberRequest = {
    firstName: "Mario",
    lastName: "Rossi",
    birthDate: "1990-01-15",
    email: "mario.rossi@example.com",
    phoneNumbers: [{ prefix: "+39", number: "3331234567" }],
    addresses: [
      {
        country: "Italia",
        city: "Roma",
        street: "Via Roma",
        streetNumber: "123",
        zipCode: "00100",
      },
    ],
    createMembership: true,
    seasonId: 2024,
    price: 130.0,
  };

  const newMember = await createMember(request);
  // newMember is typed as MemberDetail
  console.log("Member created:", newMember);
} catch (error) {
  console.error("Failed to create member:", error);
}
```

### Example: Fetching Rented Facilities

```typescript
import { fetchRentedFacilities } from "$lib/data/api";

try {
  const facilities = await fetchRentedFacilities(123);
  // facilities is typed as RentedFacility[]
  console.log(facilities);
} catch (error) {
  console.error("Failed to fetch rented facilities:", error);
}
```

## Configuration

All API modules use the same base URL configuration:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
```

This can be configured in your `.env` file:

```
VITE_API_URL=http://localhost:8080
```

## API Functions

### `fetchMembers(season?: string)`

Fetches all members from the backend.

- **Parameters**:
  - `season` (optional): Season name to filter members by
- **Returns**: `Promise<Member[]>`
- **Endpoint**: `GET /api/v1.0/members`
- **Transforms**: API response to `Member[]` with date parsing

### `fetchMemberDetail(memberId: number, season?: string)`

Fetches detailed information for a specific member.

- **Parameters**:
  - `memberId`: The ID of the member to fetch
  - `season` (optional): Season name to filter membership data
- **Returns**: `Promise<MemberDetail>`
- **Endpoint**: `GET /api/v1.0/members/:memberId`
- **Transforms**: API response to `MemberDetail` with date parsing and nested objects

### `createMember(request: CreateMemberRequest)`

Creates a new member in the system.

- **Parameters**:
  - `request`: Object containing member information:
    - `firstName`: Member's first name
    - `lastName`: Member's last name
    - `birthDate`: Birth date in ISO format (YYYY-MM-DD)
    - `email`: Member's email address
    - `phoneNumbers`: Array of phone numbers with prefix and number
    - `addresses`: Array of address objects
    - `createMembership`: Boolean indicating if a membership should be created
    - `seasonId` (optional): Season ID if creating membership
    - `price` (optional): Membership price if creating membership
- **Returns**: `Promise<MemberDetail>`
- **Endpoint**: `POST /api/v1.0/members`
- **Transforms**: API response to `MemberDetail` with date parsing
- **Error handling**: Throws descriptive errors for validation or server errors

### `fetchRentedFacilities(memberId: number)`

Fetches all facilities rented by a specific member.

- **Parameters**:
  - `memberId`: The ID of the member
- **Returns**: `Promise<RentedFacility[]>`
- **Endpoint**: `GET /api/v1.0/facilities/rented?member_id={memberId}`
- **Transforms**: API response to `RentedFacility[]` with date parsing and optional fields

## Error Handling

All API functions throw errors when requests fail. The error messages include:

- HTTP status information (e.g., "Failed to fetch members: Not Found")
- Specific 404 errors for individual resources
- Network errors

It's recommended to wrap API calls in try-catch blocks:

```typescript
try {
  const data = await fetchMembers();
  // Handle success
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }
  // Handle error
}
```

## Data Transformation

The API layer is responsible for transforming raw JSON responses into properly typed objects:

- **Date parsing**: Converts ISO date strings to `Date` or `DateValue` objects
- **Field mapping**: Maps API field names to domain model properties (e.g., `streetNumber` → `number`)
- **Optional fields**: Handles nullable fields appropriately (e.g., `payment`, `boatInfo`)
- **Nested objects**: Properly structures nested data (addresses, phone numbers, memberships)

## Best Practices

1. **Keep it simple**: API functions should only handle HTTP requests and transformations
2. **Don't add business logic**: Business logic belongs in repositories or services
3. **Type everything**: Always return properly typed domain models
4. **Handle errors gracefully**: Throw descriptive errors for debugging
5. **Document parameters**: Use JSDoc comments for function parameters
6. **Consistent naming**: Use `fetch*` prefix for all API functions

## Relationship with Repositories

The API layer works in conjunction with the repository layer:

- **API Layer**: Handles HTTP requests and data transformation
- **Repository Layer**: Manages caching, state management, and provides reactive stores

```
Component → Repository → API → Backend
         ← Store      ← Transform ← Response
```

## Adding New API Functions

When adding a new API function:

1. Create a new file or add to an existing one (e.g., `new-feature-api.ts`)
2. Define the function with proper TypeScript types
3. Use the shared `API_BASE_URL` configuration
4. Transform the response to match domain models
5. Export the function in `index.ts`
6. Document the function in this README

Example:

```typescript
// new-feature-api.ts
import type { NewFeature } from "$model/new-feature";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Fetch new feature data
 */
export async function fetchNewFeature(id: number): Promise<NewFeature> {
  const response = await fetch(`${API_BASE_URL}/api/v1.0/new-feature/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch new feature: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    name: data.name,
    // ... transform other fields
  };
}
```

Then export it in `index.ts`:

```typescript
export { fetchNewFeature } from "./new-feature-api";
```
