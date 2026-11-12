import { getMe } from "../../monday-api.js";
import { createClient } from "../client-helpers.js";
import { reporter } from "../output.js";
import type { CommonOpts } from "../types.js";

export async function meCommand(opts: CommonOpts = {}): Promise<void> {
  const r = reporter(opts);
  const { me } = await getMe(createClient(opts));
  r.result(me);
}
