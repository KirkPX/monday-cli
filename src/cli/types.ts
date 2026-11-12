import type { GuardOptions } from "./guardrails.js";

/** What every command can receive from the root program and its own --account. */
export type CommonOpts = {
  json?: boolean;
  pretty?: boolean;
  readOnly?: boolean;
  account?: string;
};

/** The same, for a command that changes data. */
export type MutationOpts = CommonOpts & GuardOptions;
