#!/usr/bin/env node
/**
 * Dump the Monday GraphQL schema for one API version.
 *
 * Usage:  node scripts/introspect.mjs [version] [outfile]
 *   version — e.g. 2026-07 | 2027-01 | dev | "" (no header = account default)
 *
 * Reads the token from MONDAY_API_KEY.
 * NEVER prints the token.
 */
import { writeFileSync } from 'node:fs';

const API = 'https://api.monday.com/v2';

function token() {
  const t = process.env.MONDAY_API_KEY;
  if (!t) throw new Error('Set MONDAY_API_KEY to a token with read access.');
  return t;
}

export async function gql(query, version) {
  const headers = {
    Authorization: token(),
    'Content-Type': 'application/json',
  };
  // Sending NO API-Version header gets the current version. An EXPIRED version
  // silently downgrades to the oldest maintained one and halves the surface.
  if (version) headers['API-Version'] = version;
  const res = await fetch(API, { method: 'POST', headers, body: JSON.stringify({ query }) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

const FULL = `query {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      name kind description
      fields(includeDeprecated: true) {
        name description isDeprecated deprecationReason
        args { name description defaultValue type { ...TR } }
        type { ...TR }
      }
      inputFields { name description defaultValue type { ...TR } }
      interfaces { ...TR }
      enumValues(includeDeprecated: true) { name description isDeprecated }
      possibleTypes { ...TR }
    }
  }
}
fragment TR on __Type {
  kind name
  ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } }
}`;

const version = process.argv[2] ?? '';
const out = process.argv[3] ?? `docs/api/.schema-${version || 'default'}.json`;

const [schema, ver] = await Promise.all([
  gql(FULL, version),
  gql('query { version { kind value } }', version),
]);

if (schema.errors) {
  console.error(JSON.stringify(schema.errors, null, 2));
  process.exit(1);
}
writeFileSync(out, JSON.stringify(schema.data.__schema, null, 2));
const v = ver.data.version;
console.log(`requested=${version || '(none)'} served=${v.value} (${v.kind}) types=${schema.data.__schema.types.length} -> ${out}`);
