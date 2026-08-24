# GymFlow — API Architecture

**Version:** 1.0.0  
**Date:** 2026-08-24

---

## Table of Contents

1. [API Design Principles](#1-api-design-principles)
2. [Authentication](#2-authentication)
3. [Endpoint Reference](#3-endpoint-reference)
4. [Request / Response Conventions](#4-request--response-conventions)
5. [Error Responses](#5-error-responses)
6. [Rate Limiting](#6-rate-limiting)

---

## 1. API Design Principles

- **RESTful resource-based URLs** under `/api/`.
- **Stateless:** All auth via JWT session cookie; no server-side session state.
- **Versioning:** No explicit version prefix in v1; path prefix `/api/v2/` introduced only on breaking changes.
- **JSON-only:** All request bodies and responses are `application/json`.
- **Pagination:** List endpoints use cursor-based pagination (`cursor` + `limit`).
- **Filtering:** Query parameters for filter; validated with Zod.
- **Idempotency:** Mutation endpoints that may be retried accept an `X-Idempotency-Key` header.
- **CORS:** Restricted to same-origin in production.

---

## 2. Authentication

All endpoints under `/api/` (except `/api/auth/*`) require a valid session.

Auth flow:
1. Client includes session cookie (set by NextAuth).
2. Route handler calls `await auth()` from NextAuth.
3. If no session: return `401 Unauthorized`.
4. `session.user.id` is the `userId` for all downstream queries.

**Rule:** `userId` is **always** derived from the server-validated session. It is **never** accepted as a request parameter.

---

## 3. Endpoint Reference

### Profile

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/profile` | Get current user's profile and computed metrics |
| `PATCH` | `/api/profile` | Update profile fields |
| `POST` | `/api/profile/onboard` | Complete onboarding (idempotent) |
| `GET` | `/api/profile/export` | GDPR data export |
| `DELETE` | `/api/profile` | Account deletion (GDPR) |

**GET /api/profile — Response**
```json
{
  "id": "clx...",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "profile": {
    "dateOfBirth": "1995-03-15",
    "sex": "FEMALE",
    "heightCm": 165,
    "weightUnit": "KG",
    "activityLevel": "MODERATELY_ACTIVE",
    "onboardingComplete": true
  },
  "metrics": {
    "currentWeightKg": 62.5,
    "bmi": 22.96,
    "bmiCategory": "Normal weight",
    "bmr": 1430,
    "tdee": 2217,
    "dailyCalorieTarget": 2017,
    "dailyProteinTargetG": 112
  }
}
```

---

### Routines

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/routines` | List all routines for user |
| `POST` | `/api/routines` | Create a new routine |
| `GET` | `/api/routines/:id` | Get routine with days and exercises |
| `PATCH` | `/api/routines/:id` | Update routine name/description |
| `DELETE` | `/api/routines/:id` | Delete routine |
| `POST` | `/api/routines/:id/activate` | Set as active routine |
| `GET` | `/api/routines/:id/days` | Get all days for a routine |
| `PATCH` | `/api/routines/:id/days/:dayId` | Update a day (label, isRestDay) |
| `GET` | `/api/routines/:id/days/:dayId/exercises` | Get exercises for a day |
| `POST` | `/api/routines/:id/days/:dayId/exercises` | Add exercise to day |
| `PATCH` | `/api/routines/:id/days/:dayId/exercises/:exId` | Update exercise defaults/order |
| `DELETE` | `/api/routines/:id/days/:dayId/exercises/:exId` | Remove exercise from day |
| `PUT` | `/api/routines/:id/days/:dayId/exercises/reorder` | Reorder exercises |

---

### Workout Sessions

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/sessions` | List sessions (paginated, filterable) |
| `POST` | `/api/sessions` | Start a new workout session |
| `GET` | `/api/sessions/:id` | Get session with exercise logs and sets |
| `PATCH` | `/api/sessions/:id` | Update session (notes) |
| `DELETE` | `/api/sessions/:id` | Delete a session |
| `POST` | `/api/sessions/:id/sets` | Log a set (accepts idempotency key) |
| `PATCH` | `/api/sessions/:id/sets/:setId` | Edit a logged set |
| `DELETE` | `/api/sessions/:id/sets/:setId` | Delete a logged set |
| `POST` | `/api/sessions/:id/finish` | Finish the session |
| `POST` | `/api/sessions/:id/abandon` | Abandon the session |

**POST /api/sessions/:id/sets — Request Body**
```json
{
  "exerciseLogId": "clx...",
  "setNumber": 1,
  "targetReps": 10,
  "actualReps": 9,
  "weightKg": 80,
  "notes": "Felt strong"
}
```

**Header:** `X-Idempotency-Key: <uuid>` (required for offline sync)

---

### Exercises

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/exercises` | List exercises (filterable, paginated) |
| `GET` | `/api/exercises/:id` | Get exercise detail |
| `POST` | `/api/exercises/sync` | Admin: re-sync from external API |

**GET /api/exercises Query Params**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Full-text search on name |
| `category` | string | Filter by category |
| `muscleGroup` | string | Filter by primary muscle group |
| `cursor` | string | Pagination cursor |
| `limit` | number | Page size (default 20, max 50) |

**GET /api/exercises/:id — Response**
```json
{
  "id": "clx...",
  "name": "Barbell Bench Press",
  "description": "...",
  "category": "STRENGTH",
  "instructions": ["Step 1...", "Step 2..."],
  "imageUrl": "https://...",
  "videoUrl": null,
  "muscles": [
    { "name": "Chest", "isPrimary": true },
    { "name": "Triceps", "isPrimary": false }
  ]
}
```

---

### Statistics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/stats` | Get statistics for a period |
| `GET` | `/api/stats/records` | Get personal records |

**GET /api/stats Query Params**

| Param | Type | Description |
|-------|------|-------------|
| `period` | `week` \| `month` \| `year` | Time period |
| `date` | ISO date string | Reference date (defaults to today) |

**GET /api/stats — Response**
```json
{
  "period": "week",
  "startDate": "2026-08-18",
  "endDate": "2026-08-24",
  "totalVolume": { "kg": 8450, "display": "8,450 kg" },
  "workoutCount": 4,
  "scheduledCount": 5,
  "frequencyPct": 80,
  "totalDurationSecs": 14400,
  "muscleGroupBreakdown": [
    { "name": "Chest", "sessionCount": 2 }
  ]
}
```

---

### Goals

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/goals` | List all goals |
| `GET` | `/api/goals/active` | Get active goal with progress |
| `POST` | `/api/goals` | Create a goal |
| `PATCH` | `/api/goals/:id` | Update goal |
| `POST` | `/api/goals/:id/archive` | Archive/complete a goal |
| `DELETE` | `/api/goals/:id` | Delete a goal |

**POST /api/goals — Request Body**
```json
{
  "type": "WEIGHT_LOSS",
  "title": "Lose 5 kg by December",
  "targetValue": 70,
  "targetDate": "2026-12-31"
}
```

**GET /api/goals/active — Response**
```json
{
  "id": "clx...",
  "type": "WEIGHT_LOSS",
  "title": "Lose 5 kg by December",
  "status": "ACTIVE",
  "startValue": 75,
  "currentValue": 72.5,
  "targetValue": 70,
  "progressPct": 50,
  "targetDate": "2026-12-31",
  "daysRemaining": 129
}
```

---

### Weight Tracking

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/weight` | Get weight log (paginated) |
| `POST` | `/api/weight` | Log a weight entry |
| `DELETE` | `/api/weight/:id` | Delete a weight entry |

---

### Nutrition

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/nutrition` | Get meal logs for a date |
| `POST` | `/api/nutrition` | Log a meal |
| `DELETE` | `/api/nutrition/:id` | Delete a meal log |
| `GET` | `/api/nutrition/targets` | Get daily calorie + protein targets |

**GET /api/nutrition/targets — Response**
```json
{
  "dailyCalorieTarget": 2017,
  "dailyProteinTargetG": 112,
  "consumed": {
    "calories": 1450,
    "proteinG": 82
  },
  "remaining": {
    "calories": 567,
    "proteinG": 30
  }
}
```

---

### AI Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/ai/optimize` | AI routine optimization |
| `POST` | `/api/ai/insights` | AI progress insights |
| `POST` | `/api/ai/substitute` | AI exercise substitution |

**POST /api/ai/optimize — Response**
```json
{
  "suggestions": [
    {
      "dayId": "clx...",
      "suggestedOrder": ["exerciseId1", "exerciseId2"],
      "rationale": "Compound movements before isolation..."
    }
  ],
  "imbalances": [
    { "type": "NO_POSTERIOR_CHAIN", "message": "No hamstring or back work detected." }
  ],
  "substitutions": []
}
```

> **Important:** AI response is advisory only. No changes are made until the user approves and calls the appropriate PATCH endpoint.

---

### Push Notifications

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/push/subscribe` | Register a push subscription |
| `DELETE` | `/api/push/subscribe` | Unsubscribe |

---

## 4. Request / Response Conventions

### Pagination

```json
{
  "data": [],
  "pagination": {
    "cursor": "clx...",
    "hasMore": true,
    "limit": 20
  }
}
```

### Timestamps

All timestamps returned as ISO 8601 strings in UTC:  
`"2026-08-24T15:30:00.000Z"`

### Weight Values

All weight values returned in **kg** from the API. The client converts to the user's preferred unit using `/src/lib/utils/units.ts`.

---

## 5. Error Responses

All errors follow this structure:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": {
    "fieldErrors": {
      "targetValue": ["Expected number, received string"]
    }
  },
  "requestId": "req_abc123"
}
```

### Standard Error Codes

| Code | HTTP | When |
|------|------|------|
| `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Authenticated but accessing another user's data |
| `NOT_FOUND` | 404 | Resource doesn't exist or doesn't belong to user |
| `VALIDATION_ERROR` | 400 | Zod validation failed |
| `GOAL_ALREADY_ACTIVE` | 409 | Creating a second active goal |
| `SESSION_ALREADY_ACTIVE` | 409 | Starting a workout with IN_PROGRESS session |
| `AI_UNAVAILABLE` | 503 | AI provider returned an error |
| `EXERCISE_API_UNAVAILABLE` | 503 | External exercise API down |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many AI requests |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

---

## 6. Rate Limiting

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| `/api/ai/*` | 10 requests | Per user per hour |
| `/api/sessions/*/sets` | 200 requests | Per user per hour |
| `/api/auth/*` | 10 requests | Per IP per minute |
| All others | 100 requests | Per user per minute |

Rate limiting is implemented using Upstash Redis with a sliding window algorithm.

Headers returned on rate-limited responses:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1724514000
Retry-After: 3600
```
