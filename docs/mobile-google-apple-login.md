# Hiffi mobile auth (dev)

Base URL: `https://api.dev.hiffi.com`

Use this from the iOS/Android app. Do **not** talk to Better Auth, Next.js `/api/auth/*`, or cookies. Password, Google, and Apple all return the same JWT.

## 1. Get an ID token from the native SDK

### Google

Use Google Sign-In and request an **ID token** (not only an access token).

- iOS: `GIDSignIn` with the iOS client ID. Set `serverClientID` to the **Web** OAuth client ID if Google asks for one; still send the **ID token** from the signed-in user.
- Android: `requestIdToken(webClientId)` on `GoogleSignInOptions` / Credential Manager. Send that ID token.

The token `aud` must be one of the client IDs configured on the API (`GOOGLE_OAUTH_CLIENT_IDS`). If login returns `401 invalid identity token`, the `aud` is probably the wrong client (iOS vs Android vs web).

### Apple

Use Sign in with Apple.

- Send `identityToken` (JWT). The field name can be `id_token` or `identity_token`.
- On **first** sign-in only, Apple gives `fullName`. Send it as `name`. Later logins have no name and often no email; the API keys the account by Apple `sub`.

The token `aud` must be the app bundle ID or Services ID listed in `APPLE_OAUTH_CLIENT_IDS`.

## 2. Exchange the ID token for a Hiffi JWT

```http
POST /auth/google
Content-Type: application/json

{"id_token":"<google id token>"}
```

```http
POST /auth/apple
Content-Type: application/json

{"id_token":"<apple identity token>","name":"Ada Lovelace"}
```

`name` and `username` are optional. No Turnstile. No `Authorization` header on these two routes.

Success `200`:

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "expires_in": 86400,
    "created": false,
    "user": {
      "uid": "...",
      "username": "...",
      "name": "...",
      "email_verified": true
    }
  }
}
```

(`created` is `true` only the first time that Google/Apple identity exists.)

Store `data.token`. Send it on every authenticated call:

```http
Authorization: Bearer <jwt>
```

## 3. Password login (same JWT)

```http
POST /auth/login
Content-Type: application/json

{"username":"<email or username>","password":"..."}
```

Same `data.token` shape (plus existing login fields). Use this if you already have email/password in the app.

## 4. Logout

```http
POST /auth/logout
Authorization: Bearer <jwt>
```

This invalidates that user’s JWTs (`session_version`). Delete the token from device storage.

## 5. Provider switch

```http
GET /auth/providers
```

Example: `{"success":true,"data":{"google":true,"apple":true}}`. Hide the button if the flag is `false`.

## 6. Errors

| HTTP | Meaning |
|------|---------|
| 400 | Missing `id_token`, or Apple first login with no email |
| 401 | Bad/expired ID token, or wrong `aud` |
| 403 | Provider disabled in admin, or account disabled |
| 500 | Server/config (often missing `GOOGLE_OAUTH_CLIENT_IDS` / `APPLE_OAUTH_CLIENT_IDS`) |

## 7. After login

Call the rest of the API the same as today (`GET /videos/recommend`, profile, etc.) with `Authorization: Bearer`. Do not send cookies. Do not send `X-Gateway-Token`.

Production API later: `https://api.hiffi.com` — same paths.
