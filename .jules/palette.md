## 2024-07-25 - The Build Artifact Blunder

**Learning:** I made a critical error by modifying `public/app.js` and including it in a code review. This file is a build artifact, and any changes to it are temporary and unmaintainable. The reviewer correctly identified this as a major anti-pattern. The key takeaway is to **never directly edit or commit build artifacts.** All changes must be made to the source code, which is then built to generate the final output.

**Action:** I will always ensure that build artifacts are properly ignored by git and that I only stage and commit changes to the original source files. Before submitting any change, I will double-check the staged files to ensure no build artifacts have been accidentally included.

## 2025-05-15 - Visual Hierarchy and Privacy in Wallet UI

**Learning:** Users often feel overwhelmed by dense technical information like mnemonics and addresses. Monospaced formatting (using <code> tags) significantly improves readability. Additionally, providing a "Close" or "Clear" action for sensitive data is a critical privacy feature that enhances user trust. Consistent use of layer icons (🟠, ⚡, 💧) helps users instantly distinguish between different Bitcoin layers in a unified view.

**Action:** I will always look for opportunities to group technical data into logical sections with dividers and provide clear monospaced formatting for identifiers. I will also ensure that any UI displaying sensitive data has a way to clear or hide that data when it is no longer needed.
