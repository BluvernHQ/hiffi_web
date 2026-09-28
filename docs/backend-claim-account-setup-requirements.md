# Backend requirements: Artist Index claim with account setup

**Audience:** backend developer
**Frontend status:** UI is built and live behind a flag. It needs the backend changes below before we turn it on.

---

## 1. Summary

Today an artist claims their Artist Index profile with **name, email and "how did you find us"**. An admin approves the claim. The artist then gets a welcome email with an activation link (`/claim/onboard?ident=…`) and sets their password there.

The new flow collects everything in one go, **before** admin review:

1. **Account:** name, email, **password**
2. **Socials (optional):** Instagram, YouTube, TikTok, Facebook links
3. **Profile:** primary city, primary sound (genre), open to collaborations (yes / maybe / no), how did you find us

After submitting, the artist waits for admin review. **Once approved, they can log in with the email and password they chose.** They should not have to set a password a second time.

There's no Instagram or YouTube OAuth verification yet. Admins check the submitted social links by hand.

---

## 2. Changes to `POST /inventory/claims`

### 2.1 Request body

The existing fields are unchanged. The new fields are marked **NEW**.

```json
{
  "username": "nova",
  "name": "Nova Smith",
  "email": "nova@example.com",
  "discovery_source": "instagram",
  "discovery_source_other": "only when discovery_source = other",
  "turnstile_token": "…",

  "password": "secret123",
  "other_socials": {
    "instagram": "https://instagram.com/nova",
    "youtube": "https://youtube.com/@nova",
    "tiktok": "https://tiktok.com/@nova",
    "facebook": "https://facebook.com/nova"
  },
  "location": "Atlanta, GA",
  "primary_genre": "melodic rap",
  "open_to_collab": "yes"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `password` **NEW** | string | yes | 6 characters or more, no whitespace. This matches the rules for `/auth/register`. |
| `other_socials` **NEW** | object | no | The keys are `instagram`, `youtube`, `tiktok` and `facebook`, and every key is optional. Each value is a full `https://` URL, because the frontend already turns handles into URLs. Ignore empty values. |
| `location` **NEW** | string | yes | Free text, up to 120 characters, for example `"Atlanta, GA"`. |
| `primary_genre` **NEW** | string | yes | Lowercase, up to 60 characters. The UI offers `hip-hop`, `rap`, `trap`, `drill`, `melodic rap`, `alternative hip-hop`, `boom bap`, `r&b`, or free text when the artist picks "Other". |
| `open_to_collab` **NEW** | enum | yes | One of `yes`, `maybe` or `no`. |

> These field names are our proposal. If you'd rather use different names, tell us and we'll update the frontend. The mapping lives in `app/api/inventory/claims/route.ts`.

### 2.2 Password handling (important)

- **Hash the password as soon as the request arrives**, the same way `/auth/register` does. Never store the plain password on the claim row.
- Never log it, and never return it or the hash in any response, including the admin endpoints.
- If the claim is **rejected** or **deleted**, throw away the stored hash.
- If an artist submits more than one claim, each claim keeps its own hash. Only the approved claim's hash is used.

### 2.3 Response

No change is needed. It still returns `{ id, username, status: "pending", message, … }`.

### 2.4 Errors

| Case | Status | Suggested `error` |
|---|---|---|
| Missing or invalid field | 400 | Name the field, for example `"password must be at least 6 characters"` |
| Profile already claimed | 409 | `"This profile has already been claimed."` (existing) |
| Profile not found or not claimable | 404 | Existing |
| Email already belongs to a **different, active** Hiffi account | 409 | `"An account with this email already exists. Sign in instead."` See open question 1. |

The frontend already handles 404 and 409 and shows `error` for anything else.

---

## 3. Changes on approval: `POST /admin/inventory/claims/{id}/approve`

When an admin approves a claim that includes a password:

1. **Link or activate the account.** The inventory upload already creates a placeholder user for each artist. On approval:
   - set that user's `email` to the claim email
   - set its password hash from the claim
   - mark it activated, the same end state as finishing `/inventory/claims/onboard/complete` today
2. **Apply the profile data** to the inventory profile and the user:
   - `other_socials`: merge into the inventory profile's `other_socials`, with values from the claim winning
   - `location`: write to the inventory `location`
   - `primary_genre`: write to the inventory `genre`
   - `open_to_collab`: store it, as a new column on the inventory profile or user
3. **Approval email.** Send an "approved, you can now sign in" email instead of the "set your password" activation email. It should link to `/login` and doesn't need an `ident` code.
4. **Everything else stays as it is:** other pending claims for the same artist are auto-rejected, `claim_status` becomes `claimed`, and the response includes `user_updated`, `user_uid` and `email_sent`.

**Claims without a password** (claims made before this change) keep today's behaviour: activation email, then `/claim/onboard`.

Please also return a flag so the admin UI can tell the two paths apart:

```json
{
  "claim": { "…": "…" },
  "rejected_count": 1,
  "user_updated": true,
  "user_uid": "…",
  "email_sent": true,
  "account_ready": true
}
```

`account_ready: true` means the artist can log in straight away, with no activation step.

---

## 4. Changes to `GET /admin/inventory/claims`

Add the new fields to each claim item. Leave out the password and its hash.

```json
{
  "id": "…",
  "username": "nova",
  "name": "Nova Smith",
  "email": "nova@example.com",
  "status": "pending",
  "discovery_source": "instagram",

  "other_socials": { "instagram": "https://instagram.com/nova" },
  "location": "Atlanta, GA",
  "primary_genre": "melodic rap",
  "open_to_collab": "yes",
  "has_password": true,

  "created_at": "…",
  "updated_at": "…"
}
```

`has_password` tells admins whether this claim uses the new flow, where the artist can log in right after approval, or the old one, where an activation email is needed.

---

## 5. Nice to have (can come later)

| Item | Why |
|---|---|
| `GET /inventory/claims/self` (authenticated) or a status check by email and claim ID | So the artist can see "Your claim for NOVA is under review" after leaving the page. |
| A rejection email | Right now a rejected artist hears nothing. |
| `open_to_collab` returned on the public inventory profile | Needed for the future collaboration matching and filters. |
| Real Instagram and YouTube OAuth verification | Would replace the manual link check. The UI already shows these as "coming soon". |

---

## 6. Open questions for the backend

1. **Email already in use.** What should happen if the claim email already belongs to a **different** active Hiffi account, for example a fan account made earlier?
   - Option A: reject at submit with a 409 and ask them to sign in first. This is simplest.
   - Option B: accept it, and on approval attach the inventory profile to that existing account, ignoring the claim password.
2. **Placeholder user vs. new account.** Confirm that approval updates the **seeded placeholder user**, keeping the artist's username and slug, rather than creating a new user.
3. **Existing `/claim/onboard` activation.** Once every new claim carries a password, can we keep `/claim/onboard` only for older claims? We'd like to keep the page for those.
4. **Field names.** Are you happy with `primary_genre`, `location`, `other_socials` and `open_to_collab`, or would you prefer others?

---

## 7. Frontend switch-over (for reference)

- The frontend already sends every field listed above to our Next.js route, `/api/inventory/claims`.
- That route forwards the new fields to `POST /inventory/claims` **only** when the server env var `INVENTORY_CLAIM_ACCOUNT_SETUP=true` is set. Until then the backend receives exactly what it gets today.
- Once the backend is deployed:
  1. We set `INVENTORY_CLAIM_ACCOUNT_SETUP=true`.
  2. We add the new columns to the admin claims table.
  3. We update the post-approval UI to use `account_ready`.

**Please tell us when this is on the dev API (`api.dev.hiffi.com`)** so we can test the full flow end to end before it goes to production.
