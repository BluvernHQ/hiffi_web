# Backend requirements: confirm the claim email, then let the artist sign in while the claim is under review

**Audience:** backend developer
**Frontend status:** not started. We'll build it behind a flag once this is on the dev API.
**Builds on:** `docs/backend-claim-account-setup-requirements.md` (claims already carry a password) and the claim email-check work from 29 Sep 2026.

---

## 1. Summary

Today an artist submits a claim with an email and password, then waits. They can only sign in after an admin approves the claim, because that's when the backend puts the claim's email and password on the artist's placeholder account.

We want the artist to be able to sign in **before** approval, with a bare-minimum email check first:

1. **One email on submit.** It acknowledges the claim and asks the artist to confirm their email address with a single link. No codes to type.
2. **Clicking the link confirms the email and signs them in.** Their profile stays "under review" until an admin approves it, and the site shows a banner saying so.

To keep this simple we assume **one claim per profile**. Duplicate or competing claims are out of scope for now.

---

## 2. New flow

1. The artist submits the claim form. `POST /inventory/claims` works as today and **also sends the confirmation email** (section 3).
2. The artist clicks **Confirm email** in that email. It opens a frontend page, `https://www.hiffi.com/claim/confirm?token=…`, which calls `POST /inventory/claims/confirm-email` (section 4.1).
3. The backend marks the email as confirmed, puts the claim's email and password on the artist's placeholder account (the step approval does today), and returns a session. The artist is signed in.
4. The artist uses Hiffi as that account. The profile is still `claim_status: "pending"`, so the frontend shows an "under review" banner, and owner actions stay locked (section 5).
5. An admin approves. `claim_status` becomes `claimed`, owner actions unlock, and we send an "approved" email.
6. If an admin rejects or deletes the claim, the account is switched off again (section 6.2).

---

## 3. Changes to `POST /inventory/claims`

The request body and every existing check stay the same, including the email-in-use 409.

On success:

- Save the claim with **email not confirmed** (for example `email_confirmed_at = null`).
- **Don't** touch the placeholder account yet.
- Create a single-use confirmation token (random, at least 32 bytes, store only its hash) that expires after **48 hours**.
- Send the confirmation email (section 3.1).
- Add `email_confirmation_required: true` to the response so the frontend knows to show "check your inbox".

### 3.1 The confirmation email

This is an acknowledgement plus a confirmation. From `creator-noreply@hiffi.com`, the address we already tell artists to watch for.

> **Subject:** Confirm your email for your {artist name} claim
>
> Hi {name},
>
> We got your claim for **{artist name}** on the Hiffi Artist Index. Our team will review it within 24–48 hours.
>
> Confirm your email to sign in to Hiffi while we review it:
>
> **[Confirm email]** → `https://www.hiffi.com/claim/confirm?token={token}`
>
> This link expires in 48 hours. If you didn't make this claim, ignore this email.

---

## 4. New endpoints

Both are public (no auth), because the artist isn't signed in yet. Rate-limit them per client IP, like `GET /inventory/claims/email-check`.

### 4.1 `POST /inventory/claims/confirm-email`

```json
{ "token": "token-from-the-email-link" }
```

On success:

1. Mark the claim's email as confirmed and use up the token.
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
| Token unknown or malformed | 400 | `This link isn't valid.` |
| Token expired | 410 | `This link has expired. Request a new one.` |
| Already confirmed (link clicked twice) | 409 | `Email already confirmed. Sign in instead.` |
| Email taken by another account since submit | 409 | `An account with this email already exists. Sign in instead.` |
| Claim rejected or deleted | 404 | Existing style |

For the "already confirmed" case the frontend sends the artist to `/login?email=…`, so returning the claim's email in that error body would help.

### 4.2 `POST /inventory/claims/{id}/resend-confirmation`

No body. It invalidates the previous token, sends a new confirmation email, and returns `{ "success": true }`.

- Only for claims whose email isn't confirmed yet (409 otherwise).
- Cooldown of about 60 seconds between sends (429 inside the cooldown), and at most 5 sends per claim.

The frontend shows a **Resend email** button on the "check your inbox" screen. It already knows the claim `id` from the submit response.

### 4.3 Wrong email

If the artist typed the wrong email, they submit a new claim. We don't need an "edit email" endpoint. A new claim for the same profile should replace an older unconfirmed one.

---

## 5. While the claim is pending (signed in, not yet approved)

The artist signs in with their email and password as normal (`POST /auth/login`) and can browse, watch, like, follow and use playlists.

Anything that changes what the public sees as this artist is **blocked until approval**. Return **403** with `error: "Your claim is under review."` for:

- `PUT /users/self` (name, username, bio, photo, links, email)
- `POST /users/self/request-creator-upgrade` and video uploads
- `GET /inventory/me/ranking` (or 404, whichever is easier)

The public inventory profile keeps `claim_status: "pending"`. That's what the frontend uses for the banner, so **no new status endpoint is needed**.

Before the email is confirmed, the placeholder account has no password, so `POST /auth/login` fails as it does today. A clearer message there ("Confirm your email first. We sent you a link.") would be nice but is optional.

---

## 6. Admin changes

### 6.1 Approve (`POST /admin/inventory/claims/{id}/approve`)

- **Email confirmed:** the account already exists. Only set `claim_status` to `claimed`, unlock owner actions, and send an "approved, you're all set" email linking to `/login`. Return `account_ready: true`.
- **Email not confirmed:** return 409 `The claimer hasn't confirmed their email yet.`
- Claims made before this change (no password) keep today's approve behaviour.

### 6.2 Reject or delete a confirmed claim

Undo the account step:

- remove the claim's email and password from the placeholder account, restoring the email it had before
- revoke the artist's active sessions
- set `claim_status` back to `unclaimed`
- optionally send a short "not approved" email

### 6.3 Admin claims list (`GET /admin/inventory/claims`)

Add `email_confirmed_at` (null until confirmed) to each claim, so the admin table can show "Email confirmed" or "Waiting for email confirmation".

---

## 7. What stays the same

- `GET /inventory/claims/email-check` and the email-in-use 409 on submit.
- The claim fields, validation and Turnstile check on submit.
- `POST /admin/inventory/claims/{id}/resend-email` for approval emails.
- The `/claim/onboard` activation flow for claims made before account setup.

---

## 8. Frontend plan (for reference)

Once this is on the dev API we'll turn on a flag and:

1. After submit, show "Check your inbox": we sent a confirmation link to {email}, with a **Resend email** button.
2. Add the `/claim/confirm?token=…` page. It calls 4.1, stores the returned token, signs the artist in and takes them to their profile.
3. Show a slim banner across the site while their profile's `claim_status` is `pending`: "Your profile is under review. We'll email you once it's approved."
4. Show a calm "under review" message when an owner action returns the 403 from section 5.
5. Show the email-confirmed state in the admin claims table.

---

## 9. Questions for the backend

1. Can the confirmation email go out from the same sender and template system as the approval email, with the copy in 3.1?
2. Which of the actions in section 5 can you block easily? If any are hard to block on the server, tell us and we'll hide them in the UI while the claim is pending.
3. Please tell us when this is on `api.dev.hiffi.com` so we can test it end to end.
