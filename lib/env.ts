import { env } from 'cloudflare:workers'

/** Worker bindings and secrets are read at request time, never captured from Node process.env. */
export function getRuntimeEnv() {
  return env
}
