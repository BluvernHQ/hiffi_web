# Admin Creators dashboard — what we shipped

A new **Creators** area in the admin panel. It is for watching how artists behave after they become creators: who has uploaded, who has gone quiet, and who needs a follow-up.

**Where to open it:** Admin sidebar → **Community** → **Creators**  
(or the **Creators** snapshot cards on the main admin home).

---

## Who can use it

| Role | What they can do |
| --- | --- |
| Super admin | See everything and **pause / restore uploads** |
| Read-only | See everything, cannot pause uploads |
| Curator | **No access** (this is not part of curation) |

---

## 1. Snapshot on the main dashboard

The home admin screen now has a **Creators** card with the headline numbers:

- How many **creators** we have
- How many have **posted a video**
- How many have **never uploaded**
- Who was **active in the last 7 / 30 days**
- Who became a creator **this week**

Each number is clickable and opens the matching list.

---

## 2. Overview tab

The Overview is the “health check” for creators.

### Headline numbers
Click any card to jump straight into that group in the Directory.

- **Creators** — live creator accounts
- **Have uploaded** — at least one video
- **Never uploaded** — no first video yet
- **New this week**
- **Active 7 days / 30 days** — they logged in, used the app, **or** uploaded (whichever was most recent)

### Upload conversion
Shows the share of creators who have posted at least one video, plus the **median days to first upload** (how long people typically take to post).

### Growth funnel
Walks people through:

1. **Creators**
2. **First upload**
3. **Active uploader**
4. **Retained**

You can compare against **7 days** or **30 days** ago.

**Two waiting lists stay separate** (we do not mix them, and we do not treat them as “becoming a creator”):

- **Pending inventory claims** — Artist Index claims waiting for an admin (opens Artist Inventory)
- **Pending OTP upgrades** — people in the middle of the OTP upgrade (only live while the code is valid, about an hour)

### Needs attention
Lists groups that usually need outreach:

- Never uploaded
- New without an upload
- Never returned
- **Stale uploaders** — used to upload, then went quiet
- At risk at **30 / 60 / 90** days (the 90-day group is inside the 60-day group, which is inside the 30-day group)

**Stale after** lets you change how many quiet days count as “stale” (Enter or **Apply**). That only changes the stale-uploaders count, not the whole page.

### Trends
Charts over time (daily / weekly) for things like new creators, first uploads, total uploads, and activity. You can pick which daily line to look at.

---

## 3. Directory tab

A searchable list of creators.

**Filters**

- Account: Creators / OTP pending / Suspended
- Uploads: has uploaded / never uploaded
- Ready-made queues (never uploaded, stale, at risk, new this week, etc.)
- Artist Index claim: pending / claimed / rejected / none
- City and genre search

**The table**

- Name, photo, handle
- Video count and followers
- Last upload (shows **Never** if they have not posted)
- Last activity
- When they joined
- City / genre
- Extra badges only when they matter (suspended, OTP pending, disabled, claim pending/claimed)

Click a row to open that person. Pagination is Previous / Next.

---

## 4. Creator profile (one person)

From the directory you get a full page for that creator:

- Profile (email, city, genre, bio, join / apply / “became a creator” dates)
- Videos, followers, days since last upload / last activity
- Last login vs last activity vs last upload
- **Weekly and monthly upload charts**
- **Recent videos** with thumbnails, title, and status
- Videos still **encoding**
- **OTP upgrade history** (organic upgrades only)
- **Reports** on them or their videos (opens the existing Flags area)

### Pause uploads (super admin only)

**Suspend uploads** is *not* the same as disabling the account.

- They **cannot upload** new videos
- They **can still log in**
- **Existing videos stay up**

**Unsuspend** restores upload access.

---

## Words we use on purpose

- We say **Creators**, not “Approved,” on the screens people look at.
- **Activity** means the latest of: login, using the app, or uploading.
- Artist Index **claim approved** is still a claim on inventory — it is not the same as being a Hiffi creator.
- We **do not** turn “Applied” into “Creators” as one conversion rate. Claims and OTP are two different queues.

---

## What this is for (in one line)

Ops and product can see **who is creating, who never started, who went quiet**, open the exact list, look at one artist, and (if needed) pause uploads without taking the account down.
