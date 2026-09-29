# Backend requirements: verify the claim email with an OTP, then let the artist sign in while the claim is under review

**Audience:** backend developer
**Frontend status:** not started. We'll build it behind a flag once these endpoints are on the dev API.
**Builds on:** `docs/backend-claim-account-setup-requirements.md` (claims already carry a password) and the claim email-check work from 29 Sep 2026.

---

## 1. Summary

Today an artist submits a claim with an email and password, then waits. They can only sign in after an admin approves the claim, because that's when the backend puts the claim's email and password on the artist's placeholder account.

We want to change two things:

1. **Verify the email with a 6-digit OTP**, the same way the creator upgrade does (`POST /users/self/request-creator-upgrade` then `POST /users/self/verify-creator-upgrade`). This proves the claimer owns the email before we give them a login.
2. **Once the email is verified, let the artist sign in straight away.** Their profile stays "under review" until an admin approves it, and the site shows them a banner saying so. Admin approval no longer has to happen before they can use Hiffi.

To keep this simple, we assume **one claim per profile**. Duplicate or competing claims on the same profile are out of scope for now.

---

## 2. New flow

1. The artist fills in the claim form (account, socials, profile) and submits. `POST /inventory/claims` is unchanged, except that it **also emails a 6-digit code** and returns an `otp_id`.
2. The artist enters the code on the next screen. `POST /inventory/claims/{id}/verify-email` checks it and then:
   - puts the claim's email and password hash on the artist's placeholder account and activates it (the step approval does today)
   - returns a session token, so the artist is signed in immediately
3. The artist uses Hiffi as that account. The profile is still `claim_status: "pending"`, so the frontend shows an "under review" banner and owner actions stay locked (see section 5).
4. An admin approves. `claim_status` becomes `claimed`, owner actions unlock and we send an "approved" email.
5. If an admin rejects or deletes the claim, the account is switched off again (see section 6).

Claims whose email is never verified don't reach the admin queue and expire (see section 4.4).

---

## 3. Changes to `POST /inventory/claims`

### 3.1 Request

No change. It's the same body as today (`username`, `name`, `email`, `password`, `other_socials`, `location`, `primary_genre`, `open_to_collab`, `discovery_source`, `turnstile_token`).

### 3.2 Behaviour

- Keep every existing check, including the email-in-use 409.
- Save the claim as **email not verified** (a new state, or a flag such as `email_verified_at = null`).
- **Don't** touch the placeholder account yet.
- Send the OTP email to the claim email. Use the same OTP service, code length (6 digits), expiry and attempt limits as the creator upgrade.

### 3.3 Response

Add `otp_id` and `email_verification_required`:

```json
{
  "success": true,
  "data": {
    "id": "claim-uuid",
    "username": "nova",
    "status": "pending",
    "email_verification_required": true,
    "otp_id": "otp-id-from-email-service",
    "message": "We sent a 6-digit code to nova@example.com."
  }
}
```

---

## 4. New endpoints

All three are public (no auth), because the artist isn't signed in yet. Rate-limit them per client IP, like `GET /inventory/claims/email-check`.

### 4.1 `POST /inventory/claims/{id}/verify-email`

```json
{ "otp_id": "otp-id-from-email-service", "otp": "123456" }
```

On success:

1. Mark the claim's email as verified.
2. Put the claim's email and password hash on the artist's placeholder account and activate it. This is the account step `POST /admin/inventory/claims/{id}/approve` does today, moved here.
3. Return a session in the same shape as `POST /auth/login`:

```json
{
  "success": true,
  "data": {
    "token": "jwt…",
    "user": { "name": "Nova Smith", "uid": "…", "username": "nova" },
    "claim": { "id": "claim-uuid", "username": "nova", "status": "pending" }
  }
}
```

| Case | Status | `error` |
| --- | --- | --- |
| Wrong code | 400 | `Invalid code` |
| Code expired | 400 | `Code expired. Request a new one.` |
| Too many wrong attempts | 429 | `Too many attempts. Request a new code.` |
| Claim not found, or already verified | 404 / 409 | Existing style |
| Email taken by another account since submit | 409 | `An account with this email already exists. Sign in instead.` |

### 4.2 `POST /inventory/claims/{id}/resend-otp`

No body. It sends a new code and returns a new `otp_id`, with the same response shape as 3.3. Add a cooldown of about 60 seconds between sends (return 429 inside the cooldown).

### 4.3 Wrong email

If the artist typed the wrong email, they start again with a new claim. We don't need an "edit email" endpoint. Any new claim should replace the older unverified one for the same profile.

### 4.4 Expiry

Delete or expire claims whose email isn't verified within 24 hours. They should never appear in the admin pending queue.

---

## 5. While the claim is pending (signed in, not yet approved)

The artist can sign in with their email and password (`POST /auth/login` works as normal) and browse, watch, like, follow and use playlists.

**Blocked until approval** is anything that changes what the public sees as this artist. Return **403** with `error: "Your claim is under review."` for:

- `PUT /users/self` (name, username, bio, photo, links, email)
- `POST /users/self/request-creator-upgrade` and video uploads
- posting comments
- `GET /inventory/me/ranking` (or return 404, whichever is easier)

The public inventory profile keeps `claim_status: "pending"`. That's what the frontend uses for the banner, so **no new status endpoint is needed**. Adding `claim_status` to the `/auth/login` response would be a nice extra, but it's optional.

---

## 6. Changes to admin approve, reject and delete

### 6.1 Approve (`POST /admin/inventory/claims/{id}/approve`)

- If the claim's email is **verified**, the account already exists. Only set `claim_status` to `claimed`, unlock owner actions and send an "approved, you're all set" email that links to `/login`. Return `account_ready: true`.
- If the claim's email is **not verified**, return 409 `Email not verified yet`. These claims shouldn't be in the queue anyway (4.4).
- Claims made before this change (no OTP, possibly no password) keep today's approve behaviour.

### 6.2 Reject or delete a verified claim

Undo the account step:

- remove the claim email and password from the placeholder account, restoring the email it had before
- revoke the artist's active sessions
- set `claim_status` back to `unclaimed`
- optionally send a short "not approved" email

### 6.3 Admin claims list (`GET /admin/inventory/claims`)

Add `email_verified: boolean` (or `email_verified_at`) to each claim, so admins can see the email was confirmed.

---

## 7. What stays the same

- `GET /inventory/claims/email-check` and the email-in-use 409 on submit.
- The claim fields, validation and Turnstile check on submit.
- `POST /admin/inventory/claims/{id}/resend-email` for approval emails.

---

## 8. Frontend plan (for reference)

Once this is on the dev API we'll turn on a flag and:

1. After submit, show a "Check your email" step: enter the 6-digit code, with resend and a countdown (the same UI pattern as the creator upgrade).
2. On a successful verify, store the returned token and sign the artist in.
3. Show a slim banner across the site while their profile's `claim_status` is `pending`: "Your profile is under review. We'll email you once it's approved."
4. Show a calm "under review" message when an owner action returns the 403 from section 5.
5. Update the claim-submitted screen from "sign in once approved" to "you're signed in".

---

## 9. Questions for the backend

1. Can `POST /inventory/claims` reuse the creator-upgrade OTP service as-is (same email template, expiry, attempt limits), or does it need its own template? We'd like the email to say "Your Hiffi claim code for {artist name}".
2. Which of the actions in section 5 can you block easily? If any are hard to block on the server (comments, for example), tell us and we'll hide them in the UI while the claim is pending.
3. Please tell us when this is on `api.dev.hiffi.com` so we can test it end to end.
