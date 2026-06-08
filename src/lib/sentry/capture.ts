import * as Sentry from "@sentry/nextjs";

export function captureServerError(
  error: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  },
) {
  console.error(error);
  Sentry.captureException(error, context);
}
