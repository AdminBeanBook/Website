export function getSentryDsn(): string | undefined {
  return (
    process.env.SENTRY_DSN?.trim() ||
    process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ||
    undefined
  );
}

export function getSentryOptions() {
  const dsn = getSentryDsn();

  return {
    dsn,
    enabled: Boolean(dsn) && process.env.NODE_ENV === "production",
    tracesSampleRate: 0.1,
  };
}
