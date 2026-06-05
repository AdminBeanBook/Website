export type HomeBodyFields = {
  description: string;
  paragraph: string;
};

export function parseHomeBody(body: string): HomeBodyFields {
  const trimmed = body.trim();
  if (!trimmed) return { description: "", paragraph: "" };

  try {
    const parsed = JSON.parse(trimmed) as {
      description?: string;
      paragraph?: string;
    };
    if (parsed && typeof parsed === "object") {
      return {
        description: parsed.description?.trim() ?? "",
        paragraph: parsed.paragraph?.trim() ?? "",
      };
    }
  } catch {
    // fall through
  }

  return { description: trimmed, paragraph: "" };
}
