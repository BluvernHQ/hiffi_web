# Claim approval email: admin and frontend updates

**Audience:** frontend and backend developers
**Status:** email service fixed and live on dev (29 Sep 2026). The admin and frontend follow-ups below are open.

---

## 1. What changed

Artists who claim an Artist Index profile now set their password as part of the claim (the "account setup" flow, `has_password: true`). When an admin approves one of these claims:

1. The backend copies the claim password onto the artist's account and activates it (`activateClaimedAccount` in `hifi_backend/Events/Inventory/claims_account.go`). The artist can sign in straight away with the email and password they chose.
2. The backend calls `POST /send-claim-approved` on the `claim-email` service (port 8063).

Until 29 Sep that endpoint didn't exist, so every approval email for these claims failed with a 404 and nothing was sent. The admin toast showed "approval email failed to send".

**The fix:** `claim-email` (`/root/claim-email/main.py`) now has `/send-claim-approved`. It sends the **same welcome email** as the older flow ("Welcome to Hiffi, {first name}"), with one difference: the main button ("Let's get you started") links to

```
{site}/login?email=<claim email>&utm_source=email&utm_medium=welcome&utm_campaign=claim_approved
```

instead of `/claim/onboard?ident=…`. These artists already have a password, and the backend doesn't create an onboarding code for them, so the old link would be a dead end.

Claims made **without** a password are unchanged: they still get the welcome email with the `/claim/onboard` activation link.

### The two flows side by side

| | Account setup claim (`has_password: true`) | Older claim (no password) |
|---|---|---|
| Password set | At claim submit | After approval, on `/claim/onboard` |
| Email endpoint | `/send-claim-approved` | `/send-welcome` |
| Email subject | "Your Hiffi claim was approved" | "Welcome to Hiffi" |
| Main button | `/login?email=…` | `/claim/onboard?ident=…` |
| Sender | `creator-noreply@hiffi.com` | `creator-noreply@hiffi.com` |
| Approve response | `account_ready: true` | `account_ready: false` |

### Changing the password

The email doesn't offer a password change. An artist who wants a different password uses **"Forgot password?"** on the login page (`/forgot-password`). Section 3.2 proposes making this easier to find.

---

## 2. Admin panel updates

File: `components/admin/inventory-claims-table.tsx`

### 2.1 Show "Email sent" in the funnel for account setup claims (required)

`funnelStepsFor` currently strips the funnel down to **Password set → Logged in** for `has_password` claims, based on the old assumption that these claims get no email:

```ts
/** Account-setup claims set the password at submit, so there is no email / link step. */
```

That's no longer true. The backend sets `welcome_email_sent_at` whenever the approval email succeeds, for both flows. Change the funnel for `has_password` claims to:

**Email sent → Password set → Logged in**

- Keep "Link opened" hidden for these claims. There's no onboarding link. The backend fills `onboard_verified_at` with the approval time just to keep the funnel queries consistent.
- Update the comment above `funnelStepsFor` to match.

### 2.2 Approve dialog copy (required)

For `has_password` claims the dialog says:

> They set a password with this claim, so they can sign in right after approval.

It doesn't mention the email. Suggested copy:

> They set a password with this claim, so they can sign in right after approval. We'll email them a sign-in link.

### 2.3 Help text at the top of the table (required)

Current copy:

> Claims marked **Can sign in after approval** already have a password; older claims get an onboarding link by email.

Suggested copy:

> Claims marked **Can sign in after approval** already have a password and get an email with a sign-in link. Older claims get an email with an onboarding link to set their password.

### 2.4 Resend approval email (recommended)

The help text says "Resend email is not available yet". It's needed now: 4 approvals failed before the fix (for example claim `01890515-af0e-4862-93e9-463050ea1b9a`, approved 29 Sep 04:46 UTC), and those artists have never received an email.

- **Backend:** add `POST /admin/inventory/claims/{id}/resend-email`.
  - Approved claims only.
  - If the account is ready, call `sendClaimApprovedEmail`. Otherwise issue a fresh onboarding token (invalidating old ones) and call `sendClaimWelcomeEmail`.
  - Set `welcome_email_sent_at` on success and return `{ claim, email_sent }`.
  - Gate it behind the same permission as approve.
- **Frontend:** add a "Resend email" action on approved rows where `welcome_email_sent_at` is empty, plus inside the funnel popover. Add `adminResendInventoryClaimEmail` to `lib/admin-api-client.ts`.
- Once it ships, remove "Resend email is not available yet" from the help text.

Until then, send missed emails by hand:

```bash
curl -X POST http://localhost:8063/send-claim-approved \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SECRET" \
  -d '{"to_email":"artist@example.com","first_name":"Nova","login_url":"https://www.hiffi.com/login","base_url":"https://www.hiffi.com"}'
```

### 2.5 "Awaiting email" onboarding filter (no change)

The filter (`approved AND welcome_email_sent_at IS NULL`) already covers both flows, so it correctly lists the 4 artists who missed their email. Use it to find them.

---

## 3. Artist-facing frontend updates

### 3.1 Copy that's already correct (no change)

These already describe the new flow correctly:

- `ClaimSubmitted.tsx`: "We'll email {email} from creator-noreply@hiffi.com once you're approved" and "Once approved, sign in with {email} and the password you just set".
- `ClaimReceiptNotices.tsx`: "Sign in with that email and the password you set during your claim."
- `ClaimAside.tsx`: "With the email and password you set".

### 3.2 Make "forgot password" easy from the email and login (recommended)

- **Email:** add a secondary line under the main button in the account setup version of the email:
  "Want a different password? [Reset it here]({site}/forgot-password?email=…)". The change belongs in `claim-email` (`_render_welcome_html`); ask the email owner.
- **`app/forgot-password/page.tsx`:** read `?email=` and prefill the email field, the same way `app/login/page.tsx` already does. At the moment it only reads `?redirect=`.
- **Login page:** when the "Forgot password?" link is clicked and an email is already typed, pass it along as `/forgot-password?email=…`.

### 3.3 Land approved artists on their profile after login (nice to have)

The claim receipt's sign-in link (`claimSignInHref` in `lib/artist-index/claim-receipt.ts`) sends artists to `/login?email=…&redirect=/profile/{username}`. The email link has no `redirect`, so after signing in they land on the home feed instead of their profile.

To match:

- **Backend:** send `username` (or a full `login_url` that already includes the redirect) to `/send-claim-approved` from `Utils.SendClaimApprovedEmail`.
- **`claim-email`:** add `redirect=/profile/{username}` to the button link when it's provided.

### 3.4 Email subject (decision needed)

The account setup email uses the subject "Your Hiffi claim was approved", while the body opens with "Welcome to Hiffi". To make it exactly match the older email, change the `Subject` in `sendClaimApprovedEmail` (`hifi_backend/Events/Inventory/onboard.go`) to "Welcome to Hiffi" and rebuild the backend.

---

## 4. Test plan

- [ ] Submit a claim with a password on dev and approve it in the admin panel. The toast says "they can sign in now (approval email sent)".
- [ ] The email arrives from `creator-noreply@hiffi.com` with the welcome design and the artist's first name.
- [ ] The main button opens `/login` with the email already filled in. Signing in with the claim password works.
- [ ] No link in the email points to `/claim/onboard`.
- [ ] The admin funnel for that claim shows Email sent → Password set → Logged in (after 2.1).
- [ ] Approve an older claim without a password. It still gets the `/claim/onboard` email, and activation works end to end.
- [ ] `/forgot-password?email=…` prefills the email (after 3.2).
- [ ] Resend works for an approved claim with no email sent, and the row leaves the "Awaiting email" filter (after 2.4).
- [ ] The 4 artists who missed their email have been emailed, either by hand or with resend.
