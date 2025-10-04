# Sourdough App - API Documentation

## Base URL

```
Development: http://localhost:3001/api
Production: https://api.yourapp.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens expire after 7 days and are obtained through login/register endpoints.

---

## Authentication Endpoints

### Register a New User

**Endpoint:** `POST /auth/register`

**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "USER"
  }
}
```

**Error Responses:**
- `400` - Email and password required
- `409` - Email already registered
- `500` - Internal server error

---

### Login

**Endpoint:** `POST /auth/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "USER"
  }
}
```

**Error Responses:**
- `400` - Email and password required
- `401` - Invalid credentials
- `500` - Internal server error

---

### Google OAuth

**Endpoint:** `POST /auth/oauth/google`

**Access:** Public

**Request Body:**
```json
{
  "idToken": "google-id-token-from-frontend"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "USER",
    "displayName": "John Doe",
    "avatarUrl": "https://..."
  }
}
```

**Error Responses:**
- `400` - Missing idToken
- `401` - Invalid Google credentials
- `500` - Internal server error

---

## Recipe Endpoints

### Create Recipe

**Endpoint:** `POST /recipes`

**Access:** Protected

**Request Body:**
```json
{
  "name": "Basic Sourdough",
  "notes": "My go-to recipe",
  "totalWeight": 1000,
  "hydrationPct": 75,
  "saltPct": 2,
  "steps": [
    {
      "stepTemplateId": 1,
      "order": 1,
      "description": "Mix ingredients",
      "ingredients": [
        {
          "ingredientId": 1,
          "amount": 100,
          "calculationMode": "PERCENTAGE",
          "preparation": "bread flour"
        }
      ],
      "parameterValues": [
        {
          "parameterId": 1,
          "value": "75"
        }
      ]
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": 42,
  "name": "Basic Sourdough",
  "notes": "My go-to recipe",
  "totalWeight": 1000,
  "hydrationPct": 75,
  "saltPct": 2,
  "createdAt": "2025-10-04T12:00:00Z",
  "steps": [...]
}
```

**Error Responses:**
- `400` - Recipe name is required / Invalid input
- `401` - Unauthorized (missing/invalid token)
- `500` - Failed to create recipe

---

### Get All Recipes

**Endpoint:** `GET /recipes`

**Access:** Protected

**Query Parameters:**
- `active=true` - Filter by active recipes only (default: true)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Basic Sourdough",
    "totalWeight": 1000,
    "hydrationPct": 75,
    "saltPct": 2,
    "isPredefined": false,
    "createdAt": "2025-10-04T12:00:00Z"
  },
  ...
]
```

---

### Get Single Recipe (Full Details)

**Endpoint:** `GET /recipes/:id/full`

**Access:** Protected

**Parameters:**
- `id` - Recipe ID (integer)

**Response (200 OK):**
```json
{
  "id": 42,
  "name": "Basic Sourdough",
  "notes": "My go-to recipe",
  "totalWeight": 1000,
  "hydrationPct": 75,
  "saltPct": 2,
  "steps": [
    {
      "id": 1,
      "order": 1,
      "stepTemplateId": 5,
      "description": "Mix ingredients",
      "ingredients": [...],
      "parameterValues": [...]
    }
  ]
}
```

**Error Responses:**
- `400` - Invalid recipe id
- `404` - Recipe not found
- `401` - Unauthorized
- `500` - Failed to fetch recipe

---

### Update Recipe

**Endpoint:** `PUT /recipes/:id`

**Access:** Protected (owner only)

**Request Body:** Same as create recipe

**Response (200 OK):** Updated recipe object

**Error Responses:**
- `400` - Invalid recipe id / Invalid input
- `404` - Recipe not found
- `401` - Unauthorized
- `403` - Not the recipe owner
- `500` - Failed to update recipe

---

### Delete Recipe (Soft Delete)

**Endpoint:** `DELETE /recipes/:id`

**Access:** Protected (owner only)

**Response (200 OK):**
```json
{
  "message": "Recipe deleted successfully"
}
```

**Error Responses:**
- `400` - Invalid recipe id
- `404` - Recipe not found
- `401` - Unauthorized
- `403` - Not the recipe owner
- `500` - Failed to delete recipe

---

## Bake Endpoints

### Get Active Bakes

**Endpoint:** `GET /bakes/active`

**Access:** Protected

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "recipeId": 42,
    "startTimestamp": "2025-10-04T08:00:00Z",
    "active": true,
    "recipe": { "name": "Basic Sourdough" },
    "steps": [...]
  }
]
```

---

### Get All Bakes (History)

**Endpoint:** `GET /bakes`

**Access:** Protected

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "recipeId": 42,
    "startTimestamp": "2025-10-04T08:00:00Z",
    "finishTimestamp": "2025-10-04T20:00:00Z",
    "active": false,
    "rating": 5,
    "recipe": { "name": "Basic Sourdough" },
    "stepCount": 8
  }
]
```

---

### Get Single Bake Details

**Endpoint:** `GET /bakes/:bakeId`

**Access:** Protected (owner only)

**Response (200 OK):**
```json
{
  "id": 1,
  "recipeId": 42,
  "startTimestamp": "2025-10-04T08:00:00Z",
  "active": true,
  "notes": "First attempt",
  "recipeTotalWeightSnapshot": 1000,
  "recipeHydrationPctSnapshot": 75,
  "recipeSaltPctSnapshot": 2,
  "steps": [
    {
      "id": 1,
      "order": 1,
      "status": "COMPLETED",
      "startTimestamp": "2025-10-04T08:00:00Z",
      "finishTimestamp": "2025-10-04T08:30:00Z",
      "parameterValues": [...],
      "ingredients": [...]
    }
  ]
}
```

---

### Start New Bake

**Endpoint:** `POST /bakes`

**Access:** Protected

**Request Body:**
```json
{
  "recipeId": 42,
  "notes": "First attempt with new starter"
}
```

**Response (201 Created):** Full bake object with all steps in PENDING status

**Error Responses:**
- `400` - Recipe ID is required
- `404` - Recipe not found
- `401` - Unauthorized
- `500` - Failed to create bake

---

### Update Bake Notes

**Endpoint:** `PUT /bakes/:bakeId/notes`

**Access:** Protected (owner only)

**Request Body:**
```json
{
  "notes": "Updated notes about the bake"
}
```

**Response (200 OK):** Updated bake object

---

### Update Bake Rating

**Endpoint:** `PUT /bakes/:bakeId/rating`

**Access:** Protected (owner only)

**Request Body:**
```json
{
  "rating": 5
}
```

**Response (200 OK):** Updated bake object

---

### Start Bake Step

**Endpoint:** `PUT /bakes/:bakeId/steps/:stepId/start`

**Access:** Protected (owner only)

**Response (200 OK):** Updated step with status IN_PROGRESS and startTimestamp

---

### Complete Bake Step

**Endpoint:** `PUT /bakes/:bakeId/steps/:stepId/complete`

**Access:** Protected (owner only)

**Request Body:**
```json
{
  "actualParameterValues": {
    "1": "76.5",
    "2": "22"
  },
  "notes": "Used slightly warmer water",
  "deviations": { "temperature": "higher than planned" }
}
```

**Response (200 OK):** Updated step with status COMPLETED and finishTimestamp

---

### Skip Bake Step

**Endpoint:** `PUT /bakes/:bakeId/steps/:stepId/skip`

**Access:** Protected (owner only)

**Response (200 OK):** Updated step with status SKIPPED

---

### Cancel Bake

**Endpoint:** `PUT /bakes/:bakeId/cancel`

**Access:** Protected (owner only)

**Response (200 OK):** Updated bake with active=false

---

### Complete Bake

**Endpoint:** `PUT /bakes/:bakeId/complete`

**Access:** Protected (owner only)

**Response (200 OK):** Updated bake with active=false and finishTimestamp

---

## Metadata Endpoints

### Get All Step Templates

**Endpoint:** `GET /meta/step-templates`

**Access:** Protected

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Autolyse",
    "stepTypeId": 1,
    "description": "Rest flour and water",
    "advanced": false,
    "role": "AUTOLYSE"
  }
]
```

---

### Get All Ingredients

**Endpoint:** `GET /meta/ingredients`

**Access:** Protected

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Bread Flour",
    "ingredientCategoryId": 1,
    "advanced": false
  }
]
```

---

### Get Ingredient Categories

**Endpoint:** `GET /meta/ingredient-categories`

**Access:** Protected

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Flour",
    "advanced": false
  }
]
```

---

## Error Response Format

All errors follow this format:

```json
{
  "status": "error",
  "message": "Human-readable error message",
  "details": "Optional additional details"
}
```

### HTTP Status Codes

- `200` - OK (successful GET, PUT, DELETE)
- `201` - Created (successful POST)
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid auth token)
- `403` - Forbidden (authenticated but not authorized)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal Server Error

---

## Rate Limiting

**Limits:**
- General endpoints: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 requests per 15 minutes per IP

**Headers:**
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Time when limit resets

---

## Example Usage

### Complete Flow: Create Recipe and Start Bake

```bash
# 1. Register/Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response: { "token": "...", "user": {...} }

# 2. Get metadata
curl http://localhost:3001/api/meta/step-templates \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Create recipe
curl -X POST http://localhost:3001/api/recipes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Sourdough",
    "totalWeight": 1000,
    "hydrationPct": 75,
    "saltPct": 2,
    "steps": [...]
  }'

# 4. Start bake
curl -X POST http://localhost:3001/api/bakes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipeId": 42, "notes": "First attempt"}'

# 5. Start first step
curl -X PUT http://localhost:3001/api/bakes/1/steps/1/start \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. Complete step with actual values
curl -X PUT http://localhost:3001/api/bakes/1/steps/1/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actualParameterValues": {"1": "75"},
    "notes": "Went smoothly"
  }'
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All endpoints use JSON for request/response bodies
- CORS is configured for specific frontend origins
- Remember to include proper Content-Type headers

---

**Last Updated:** October 4, 2025

**Version:** 1.0.0
