# JobHunt API Contract

> **Version:** 1.0.0  
> **Base URL:** Configured via `EXPO_PUBLIC_API_BASE_URL` (mobile) or `VITE_API_BASE_URL` (admin)  
> **Mock flag:** `EXPO_PUBLIC_USE_MOCK=true` (mobile) or `VITE_USE_MOCK=true` (admin)

All requests (except Auth) require:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

All responses follow the envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```
or on failure:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

---

## Error Codes (Global)

| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHORIZED` | 401 | Token missing or invalid |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Request body invalid |
| `SERVER_ERROR` | 500 | Internal server error |
| `USER_BLOCKED` | 403 | User is currently blocked |
| `CONFLICT` | 409 | Duplicate / already-taken resource |

---

## 1. Auth

### POST `/auth/register`
Create a new account (no role choice at signup).

**Request:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "phone": "string (optional)"
}
```

**Response `201`:**
```json
{
  "user": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "phone": "string | null",
    "avatarUrl": "string | null",
    "activeMode": "SEEKER",
    "cancellationCount": 0,
    "isBlocked": false,
    "blockedUntil": null,
    "createdAt": "ISO8601"
  },
  "accessToken": "string",
  "refreshToken": "string"
}
```

**Errors:** `VALIDATION_ERROR`, `CONFLICT` (email already registered)

---

### POST `/auth/login`
```json
{ "email": "string", "password": "string" }
```
**Response `200`:** Same shape as register response.

**Errors:** `VALIDATION_ERROR`, `NOT_FOUND` (user not found), `UNAUTHORIZED` (wrong password), `USER_BLOCKED`

---

### POST `/auth/refresh`
```json
{ "refreshToken": "string" }
```
**Response `200`:**
```json
{ "accessToken": "string", "refreshToken": "string" }
```

---

### POST `/auth/forgot-password`
```json
{ "email": "string" }
```
**Response `200`:**
```json
{ "message": "If that email is registered, a reset link was sent." }
```

---

### POST `/auth/reset-password`
```json
{ "token": "string", "newPassword": "string" }
```
**Response `200`:**
```json
{ "message": "Password updated successfully." }
```

---

### POST `/auth/logout`
```json
{ "refreshToken": "string" }
```
**Response `200`:** `{ "message": "Logged out." }`

---

## 2. User / Profile

### GET `/users/me`
Returns the authenticated user's full profile.

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "phone": "string | null",
  "avatarUrl": "string | null",
  "activeMode": "SEEKER | RECRUITER",
  "cancellationCount": 0,
  "isBlocked": false,
  "blockedUntil": "ISO8601 | null",
  "savedJobIds": ["uuid"],
  "location": {
    "lat": 0.0,
    "lng": 0.0,
    "label": "string"
  },
  "createdAt": "ISO8601"
}
```

---

### PATCH `/users/me`
Update profile fields.

**Request (all optional):**
```json
{
  "name": "string",
  "phone": "string",
  "avatarUrl": "string",
  "location": { "lat": 0.0, "lng": 0.0, "label": "string" }
}
```
**Response `200`:** Updated user object.

---

### PATCH `/users/me/mode`
Switch active mode.

**Request:**
```json
{ "mode": "SEEKER | RECRUITER" }
```

**Response `200`:**
```json
{ "activeMode": "SEEKER | RECRUITER" }
```

**Errors:**
| Code | Meaning |
|------|---------|
| `MODE_LOCK_SEEKER` | Cannot switch: active accepted jobs exist |
| `MODE_LOCK_RECRUITER` | Cannot switch: open/filled posts exist |

**Response body when locked:**
```json
{
  "error": {
    "code": "MODE_LOCK_SEEKER",
    "message": "Complete or cancel all active jobs first.",
    "pendingItems": [
      { "id": "uuid", "title": "string", "status": "ACCEPTED | IN_PROGRESS" }
    ]
  }
}
```

---

### PATCH `/users/me/location`
Update user's current location.

**Request:**
```json
{ "lat": 0.0, "lng": 0.0, "label": "string" }
```
**Response `200`:** `{ "location": { "lat": 0.0, "lng": 0.0, "label": "string" } }`

---

### POST `/users/me/avatar`
Upload profile picture (multipart/form-data, field: `avatar`).

**Response `200`:** `{ "avatarUrl": "string" }`

---

## 3. Jobs

### GET `/jobs`
Browse jobs (for seekers).

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `lat` | float | Seeker's latitude |
| `lng` | float | Seeker's longitude |
| `type` | `SHORT_TERM\|LONG_TERM` | Filter by job type |
| `minPay` | float | Minimum pay |
| `maxPay` | float | Maximum pay |
| `keyword` | string | Title/description search |
| `page` | int | Page number (default 1) |
| `limit` | int | Items per page (default 20) |

**Response `200`:**
```json
{
  "jobs": [
    {
      "id": "uuid",
      "type": "SHORT_TERM | LONG_TERM",
      "title": "string",
      "description": "string",
      "pay": 0.0,
      "payUnit": "PER_HOUR | FIXED | PER_MONTH",
      "openings": 1,
      "filledCount": 0,
      "isRemote": false,
      "approximateDistance": 1.2,
      "location": {
        "lat": 0.0,
        "lng": 0.0,
        "label": "HIDDEN — shown only after accept"
      },
      "startDate": "ISO8601",
      "endDate": "ISO8601 | null",
      "startTime": "HH:MM | null",
      "endTime": "HH:MM | null",
      "status": "OPEN | FILLED | COMPLETED | CANCELLED",
      "postedBy": {
        "id": "uuid",
        "name": "string",
        "avatarUrl": "string | null"
      },
      "isSaved": false,
      "createdAt": "ISO8601"
    }
  ],
  "total": 0,
  "page": 1,
  "totalPages": 1
}
```

> **Note:** `location.label` returns `"HIDDEN"` for on-site jobs until accepted. After accept, returns the real address.

---

### GET `/jobs/:id`
Get a single job's details.

**Response `200`:** Same shape as a single item in the `/jobs` list. If the seeker has accepted this job, `location.label` is the real address.

**Errors:** `NOT_FOUND`

---

### POST `/jobs`
Create a job post (Recruiter mode required).

**Request:**
```json
{
  "type": "SHORT_TERM | LONG_TERM",
  "title": "string",
  "description": "string",
  "pay": 0.0,
  "payUnit": "PER_HOUR | FIXED | PER_MONTH",
  "openings": 1,
  "isRemote": false,
  "location": { "lat": 0.0, "lng": 0.0, "label": "string" },
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD | null",
  "startTime": "HH:MM | null",
  "endTime": "HH:MM | null"
}
```

**Validation rules (enforced server-side, mirrored on client):**
- `SHORT_TERM`: `isRemote` must be `false`; duration ≤ 5 hours; `startDate` == `endDate`; `startTime` and `endTime` required.
- `LONG_TERM`: `startDate` < `endDate`; `startTime`/`endTime` not required.
- `LONG_TERM + isRemote=true`: `location` not required.

**Response `201`:** The created job object.

**Errors:** `VALIDATION_ERROR`, `USER_BLOCKED`, `FORBIDDEN` (not in RECRUITER mode)

---

### DELETE `/jobs/:id`
Recruiter cancels their own job.

**Response `200`:**
```json
{
  "jobId": "uuid",
  "cancellationPenalty": false,
  "message": "Job cancelled."
}
```

**Errors:** `NOT_FOUND`, `FORBIDDEN`

> An open post with no accepted seekers: no cancellation penalty.  
> A filled/in-progress post: penalty applied, accepted seekers notified.

---

### POST `/jobs/:id/accept`
Seeker accepts a job (first come, first served).

**Response `200`:**
```json
{
  "applicationId": "uuid",
  "status": "ACCEPTED",
  "job": { "...full job with real location..." }
}
```

**Errors:**
| Code | Meaning |
|------|---------|
| `ALREADY_TAKEN` | Job just filled by someone else |
| `OWN_JOB` | Seeker cannot accept their own job |
| `TIME_CONFLICT` | Overlapping short-term job already accepted |
| `USER_BLOCKED` | User is blocked |
| `FORBIDDEN` | Not in SEEKER mode |

---

### POST `/jobs/:id/cancel-acceptance`
Seeker cancels their accepted job.

**Response `200`:**
```json
{
  "cancellationCount": 1,
  "isBlocked": false,
  "blockedUntil": null,
  "warning": "You have 1 cancellation. After 3, you will be blocked for 1 day.",
  "message": "Acceptance cancelled."
}
```

**At count=2:**
```json
{ "warning": "Warning: next cancellation will block your account for 1 day." }
```

**At count=3:**
```json
{
  "cancellationCount": 3,
  "isBlocked": true,
  "blockedUntil": "ISO8601",
  "warning": null,
  "message": "You have been blocked until <blockedUntil> due to 3 cancellations."
}
```

---

### GET `/jobs/my-applications`
Seeker's own job applications.

**Query params:** `status=ACCEPTED|IN_PROGRESS|COMPLETED|CANCELLED` (optional filter)

**Response `200`:**
```json
{
  "applications": [
    {
      "applicationId": "uuid",
      "status": "ACCEPTED | IN_PROGRESS | COMPLETED | CANCELLED",
      "job": { "...full job object..." },
      "acceptedAt": "ISO8601",
      "cancelledAt": "ISO8601 | null"
    }
  ]
}
```

---

### GET `/jobs/my-posts`
Recruiter's own job posts.

**Query params:** `status=OPEN|FILLED|COMPLETED|CANCELLED` (optional filter)

**Response `200`:**
```json
{
  "posts": [
    {
      "...full job object...",
      "acceptedSeekers": [
        {
          "applicationId": "uuid",
          "seeker": { "id": "uuid", "name": "string", "avatarUrl": "string | null", "email": "string" },
          "status": "ACCEPTED | IN_PROGRESS | COMPLETED | CANCELLED",
          "acceptedAt": "ISO8601"
        }
      ]
    }
  ]
}
```

---

### POST `/jobs/:id/save`
Toggle save/unsave a job.

**Response `200`:**
```json
{ "isSaved": true }
```

---

### GET `/jobs/saved`
Seeker's saved jobs.

**Response `200`:**
```json
{ "jobs": [ { "...job object..." } ] }
```

---

## 4. Notifications

### GET `/notifications`
**Query params:** `page`, `limit`, `unreadOnly=true`

**Response `200`:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "JOB_ACCEPTED | SEEKER_CANCELLED | RECRUITER_CANCELLED | BLOCKED | REMINDER | REPORT_RESOLVED",
      "title": "string",
      "body": "string",
      "isRead": false,
      "relatedJobId": "uuid | null",
      "createdAt": "ISO8601"
    }
  ],
  "unreadCount": 0
}
```

---

### POST `/notifications/:id/read`
Mark a notification as read.

**Response `200`:** `{ "id": "uuid", "isRead": true }`

---

### POST `/notifications/read-all`
Mark all notifications as read.

**Response `200`:** `{ "message": "All marked as read." }`

---

## 5. Reports

### POST `/reports`
Report a job or user.

**Request:**
```json
{
  "targetType": "JOB | USER",
  "targetId": "uuid",
  "reason": "SPAM | INAPPROPRIATE | FRAUD | HARASSMENT | OTHER",
  "description": "string"
}
```
**Response `201`:** `{ "reportId": "uuid", "message": "Report submitted." }`

---

## 6. Admin Endpoints

> All admin endpoints require `Authorization: Bearer <admin_token>` where the token belongs to an ADMIN-role user.

### POST `/admin/auth/login`
```json
{ "email": "string", "password": "string" }
```
**Response `200`:** Same shape as user login but `role: "ADMIN"` in the user object.

---

### GET `/admin/stats`
Dashboard statistics.

**Response `200`:**
```json
{
  "totalUsers": 0,
  "totalJobs": 0,
  "activeJobs": 0,
  "completedJobs": 0,
  "pendingReports": 0,
  "blockedUsers": 0,
  "jobsThisWeek": [
    { "date": "YYYY-MM-DD", "count": 0 }
  ],
  "usersThisWeek": [
    { "date": "YYYY-MM-DD", "count": 0 }
  ],
  "jobsByType": {
    "SHORT_TERM": 0,
    "LONG_TERM": 0
  }
}
```

---

### GET `/admin/users`
**Query params:** `page`, `limit`, `search` (name/email), `isBlocked=true|false`

**Response `200`:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "phone": "string | null",
      "avatarUrl": "string | null",
      "activeMode": "SEEKER | RECRUITER",
      "isBlocked": false,
      "blockedUntil": "ISO8601 | null",
      "cancellationCount": 0,
      "totalJobsPosted": 0,
      "totalJobsAccepted": 0,
      "createdAt": "ISO8601"
    }
  ],
  "total": 0,
  "page": 1,
  "totalPages": 1
}
```

---

### GET `/admin/users/:id`
Full user profile for admin.

**Response `200`:**
```json
{
  "...user object from list...",
  "jobs": [ { "...job objects..." } ],
  "applications": [ { "...application objects..." } ],
  "reports": [ { "...reports filed against this user..." } ]
}
```

---

### POST `/admin/users/:id/block`
Block a user.

**Request:**
```json
{ "duration": "1_DAY | 3_DAYS | 7_DAYS | 30_DAYS | PERMANENT", "reason": "string" }
```
**Response `200`:** `{ "userId": "uuid", "isBlocked": true, "blockedUntil": "ISO8601 | null" }`

---

### POST `/admin/users/:id/unblock`
**Response `200`:** `{ "userId": "uuid", "isBlocked": false, "blockedUntil": null }`

---

### GET `/admin/jobs`
**Query params:** `page`, `limit`, `status`, `type`, `search`

**Response `200`:**
```json
{
  "jobs": [ { "...full job objects with poster info..." } ],
  "total": 0,
  "page": 1,
  "totalPages": 1
}
```

---

### DELETE `/admin/jobs/:id`
Admin removes a job.

**Response `200`:** `{ "jobId": "uuid", "message": "Job removed." }`

---

### GET `/admin/reports`
**Query params:** `page`, `limit`, `status=PENDING|REVIEWED|RESOLVED`

**Response `200`:**
```json
{
  "reports": [
    {
      "id": "uuid",
      "targetType": "JOB | USER",
      "targetId": "uuid",
      "target": { "...job or user object..." },
      "reporter": { "id": "uuid", "name": "string", "email": "string" },
      "reason": "string",
      "description": "string",
      "status": "PENDING | REVIEWED | RESOLVED",
      "adminNote": "string | null",
      "resolvedBy": "uuid | null",
      "createdAt": "ISO8601",
      "resolvedAt": "ISO8601 | null"
    }
  ],
  "total": 0,
  "page": 1,
  "totalPages": 1
}
```

---

### PATCH `/admin/reports/:id`
Update report status.

**Request:**
```json
{ "status": "REVIEWED | RESOLVED", "adminNote": "string" }
```
**Response `200`:** Updated report object.

---

### GET `/admin/action-log`
Admin action history.

**Query params:** `page`, `limit`, `adminId` (filter by admin)

**Response `200`:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "adminId": "uuid",
      "adminName": "string",
      "action": "BLOCK_USER | UNBLOCK_USER | REMOVE_JOB | RESOLVE_REPORT | LOGIN",
      "targetType": "USER | JOB | REPORT | SESSION",
      "targetId": "uuid | null",
      "note": "string | null",
      "createdAt": "ISO8601"
    }
  ],
  "total": 0,
  "page": 1,
  "totalPages": 1
}
```

---

## Appendix: Enums

```
JobType:      SHORT_TERM | LONG_TERM
JobStatus:    OPEN | FILLED | COMPLETED | CANCELLED
PayUnit:      PER_HOUR | FIXED | PER_MONTH
AppStatus:    ACCEPTED | IN_PROGRESS | COMPLETED | CANCELLED
ReportReason: SPAM | INAPPROPRIATE | FRAUD | HARASSMENT | OTHER
ReportStatus: PENDING | REVIEWED | RESOLVED
UserMode:     SEEKER | RECRUITER
AdminAction:  BLOCK_USER | UNBLOCK_USER | REMOVE_JOB | RESOLVE_REPORT | LOGIN
BlockDuration: 1_DAY | 3_DAYS | 7_DAYS | 30_DAYS | PERMANENT
```
