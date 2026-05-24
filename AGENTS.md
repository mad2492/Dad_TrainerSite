# Agent Notes

## Project Purpose

This repo is a living proposal and planning workspace for Pete and Lisa Fonseca's online training business idea.

The public HTML page is used to communicate the evolving proposal back to Pete in a simple, phone-friendly way. The Markdown docs are the internal working notes for business process, offer definition, branding, infrastructure, and future product planning.

## Default Workflow

When new answers or business context arrive:

1. Capture the raw insight in the relevant Markdown docs.
2. Update the public `index.html` if the information changes what Pete should see in the living proposal.
3. Keep the tone practical, warm, non-technical, and father-friendly.
4. Avoid jargon, hype, and premature app/platform details.
5. Commit and push changes to `main`.
6. Return a cache-busted GitHub Pages link using the new commit hash.

## Skills To Prefer

Use these installed skills when they are available in the session:

- `meeting-notes-and-actions`: turn Pete/Lisa answers into decisions, questions, and next actions.
- `meeting-insights-analyzer`: extract themes, pain points, objections, and repeated needs from conversation notes.
- `content-research-writer`: improve proposal/site copy while keeping it plain and credible.
- `theme-factory`: use after brand direction, name, colors, and tone are clearer.
- `domain-name-brainstormer`: use once naming/domain exploration begins.
- `webapp-testing`: use once interactive demos or portal flows exist.

## Living Proposal Rules

- Treat `index.html` as a conversation artifact, not a final website.
- Update it when Pete's answers clarify the business model or next decision.
- Do not build a polished website mockup before the offer, brand structure, and visual direction are clear.
- Keep each iteration easy to read on an iPhone.
- Make the latest understanding visible on the page so Pete sees that his feedback is shaping the idea.

## Current Business Understanding

- Pete and Lisa Fonseca are the shared coaching brand.
- Pete has about 35 years of experience.
- Lisa has about 25 years of experience.
- The offer should feel as close as possible to one-on-one training.
- The positioning should emphasize personalized coaching, not a cookie-cutter program.
- Online training includes workout programming, nutrition guidance, and weekly check-ins.
- Check-ins include weight, training injuries, and optional progress photos.
- Messaging should have boundaries, currently one message per day with an agreed response window.
- Simplicity is the key to making 20 to 30 online clients manageable.

## Infrastructure Principles

- Stay static while this is a pitch/proposal site.
- GitHub Pages is enough for the current public page.
- Do not introduce authentication, databases, file uploads, or payments until the workflow proves they are needed.
- When private client data enters scope, revisit authentication, database, storage, backups, and privacy/security requirements before building.
- Keep payments optional and late.

## Git Protocol

- Use local `git` for status, diffs, staging, commits, and pushes.
- On this host, Git metadata writes and pushes may need escalated execution so Codex can access the normal Windows credential/keyring context.
- After pushing a public-page change, use the new commit hash as a cache buster:

```text
https://mad2492.github.io/Dad_TrainerSite/index.html?v=<commit>
```

