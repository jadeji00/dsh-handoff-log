# dsh-handoff-log

A DeepSeek Harness bundle that adds the **handoff-log** skill: a project-level handover record that any agent or human can pick up at any time.

## What it does

The skill maintains two files at a project root:

- **`AGENTS.md`** — the signpost. Almost every coding agent reads it automatically, and it points at the handover book.
- **`HANDOFF.md`** — the handover book, in four sections: goal and direction, current progress, next steps, and an append-only log of pitfalls with their fixes.

Because the record lives in the project directory rather than in one agent's memory, work survives session ends, model swaps, and a change of tools.

## When the skill triggers

Ask the agent to initialize a handoff log when starting a project, to read and verify it before taking over, and to update it before finishing. The skill also loads when the work is described as handoff, project log, progress notes, pitfall notes, or several agents working the same project.

Three scenes are covered:

1. **Initialize** — create `AGENTS.md` and `HANDOFF.md` from the bundled templates.
2. **Take over** — read the signpost, read the handover book, then verify the recorded progress instead of trusting a previous agent's "done".
3. **Hand off** — write verifiable progress, executable next steps, and one pitfall entry per problem solved.

Parallel work is covered too: one writer at a time, with a claim line for whoever is working.

## Rules it enforces

- Read before you act; write before you leave.
- Append only. Superseded content is marked as replaced, never deleted.
- Project-level pitfalls stay in the project; environment-wide notes belong in a global profile.
- Secrets, tokens, and private configuration are never written into the handover record — only where to find them.

## Install

In DSH: **Plugins** → **Add plugin**. Four kinds of target are accepted:

| Target | Example |
| --- | --- |
| Local directory (**absolute path required**) | `E:\code\dsh-handoff-log` |
| npm package name (once published) | `dsh-handoff-log` |
| Repository address | `https://github.com/<you>/dsh-handoff-log` |
| Tarball | `E:\code\dsh-handoff-log-0.1.0.tgz` |

From the CLI the same bundle installs through the plugin manager. `plugin` must be followed by `--profile`; the remaining arguments are forwarded to pnpm verbatim:

```
dsh plugin --profile <profile-name> add /absolute/path/to/dsh-handoff-log
```

The `desktop` profile shipped with the desktop app is managed exclusively by the Electron app, so the CLI refuses it (`profile "desktop" is managed exclusively by the Electron application`); use **Add plugin** there instead.

## What changes when it is turned off

The skill disappears from the agent catalog. Files already created in project directories are left as they are.
