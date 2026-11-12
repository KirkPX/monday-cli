import { createServer, type Server } from "node:http";

export type Call = { path: string; auth: string; query: string; variables: Record<string, any>; body: any };
export type Reply = { status?: number; body: unknown; headers?: Record<string, string> };

const ME = { me: { id: "1", name: "Test User", email: "t@example.com", is_admin: false, account: { id: "9", name: "Test Co" } } };

/**
 * A stand-in for Monday on a local port. It records every call, so a test can prove
 * what was sent, or that nothing was. `good-token` is the only token it accepts.
 */
export async function fakeMonday(reply: (call: Call) => unknown = () => ({})) {
  const calls: Call[] = [];
  const server: Server = createServer((req, res) => {
    let text = "";
    req.on("data", (chunk) => (text += chunk));
    req.on("end", () => {
      const body = text ? JSON.parse(text) : {};
      const call: Call = {
        path: req.url ?? "",
        auth: String(req.headers.authorization ?? ""),
        query: body.query ?? "",
        variables: body.variables ?? {},
        body,
      };
      calls.push(call);

      const send = (status: number, payload: unknown, headers: Record<string, string> = {}) => {
        res.writeHead(status, { "content-type": "application/json", ...headers });
        res.end(JSON.stringify(payload));
      };

      if (call.path === "/oauth2/token") return send(200, { access_token: "good-token" });
      if (call.auth !== "good-token") return send(401, { errors: ["Not Authenticated"] });
      if (/\bme\s*\{/.test(call.query)) return send(200, { data: ME });
      const answer = reply(call);
      if (answer && typeof answer === "object" && "status" in answer) {
        const r = answer as Reply;
        return send(r.status ?? 200, r.body, r.headers);
      }
      return send(200, { data: answer });
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as { port: number };
  return {
    url: `http://127.0.0.1:${port}`,
    calls,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

/** A port nothing is listening on right now. */
export async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as { port: number };
  await new Promise((resolve) => server.close(resolve));
  return port;
}
