# Bolt's Journal ⚡

A log of critical performance learnings to build institutional knowledge and avoid repeating mistakes.

## 2024-07-25 - Never Edit Build Artifacts

**Learning:** I identified a correct performance optimization but failed multiple code reviews because I directly modified the bundled output file (`public/app.js`) instead of the source files (`src/*.ts`). Manually editing build artifacts is a critical anti-pattern. They are ephemeral, unmaintainable, and will be overwritten by the next build, silently erasing the change. The code review system will always block such changes.

**Action:** Always modify the source files (`src/`) exclusively. After making changes, run the designated build command (e.g., `node build.js`, `pnpm build`) to regenerate the artifacts. When committing, only stage the modified source files and necessary configuration files, never the generated bundles.
