import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  feedbackListPreview,
  feedbackListTitle,
  getFeatureRequestDisplayTitle,
  isFeatureRequestDescription,
  parseFeedbackDescription,
} from "./parse-feature-request.ts"

describe("parseFeedbackDescription", () => {
  it("parses feature requests with feature name and idea", () => {
    const parsed = parseFeedbackDescription(
      "[Feature request]\nFeature name: Playlist collabs\n\nLet creators invite each other to shared playlists.",
    )

    assert.equal(parsed.kind, "feature-request")
    if (parsed.kind !== "feature-request") return
    assert.equal(parsed.title, "Playlist collabs")
    assert.equal(parsed.idea, "Let creators invite each other to shared playlists.")
  })

  it("parses legacy title metadata", () => {
    const parsed = parseFeedbackDescription(
      "[Feature request]\nTitle: Better search\n\nImprove artist search filters.",
    )

    assert.equal(parsed.kind, "feature-request")
    if (parsed.kind !== "feature-request") return
    assert.equal(parsed.title, "Better search")
  })

  it("ignores feature names that match the submitter email local-part", () => {
    const parsed = parseFeedbackDescription(
      "[Feature request]\nTitle: johndoe\n\nAdd playlist folders.",
    )

    assert.equal(parsed.kind, "feature-request")
    if (parsed.kind !== "feature-request") return
    assert.equal(
      getFeatureRequestDisplayTitle(parsed, { email: "johndoe@example.com" }),
      undefined,
    )
  })

  it("parses legacy feature requests with email metadata", () => {
    const parsed = parseFeedbackDescription(
      "[Feature request]\nTitle: Tour dates\nEmail: creator@example.com\n\nShow tour dates on profile.",
    )

    assert.equal(parsed.kind, "feature-request")
    if (parsed.kind !== "feature-request") return
    assert.equal(parsed.email, "creator@example.com")
    assert.equal(parsed.idea, "Show tour dates on profile.")
  })

  it("treats generic feedback as feedback", () => {
    const parsed = parseFeedbackDescription("The player keeps pausing on mobile.")

    assert.deepEqual(parsed, {
      kind: "feedback",
      body: "The player keeps pausing on mobile.",
    })
  })
})

describe("feedback list helpers", () => {
  it("detects feature request descriptions", () => {
    assert.equal(isFeatureRequestDescription("[Feature request]\n\nIdea"), true)
    assert.equal(isFeatureRequestDescription("Bug report"), false)
  })

  it("builds list title and preview", () => {
    const description = "[Feature request]\nFeature name: Better search\n\nImprove artist search filters."
    assert.equal(feedbackListTitle(description), "Better search")
    assert.equal(feedbackListPreview(description), "Improve artist search filters.")
  })
})
