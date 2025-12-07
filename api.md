# Friendly Backend API

## Base URL
- **Local:** `http://localhost:8080`
- **Production:** `https://meetacy.app/friendly`

---

## Auth API

### POST /auth/generate
Create new user account.

**Request:**
```json
{
  "nickname": "string",
  "description": "string",
  "interests": ["string"],
  "avatar": null
}
```

**Response:**
```json
{
  "token": "string",
  "id": 0,
  "accessHash": "string"
}
```

**Status:** 200 OK

---

## Users API

### GET /users/details
Get current user details (requires Authorization header).

**Response:**
```json
{
  "id": 0,
  "accessHash": "string",
  "nickname": "string",
  "description": "string",
  "interests": ["string"],
  "avatar": null
}
```

**Status:** 200 OK | 401 Unauthorized

### GET /users/details/{id}/{accessHash}
Get specific user details.

**Response:** Same as above

**Status:** 200 OK | 401 Unauthorized

---

## Files API

### POST /files/upload
Upload file (multipart form data).

**Request:**
- Form field: `file` (binary)

**Response:**
```json
{
  "id": 0,
  "accessHash": "string"
}
```

**Status:** 200 OK

### GET /files/download/{id}/{accessHash}
Download file (redirect or content).

**Status:** 200 OK

---

## Friends API

### POST /friends/generate
Generate friend invitation token (requires Authorization header).

**Response:**
```json
{
  "token": "string"
}
```

**Status:** 200 OK | 401 Unauthorized

### POST /friends/add
Add friend using token (requires Authorization header).

**Request:**
```json
{
  "token": "string",
  "userId": 0
}
```

**Response:** `Success` | `FriendTokenExpired`

**Status:** 200 OK | 401 Unauthorized

### POST /friends/request
Send friend request (requires Authorization header).

**Request:**
```json
{
  "userId": 0,
  "userAccessHash": "string"
}
```

**Status:** 200 OK | 401 Unauthorized | 404 Not Found

### POST /friends/decline
Decline friend request (requires Authorization header).

**Request:**
```json
{
  "userId": 0,
  "userAccessHash": "string"
}
```

**Status:** 200 OK | 401 Unauthorized | 404 Not Found

---

## Network API

### GET /network/details
Get network details (requires Authorization header).

**Response:**
```json
{
  "friendCount": 0,
  "commonFriends": 0,
  "mutualConnections": 0
}
```

**Status:** 200 OK | 401 Unauthorized

---

## Feed API

### GET /feed/queue
Get feed queue (requires Authorization header).

**Response:**
```json
{
  "items": [
    {
      "id": 0,
      "type": "string",
      "content": {}
    }
  ]
}
```

**Status:** 200 OK | 401 Unauthorized

---

## Headers

**All endpoints require:**
- `Content-Type: application/json`

**Protected endpoints require:**
- `Authorization: Bearer {token}`
