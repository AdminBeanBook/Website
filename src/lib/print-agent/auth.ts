/** Shared auth for the Mac print-agent API (Bearer PRINT_AGENT_SECRET). */

export function authorizePrintAgent(request: Request): boolean {
  const secret = process.env.PRINT_AGENT_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
