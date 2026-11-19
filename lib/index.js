/**
 * Host half of the handoff-log bundle.
 *
 * The bundle's only runtime entry is the Skill provider row declared in
 * `cordis.patch.yml`; this module exists so the package has a resolvable
 * runtime export and a stable place for the shared helper below.
 */

import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

/** Package name used for self-resolution from the DSH profile. */
export const PACKAGE_NAME = 'dsh-handoff-log'

/**
 * Resolve the packaged Skill root (`<package>/skills`) from a DSH profile base URL.
 *
 * @param profileBaseUrl - the Loader's `baseUrl` for the active profile.
 * @returns the absolute path of the bundled Skill root.
 */
export function resolveSkillRoot(profileBaseUrl) {
  if (!profileBaseUrl) {
    throw new Error('dsh-handoff-log: missing DSH profile baseUrl for package resolution')
  }
  let manifestPath
  try {
    manifestPath = createRequire(profileBaseUrl).resolve(`${PACKAGE_NAME}/package.json`)
  } catch (error) {
    throw new Error(`dsh-handoff-log: cannot resolve ${PACKAGE_NAME}/package.json from the DSH profile`, { cause: error })
  }
  return join(dirname(manifestPath), 'skills')
}
