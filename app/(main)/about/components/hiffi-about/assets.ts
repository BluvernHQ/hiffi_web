export function hiffiAboutAsset(filename: string) {
  return `/hiffi-about/${filename}`;
}

export function slideAsset(filename: string) {
  return filename.startsWith("/") ? filename : hiffiAboutAsset(filename);
}
