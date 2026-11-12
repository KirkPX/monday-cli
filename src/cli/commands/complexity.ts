import { getComplexity } from "../../monday-api.js";
import { createClient } from "../client-helpers.js";
import { reporter } from "../output.js";
import type { CommonOpts } from "../types.js";

export async function complexityCommand(opts: CommonOpts = {}): Promise<void> {
  const r = reporter(opts);
  r.result(await getComplexity(createClient(opts)));
}
