# Agent Skills

Agent-agnostic skill definitions for this project. Compatible with Claude Code, Cursor, Windsurf, and any agent that reads Markdown skill files.

## Structure

```
docs/.agent/
└── skills/
    └── <skill-name>/
        └── SKILL.md   ← YAML frontmatter + Markdown body
```

Each `SKILL.md` follows this format:

```yaml
---
name: skill-name
description: >
  When to trigger this skill. Written for the agent's routing logic —
  include trigger phrases and context.
---
```

## Skills

| Skill | Description |
|-------|-------------|
| [cv-talks-servers](skills/cv-talks-servers/SKILL.md) | Start / stop the local dev servers (Eleventy :8080 + Editor :3001) |
| [cv-talks-slides](skills/cv-talks-slides/SKILL.md) | Build the slides (Eleventy + SEO) or serve them without the editor, incl. meta mode |
| [cv-talks-testing](skills/cv-talks-testing/SKILL.md) | Run unit tests (Vitest), coverage and E2E (Playwright) |
| [cv-talks-assets](skills/cv-talks-assets/SKILL.md) | Sync design-system fonts and format / check deck Markdown |

## Agent setup

### Claude Code

Claude Code reads project skills from `.claude/skills/`, which is a symlink to
`docs/.agent/skills/` — no extra setup needed.

### Agents that read `.agents/skills/`

`.agents/skills/` holds a copy of the same skills for agents that look there.
Keep it identical to `docs/.agent/skills/` when editing a skill
(`diff -r docs/.agent/skills .agents/skills` should print nothing).

### Other agents

Read `SKILL.md` files from `docs/.agent/skills/*/SKILL.md`. The YAML frontmatter `name` and `description` fields are the routing signal; the Markdown body is the execution instructions.
