# TRANSLATION_WORKFLOW.md — หอมฉลุย

> Powered by 2T9COME
> Binding rules: `I18N_RULES.md §5–6`.

## Source of truth
Thai (`th`). en/zh derive from the approved Thai content.

## Status lifecycle
`missing → draft → machine_translated → needs_review → approved → published`
(`published` + Thai-source edit → `outdated → needs_review → ...`).
Only `published` is served, indexed, sitemapped, hreflang-linked.

## Steps
1. Write & publish Thai. 2. Generate en draft (machine allowed). 3. **Human review** en.
4. Publish en. 5. Generate zh draft. 6. **Human review** zh. 7. Publish zh.
Machine translation is never auto-published.

## Outdated handling
Editing the Thai source auto-flags all non-Thai translations `outdated` (still served until
re-approved) and queues them. Backoffice shows the outdated count.

## Tracking
`translation_jobs` (queue) + `translation_logs` (status transitions, actor, note). Backoffice
Translation Manager drives the matrix and the "should translate next" queue.

## Roles
Translator (drafts/edits), SEO Manager (SEO fields), Editor/Admin (approve/publish).
