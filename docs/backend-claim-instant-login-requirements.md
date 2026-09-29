# Backend requirements: sign in right after claiming, confirm the email second

**Audience:** backend developer
**Frontend status:** not started. We'll build it behind a flag once this is on the dev API.
**Builds on:** `docs/backend-claim-account-setup-requirements.md` (claims already carry a password) and the claim email-check work from 29 Sep 2026.
**Replaces:** the earlier drafts `backend-claim-email-confirmation-login-requirements.md` and `backend-claim-email-otp-login-requirements.md`. Those made the artist confirm their email before signing in. We no longer want that.

---

## 1. Summary

Today an artist submits a claim with an email and password, then waits. They can only sign in after an admin approves the claim, because that's when the backend puts the claim's email and password on the artist's placeholder account.

We want three changes:

1. **Sign in straight away.** Submitting the claim activates the account and signs the artist in. They don't wait for the admin review.
2. **Confirm the email as a second step.** On submit we send one email that acknowledges the claim and asks the artist to confirm their email address with a single link. Until they click it, the site shows a "confirm your email" banner. It doesn't block them from using Hiffi.
3. **Keep the profile under review.** Until an admin approves, the profile stays `claim_status: "pending"`, the site shows an "under review" banner, and owner actions stay locked.

To keep this simple we assume **one claim per profile**. Duplicate or competing claims are out of scope for now.

---

## 2. New flow

1. The artist submits the claim form. `POST /inventory/claims` activates the artist's placeholder account with the claim's email and password, sends the confirmation email, and returns a session. The artist is signed in (section 3).
2. The artist uses Hiffi as that account. The frontend shows two banners: "Confirm your email" and "Your profile is under review" (section 5).
3. The artist clicks **Confirm email** in the email. It opens `https://www.hiffi.com/claim/confirm?token=…`, which calls `POST /inventory/claims/confirm-email` (section 4.1). The "confirm your email" banner disappears.
4. An admin approves. This needs a confirmed email (section 7.1). `claim_status` becomes `claimed`, owner actions unlock, the "under review" banner disappears, and we send an "approved" email.
5. If an admin rejects or deletes the claim, the account is switched off again (section 7.2).

---

## 3. Changes to `POST /inventory/claims`

The request body and every existing check stay the same, including Turnstile and the email-in-use 409.

On success, for claims that include a password:

1. **Activate the account now.** Put the claim's email and password hash on the artist's placeholder account and activate it. This is the account step `POST /admin/inventory/claims/{id}/approve` does today, moved to submit. Keep the placeholder's previous email on the claim so it can be restored on rejection (section 7.2).
2. Mark the email as **not confirmed** (for example `email_confirmed_at = null` on the claim or the user).
3. Create a single-use confirmation token (random, at least 32 bytes, store only its hash) that expires after **7 days**.
4. Send the confirmation email (section 3.1).
5. Return a session in the same shape as `POST /auth/login`, plus the claim:

```json
{
  "success": true,
  "data": {
    "id": "claim-uuid",
    "username": "nova",
    "status": "pending",
    "message": "…",
    "token": "jwt…",
    "user": { "name": "Nova Smith", "uid": "…", "username": "nova", "email_verified": false }
  }
}
```

The existing fields (`id`, `username`, `status`, `message`, `discovery_source`…) stay where they are, so older frontends keep working. `token` and `user` are new.

Claims without a password (made before account setup) keep today's behaviour: no account step on submit, activation email after approval.

### 3.1 The confirmation email

One email that acknowledges the claim and confirms the address. From `creator-noreply@hiffi.com`, the address we already tell artists to watch for.

> **Subject:** We got your claim for {artist name}. Please confirm your email
>
> Hi {name},
>
> Thanks for claiming **{artist name}** on the Hiffi Artist Index. You're already signed in, and our team will review your claim within 24–48 hours.
>
> Please confirm this is your email address:
>
> **[Confirm email]** → `https://www.hiffi.com/claim/confirm?token={token}`
>
> We'll email you here once your profile is approved. If you didn't make this claim, ignore this email.

---

## 4. New endpoints

### 4.1 `POST /inventory/claims/confirm-email` (public)

Public, with no auth, because the artist may open the link on another device or after signing out. Rate-limit per client IP, like `GET /inventory/claims/email-check`.

```json
{ "token": "token-from-the-email-link" }
```

On success, mark the email as confirmed, use up the token, and return:

```json
{ "success": true, "data": { "email": "nova@example.com", "username": "nova", "email_verified": true } }
```

It doesn't need to return a session. If the artist is signed in on that device, the frontend refreshes their user. If not, it shows "Email confirmed" with a sign-in button.

| Case | Status | `error` |
| --- | --- | --- |
| Token unknown or malformed | 400 | `This link isn't valid.` |
| Token expired | 410 | `This link has expired. Sign in to get a new one.` |
| Already confirmed (link clicked twice) | 200 | Same success body. Clicking twice isn't an error. |
| Claim rejected or deleted | 404 | Existing style |

### 4.2 `POST /inventory/claims/self/resend-confirmation` (signed in)

Authenticated as the claiming account, with no body. It invalidates the previous token, sends a new confirmation email, and returns `{ "success": true }`.

- 409 if the email is already confirmed.
- About 60 seconds between sends (429 inside that window), and at most 5 sends a day.

The frontend puts a **Resend email** button on the "confirm your email" banner.

### 4.3 Wrong email

We don't need an "edit email" endpoint. If the artist typed the wrong email, they can't confirm it, so the admin rejects the claim (section 7.2) and the artist claims again with the right one.

---

## 5. What the frontend reads for the banners

| Banner | Shows when | Source |
| --- | --- | --- |
| "Confirm your email. We sent a link to {email}." with **Resend email** | Signed-in user's email isn't confirmed | **New:** `email_verified` on the signed-in user |
| "Your profile is under review. We'll email you once it's approved." | Signed-in user's inventory profile is `pending` | **Existing:** `claim_status` from `GET /inventory/{username}`, no change |

For `email_verified` (a boolean, or `email_verified_at`, whichever is easier), please add it:

- to `data.user` in the `POST /auth/login` response and in the claim submit response (section 3), and
- to `GET /users/{username}` **only when the caller is that user**. The frontend loads the signed-in user's data from this endpoint after login and on page load. Don't add it to public responses.

Existing accounts that never went through this flow should return `true`, so they don't suddenly see the banner.

---

## 6. While the claim is pending (signed in, not yet approved)

The artist can sign in with their email and password as normal (`POST /auth/login`), and can browse, watch, like, follow and use playlists. An unconfirmed email doesn't block any of this.

Anything that changes what the public sees as this artist is **blocked until approval**. Return **403** with `error: "Your claim is under review."` for:

- `PUT /users/self` (name, username, bio, photo, links, and especially **email**, so the claimed address can't be swapped before review)
- `POST /users/self/request-creator-upgrade` and video uploads
- `GET /inventory/me/ranking` (or 404, whichever is easier)

---

## 7. Admin changes

### 7.1 Approve (`POST /admin/inventory/claims/{id}/approve`)

- **Email confirmed:** the account already exists. Set `claim_status` to `claimed`, unlock owner actions, and send an "approved, you're all set" email linking to `/login`. Return `account_ready: true`.
- **Email not confirmed:** return 409 `The claimer hasn't confirmed their email yet.` We don't want to hand a profile to an address nobody has confirmed.
- Claims without a password keep today's approve behaviour.

### 7.2 Reject or delete a claim that has an active account

Undo the account step from section 3:

- restore the placeholder account's previous email and remove the claim's password
- revoke the artist's active sessions
- set `claim_status` back to `unclaimed`
- optionally send a short "not approved" email

### 7.3 Admin claims list (`GET /admin/inventory/claims`)

Add `email_confirmed_at` (null until confirmed) to each claim. The admin table will show "Email confirmed" or "Waiting for email confirmation", and disable **Approve** until it's confirmed.

---

## 8. What stays the same

- `GET /inventory/claims/email-check` and the email-in-use 409 on submit.
- The claim fields, validation and Turnstile check on submit.
- `POST /admin/inventory/claims/{id}/resend-email` for approval emails.
- The `/claim/onboard` activation flow for claims made before account setup.

---

## 9. Frontend plan (for reference)

Once this is on the dev API we'll turn on a flag and:

1. Sign the artist in with the token from the submit response, then show "You're signed in. Check your inbox to confirm your email."
2. Show slim banners at the top of the site: "Confirm your email" (with **Resend email**) while `email_verified` is false, and "Your profile is under review" while `claim_status` is `pending`. When both apply they share one bar.
3. Add the `/claim/confirm?token=…` page. It calls 4.1 and shows "Email confirmed".
4. Show a calm "under review" message when an owner action returns the 403 from section 6.
5. Add the email-confirmed column to the admin claims table and disable **Approve** until it's confirmed.

---

## 10. Questions for the backend

1. Can the confirmation email use the same sender and template system as the approval email, with the copy in 3.1?
2. Is `email_verified` easier to store on the user or on the claim? Either works for us, as long as it shows up where section 5 asks.
3. Which of the actions in section 6 can you block easily? If any are hard to block on the server, tell us and we'll hide them in the UI while the claim is pending.
4. Please tell us when this is on `api.dev.hiffi.com` so we can test it end to end.
