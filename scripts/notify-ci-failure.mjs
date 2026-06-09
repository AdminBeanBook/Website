/**
 * Sends an email when the E2E GitHub Actions workflow fails.
 * Requires GitHub secrets: RESEND_API_KEY, CI_NOTIFY_EMAIL, CI_NOTIFY_FROM
 */

const apiKey = process.env.RESEND_API_KEY?.trim();
const to = process.env.CI_NOTIFY_EMAIL?.trim();
const from = process.env.CI_NOTIFY_FROM?.trim();

if (!apiKey || !to || !from) {
  console.warn(
    "Skipping CI failure email: set RESEND_API_KEY, CI_NOTIFY_EMAIL, and CI_NOTIFY_FROM in GitHub secrets.",
  );
  process.exit(0);
}

const repo = process.env.GITHUB_REPOSITORY ?? "unknown/repo";
const ref = process.env.GITHUB_REF_NAME ?? "unknown";
const sha = process.env.GITHUB_SHA ?? "unknown";
const runId = process.env.GITHUB_RUN_ID ?? "";
const event = process.env.GITHUB_EVENT_NAME ?? "unknown";
const actor = process.env.GITHUB_ACTOR ?? "unknown";

const runUrl = runId
  ? `https://github.com/${repo}/actions/runs/${runId}`
  : `https://github.com/${repo}/actions`;
const shortSha = sha.slice(0, 7);

const subject = `[Bean Book] E2E tests failed on ${ref}`;
const html = `
  <p><strong>Bean Book E2E tests failed</strong></p>
  <ul>
    <li>Repository: ${repo}</li>
    <li>Branch: ${ref}</li>
    <li>Commit: ${shortSha}</li>
    <li>Event: ${event}</li>
    <li>Triggered by: ${actor}</li>
  </ul>
  <p><a href="${runUrl}">View the failed workflow run</a></p>
  <p>Download the <code>playwright-report</code> artifact from that run for screenshots and video.</p>
`;

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from,
    to: [to],
    subject,
    html,
  }),
});

if (!response.ok) {
  const body = await response.text();
  console.error(`CI failure email failed (${response.status}): ${body}`);
  process.exit(0);
}

console.log(`CI failure email sent to ${to}`);
