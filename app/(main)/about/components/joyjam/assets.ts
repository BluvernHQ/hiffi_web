export function joyjamAsset(filename: string) {
  return `/joyjam/${filename}`;
}

export function slideAsset(filename: string) {
  return filename.startsWith("/") ? filename : joyjamAsset(filename);
}
