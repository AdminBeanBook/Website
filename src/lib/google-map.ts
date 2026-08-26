/** Bean Book 2026 Denver metro map — public embed URL (overridable via env). */
const DEFAULT_GOOGLE_MAP_EMBED_URL =
  "https://www.google.com/maps/d/embed?mid=1uUBFc2yLw4W_70hy4IS6Hvek5fNDa7M";

/** Google My Maps iframe src — read on the server at request time. */
export function getGoogleMapEmbedUrl(): string {
  return (
    process.env.GOOGLE_MAP_EMBED_URL?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAP_EMBED_URL?.trim() ||
    DEFAULT_GOOGLE_MAP_EMBED_URL
  );
}
