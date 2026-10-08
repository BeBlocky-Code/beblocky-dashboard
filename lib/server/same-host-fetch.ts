import { lookup } from "node:dns/promises";
import { readFileSync } from "node:fs";
import https from "node:https";

const PROBE_MS = 2000;
const PUBLIC_MS = 8000;
const PROXY_DNS_NAMES = [
  "host.docker.internal",
  "caddy",
  "coolify-proxy",
  "traefik",
];

export function readDefaultIpv4Gateway(routeTable: string): string | undefined {
  for (const line of routeTable.split("\n").slice(1)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3 || parts[1] !== "00000000") continue;
    const hex = parts[2];
    if (!/^[0-9a-fA-F]{8}$/.test(hex)) continue;
    const bytes = [0, 2, 4, 6].map((index) =>
      parseInt(hex.slice(index, index + 2), 16),
    );
    return bytes.reverse().join(".");
  }
  return undefined;
}

function safeReadRouteTable(): string {
  try {
    return readFileSync("/proc/net/route", "utf8");
  } catch {
    return "";
  }
}

async function lookupIpv4(name: string): Promise<string | undefined> {
  try {
    const found = await Promise.race([
      lookup(name, { family: 4 }),
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 300)),
    ]);
    return found && typeof found === "object" ? found.address : undefined;
  } catch {
    return undefined;
  }
}

async function sameHostAddresses(): Promise<string[]> {
  const found = new Set<string>(["127.0.0.1"]);
  const gateway = readDefaultIpv4Gateway(safeReadRouteTable());
  if (gateway) found.add(gateway);
  const resolved = await Promise.all(PROXY_DNS_NAMES.map((name) => lookupIpv4(name)));
  for (const address of resolved) {
    if (address) found.add(address);
  }
  return [...found];
}

function requestOnce(
  ip: string,
  servername: string,
  path: string,
  headers: Record<string, string>,
): Promise<{ status: number; body: string } | undefined> {
  return new Promise((resolve) => {
    const req = https.request(
      {
        host: ip,
        servername,
        path,
        method: "GET",
        headers: { ...headers, Host: servername },
        timeout: PROBE_MS,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      resolve(undefined);
    });
    req.on("error", () => resolve(undefined));
    req.end();
  });
}

function missedProxy(body: string): boolean {
  return body.trim() === "404 page not found";
}

/**
 * Fetch a URL on this machine without using its public DNS name.
 * The dashboard and the API share a host. A server-side fetch of the public
 * API hostname hairpins and the platform turns the hang into a 500.
 */
export async function fetchSameHost(
  publicUrl: string,
  init: { headers?: Record<string, string> } = {},
): Promise<{ status: number; body: string }> {
  const url = new URL(publicUrl);
  const headers = init.headers ?? {};
  const path = `${url.pathname}${url.search}`;
  const hostname = url.hostname.toLowerCase();
  const loopback =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1";

  if (!loopback) {
    for (const ip of await sameHostAddresses()) {
      const result = await requestOnce(ip, hostname, path, headers);
      if (!result) continue;
      if (missedProxy(result.body)) continue;
      return result;
    }
  }

  const response = await fetch(publicUrl, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(PUBLIC_MS),
  });
  return { status: response.status, body: await response.text() };
}
