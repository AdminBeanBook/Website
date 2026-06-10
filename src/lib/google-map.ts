/** Google My Maps iframe src — read on the server at request time. */
export function getGoogleMapEmbedUrl(): string | null {
  const url =
    process.env.GOOGLE_MAP_EMBED_URL?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAP_EMBED_URL?.trim();
  return url || null;
}
