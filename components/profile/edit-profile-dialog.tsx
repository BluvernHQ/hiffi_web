"use client"

/**
 * @deprecated Prefer navigating to `/profile/[username]/edit`.
 * Kept briefly so older imports don't break; re-exports the full-page form helpers.
 */
export {
  EditArtistProfileForm as EditProfileDialog,
  socialsFromProfile,
  type EditArtistProfileFormProps as EditProfileDialogProps,
} from "@/components/profile/edit-artist-profile-form"
