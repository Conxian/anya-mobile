## 2024-07-25 - The Build Artifact Blunder

**Learning:** I made a critical error by modifying `public/app.js` and including it in a code review. This file is a build artifact, and any changes to it are temporary and unmaintainable. The reviewer correctly identified this as a major anti-pattern. The key takeaway is to **never directly edit or commit build artifacts.** All changes must be made to the source code, which is then built to generate the final output.

**Action:** I will always ensure that build artifacts are properly ignored by git and that I only stage and commit changes to the original source files. Before submitting any change, I will double-check the staged files to ensure no build artifacts have been accidentally included.
