# AGENTS.md

- Greenfield: `D:\playwright\hms` is currently empty — no `package.json`, no Playwright config, no tests.
- Intended stack (not yet scaffolded): Playwright + TypeScript for hosted web app. Do not assume framework structure exists until created.
- Baseline env verified 2026-09-19: Node v24.14.1, npm 11.11.0, Playwright 1.63.0 via `npx`, Git 2.47.0, VS Code 1.134.0.
- Working agreement: step-by-step build, explain before each major change. Do not scaffold framework/tests unprompted.
- When scaffolding: prefer `npm init -y && npm i -D @playwright/test && npx playwright install --with-deps chromium` then TypeScript strict config. Verify with `npx playwright test --list`.
