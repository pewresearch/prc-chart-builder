# Documentation

This directory contains general documentation for the PRC Chart Builder plugin.

## Core Docs

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — System architecture, data flow, state management patterns, decision matrix, synced-chart visibility rules, and export filename / share-URL behavior. Start here for a structural overview of how the three tiers (Admin, Block Editor, Charting Library) fit together.
- **[VIEWPORT_ATTRIBUTES.md](VIEWPORT_ATTRIBUTES.md)** — How viewport-aware block attributes work (Desktop / Tablet / Mobile overrides)
- **[VIEWPORT_BREAKPOINTS.md](VIEWPORT_BREAKPOINTS.md)** — Breakpoint values and their role in responsive chart rendering
- **[VIEWPORT_USAGE_GUIDE.md](VIEWPORT_USAGE_GUIDE.md)** — Practical guide to authoring responsive chart customizations
- **[Chart Handoff (PCH)](../includes/chart-handoff/README.md)** — Technical reference for the one-way pewplots → Chart Builder import pipeline: PCH schema, data flow, tidy-to-wide pivot, chart type mapping, REST endpoint, and fixture index.

## Changelog

A scannable version history is at **[CHANGELOG.md](../CHANGELOG.md)** in the plugin root. Format follows [Keep a Changelog](https://keepachangelog.com/).

## Release Notes

Release notes are in [`release-notes/`](release-notes/). Each file covers one version.

| Version | File                                             | Highlights                                                                                                                              |
| ------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 3.7.0   | [release-notes/3_7_0.md](release-notes/3_7_0.md) | PCH import pipeline (pewplots → Chart Builder), tidy-to-wide pivot, chart type mapping, 3-layer attribute merge, v1 block validation fix |
| 3.6.0   | [release-notes/3_6_0.md](release-notes/3_6_0.md) | Server-side PNG export (ScreenshotOne), static fallback image, synced chart PNG resolution |
| 3.5.0   | [release-notes/3_5_0.md](release-notes/3_5_0.md) | Chart Library admin, AI generation, element popover system, Sankey, Treemap, dark mode, scatter grouping + regression, map improvements |

## Plans & Specs

Active and completed planning documents are in [`plans/`](plans/):

- **[CHART_GALLERY_PLAN.md](plans/CHART_GALLERY_PLAN.md)** — Full implementation plan for the DataViews chart gallery, Create New Chart modal, AI Chart Wizard, and live block previews
- **[CHART_GALLERY_PHASE_5_BACKLOG.md](plans/CHART_GALLERY_PHASE_5_BACKLOG.md)** — Deferred polish items (bulk actions, URL state, keyboard nav, search, CSV drop-to-create) for future issues
- **[CHARTING_PATTERNS_PLAN.md](plans/CHARTING_PATTERNS_PLAN.md)** — Plan for chart pattern templates used in the Create New Chart flow
- **[LEGEND_TOOLTIP_CUSTOMIZATION.md](plans/LEGEND_TOOLTIP_CUSTOMIZATION.md)** — Legend and tooltip customization design notes
- **[COMMIT_MESSAGE.md](plans/COMMIT_MESSAGE.md)** — Commit message templates and guidelines

## Issue-Specific Documentation

Issue-specific documentation is organized in the `specs/` directory at the plugin root:

- **specs/issue-1386/** — V1 to V2 attribute migration documentation
- **specs/issue-2013/**, **specs/issue-2016/** — Other issue-specific specs and plans
