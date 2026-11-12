import { spawn } from "node:child_process";
import path from "node:path";

const distIndex = path.resolve(import.meta.dirname ?? ".", "../dist/index.js");

export type Run = { code: number | null; stdout: string; stderr: string };

/** Run the built CLI. Standard input is closed unless `input` is given. */
export function runCli(
  args: string[],
  opts: { env?: Record<string, string>; input?: string; onStderr?: (text: string) => void } = {}
): Promise<Run> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [distIndex, ...args], {
      env: { ...process.env, ...opts.env },
      stdio: [opts.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout!.on("data", (chunk) => (stdout += chunk));
    child.stderr!.on("data", (chunk) => {
      stderr += chunk;
      opts.onStderr?.(stderr);
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    if (opts.input !== undefined) child.stdin!.end(opts.input);
  });
}
