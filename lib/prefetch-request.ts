/**
 * True when this request is a prefetch.
 *
 * Next.js removes `next-router-prefetch` before proxy and route handlers see
 * the request, so sidebar links also set prefetch={false}. `purpose` and
 * `sec-purpose` are not stripped. The layout still checks the router header,
 * because that header is present again during the page render.
 */
export function isPrefetchRequest(
  headerGet: (name: string) => string | null,
): boolean {
  if (headerGet("next-router-prefetch")) return true;
  if (headerGet("next-router-segment-prefetch")) return true;
  const purpose = `${headerGet("purpose") ?? ""} ${headerGet("sec-purpose") ?? ""}`;
  return purpose.toLowerCase().includes("prefetch");
}
