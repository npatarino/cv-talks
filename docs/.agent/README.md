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
| [cv-talks-dev](skills/cv-talks-dev/SKILL.md) | Start the local dev environment (Eleventy :8080 + Editor :3001) |

## Agent setup

### Claude Code

Point the skill loader at this directory in `.claude/settings.json`:

```json
{
  "skillsRootDir": "docs/.agent/skills"
}
```

### Other agents

Read `SKILL.md` files from `docs/.agent/skills/*/SKILL.md`. The YAML frontmatter `name` and `description` fields are the routing signal; the Markdown body is the execution instructions.
