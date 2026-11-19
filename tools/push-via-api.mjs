// Commit the staged working tree and push it to GitHub through the Git Data API.
//
// Why this exists: on some networks `github.com:443` (the git protocol endpoint) is
// blocked while `api.github.com` still works, so `git push` fails with
//   fatal: unable to access 'https://github.com/<owner>/<repo>.git/':
//   Failed to connect to github.com:443
// Git objects are content-addressed, so uploading the same blobs / tree / commit
// reproduces the same SHA locally and remotely — `git status` stays clean and a later
// `git push` works without a merge. Two details must be exact or the SHAs diverge:
//   1. the commit message must carry NO trailing newline (GitHub trims it);
//   2. author/committer timezones must be written as +0000 (GitHub stores UTC).
//
// Usage: node tools/push-via-api.mjs "commit message"
//        REPO=owner/name node tools/push-via-api.mjs "commit message"
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPO = process.env.REPO ?? 'jadeji00/dsh-handoff-log'
const BRANCH = process.env.BRANCH ?? 'main'
const message = process.argv[2]
if (!message) throw new Error('usage: node tools/push-via-api.mjs "commit message"')

const git = (args, input) => execFileSync('git', args, { cwd: DIR, encoding: 'utf8', input }).trim()

// Reuse whatever credential the machine already stores for github.com.
const creds = execFileSync('git', ['credential-wincred', 'get'], {
  input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8',
})
const token = /password=(.*)/.exec(creds)?.[1]?.trim()
if (!token) throw new Error('no github.com credential found in the Windows credential store')

const API = 'https://api.github.com'
async function api(path, init = {}) {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'dsh-handoff-log-push',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} -> ${res.status}: ${text.slice(0, 500)}`)
  return text ? JSON.parse(text) : null
}

const HEAD = git(['rev-parse', 'HEAD'])
const tree = git(['write-tree'])
const [name, email, at] = git(['log', '-1', '--pretty=%an|%ae|%at|%aI']).split('|')

const body = [
  `tree ${tree}`,
  `parent ${HEAD}`,
  `author ${name} <${email}> ${at} +0000`,
  `committer ${name} <${email}> ${at} +0000`,
  '',
  message,
].join('\n')

const commit = git(['hash-object', '-t', 'commit', '-w', '--stdin'], body)
console.log(`built local commit ${commit}`)

const blobs = []
for (const line of git(['ls-tree', '-r', commit]).split('\n').filter(Boolean)) {
  const [meta, path] = line.split('\t')
  const [mode, type, sha] = meta.split(' ')
  if (type !== 'blob') continue
  const content = execFileSync('git', ['cat-file', 'blob', sha], { cwd: DIR, maxBuffer: 64 * 1024 * 1024 })
  const uploaded = await api(`/repos/${REPO}/git/blobs`, {
    method: 'POST', body: JSON.stringify({ content: content.toString('base64'), encoding: 'base64' }),
  })
  if (uploaded.sha !== sha) throw new Error(`blob sha mismatch for ${path}`)
  blobs.push({ path, mode, type: 'blob', sha })
}

const remoteTree = await api(`/repos/${REPO}/git/trees`, {
  method: 'POST', body: JSON.stringify({ tree: blobs }),
})
if (remoteTree.sha !== tree) throw new Error(`tree sha mismatch: local ${tree}, remote ${remoteTree.sha}`)

const isoDate = new Date(Number(at) * 1000).toISOString().replace(/\.\d+Z$/, 'Z')
const created = await api(`/repos/${REPO}/git/commits`, {
  method: 'POST',
  body: JSON.stringify({
    message,
    tree,
    parents: [HEAD],
    author: { name, email, date: isoDate },
    committer: { name, email, date: isoDate },
  }),
})
if (created.sha !== commit) throw new Error(`commit sha mismatch: local ${commit}, remote ${created.sha}`)

await api(`/repos/${REPO}/git/refs/heads/${BRANCH}`, {
  method: 'PATCH', body: JSON.stringify({ sha: commit, force: false }),
})

git(['update-ref', `refs/heads/${BRANCH}`, commit])
git(['reset', '--mixed'])
git(['update-ref', `refs/remotes/origin/${BRANCH}`, commit])
console.log(`pushed ${commit} to refs/heads/${BRANCH} (identical SHA)`)

const changed = git(['diff-tree', '-r', '--no-commit-id', '--name-only', commit]).split('\n').filter(Boolean)
console.log(`\nchanged (${changed.length}):`)
for (const file of changed) console.log(`  ${file}`)
