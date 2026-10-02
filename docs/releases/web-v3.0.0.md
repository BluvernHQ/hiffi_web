# Hiffi Web — Release notes (v3.0.0)

**Version:** 3.0.0 (follows v2.3.3 from September 1, 2026)  
**Ship date:** September 2, 2026  
**Status:** Ready to ship

Prior release: [v2.3.3 — September 1, 2026](./web-v2.3.3.md)

---

## In one sentence

Home opens with **featured videos** and a **personalized discover feed**, creators can **request features** and share how they found Hiffi, and **sign-up takes you straight home**.

---

## Why this release matters

| Goal | What we ship |
| --- | --- |
| **Stronger first impression** | Featured hero videos above the discover grid |
| **More relevant home feed** | Recommendations via `GET /videos/recommend`; updates when you sign in or out |
| **Creator voice** | Dedicated page to submit product ideas |
| **Discovery survey** | Public how-did-you-find-us form + admin review |
| **Smoother everyday use** | Sign up without an extra login step |
| **Clearer admin workflow** | Feature requests are easy to find and read in the feedback queue |

---

## For listeners & fans

### Featured videos at the top of home

- A **hero carousel** highlights curated picks with short inline previews.
- Scroll down to **Discover** for the full video grid.
- **Mood mix chips** at the top let you jump into a vibe (Drill, Trap, and more) or return to the full feed.

### A smarter home feed

- Discover is **personalized** — signed-in fans see recommendations influenced by what they watch; guests see a general mix.
- Signing in or out on home **updates the feed** to match.
- Empty recommend catalog shows a clear empty state instead of a fake random grid.
- Up Next / related prefetch prefers recommend (falls back to list if needed).

### Watching

- **Next** and **Up Next** keep playing through multiple videos (from v2.3.3).
- Home feed session restore still keeps scroll/mood when returning from watch.

---

## For artists & creators

### Request a feature

- New **Request a feature** page — share ideas for tools, workflows, or improvements.
- **Sign-in required** to submit.
- Linked from the site footer and sidebar.

### How did you find Hiffi?

- Public **discovery source** form (`/hiffi-discovery-form`) with Turnstile protection.
- Admin can review submissions under Insights → Discovery source.

### Easier sign-up

- After creating an account, you are **signed in immediately** and taken to home — no extra stop at the login page.
- Clear guidance when a username is too short or unavailable.
- Fresh sessions survive a brief profile fetch miss right after register.

---

## For admins

- Feedback queue: feature-request type filter, badges, and structured detail body.
- Discovery source submissions: list + delete via same-origin admin proxies.

---

## Notes

- **Major release** — home discover uses `/videos/recommend`. Ensure the backend recommend endpoint is live before deploy.
- This cut is based on the `release/web-v2.3.2` line with selective v3 features (hero, recommend, feature request, discovery survey, instant signup). It does **not** include the full `new-main` persistent-home shell or creator welcome-email templates from the parallel v3.0.0 draft.
