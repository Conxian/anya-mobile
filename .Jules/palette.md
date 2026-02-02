## 2024-08-16 - Icon-Only Buttons Require ARIA Labels
**Learning:** Replacing a button's descriptive text with an icon is a common UX enhancement, but it creates a critical accessibility regression if not handled correctly. Screen readers lose the context of the button's function. The `title` attribute is insufficient as its screen reader support is inconsistent.
**Action:** Whenever converting a text-based button to an icon-only button, I must add a descriptive `aria-label` attribute to the `<button>` element to ensure its function is clearly announced to screen reader users. This maintains accessibility while improving the visual design.

## 2024-08-17 - Race Conditions in Copy-to-Clipboard Feedback
**Learning:** Rapidly clicking a button that provides temporary visual feedback (like a 'Copied!' checkmark) can lead to a race condition where the original button text is overwritten by the feedback text if not handled correctly.
**Action:** Use a `clearTimeout` mechanism and capture the `originalText` outside the event listener or ensure it's not captured while the feedback state is active. This ensures the button always reverts to its true original state.

## 2024-08-17 - Standard Privacy Pattern for Sensitive Data
**Learning:** For a Bitcoin wallet, displaying the mnemonic in plain text by default is a privacy risk. Users expect sensitive data to be masked.
**Action:** Implement a standard "Show/Hide" toggle pattern for mnemonics. Mask the value with dots by default and provide a clear visual toggle (e.g., eye icon) that also updates ARIA labels for accessibility.
## 2024-08-18 - Hiding Empty Containers for Cleaner Initial State
**Learning:** Containers with borders, padding, or background colors can appear as distracting "empty boxes" when they don't have content yet. This can look like a UI bug or incomplete state to the user.
**Action:** Use the `:empty` CSS pseudo-class to hide these containers when they have no content, ensuring a cleaner and more professional initial interface state.
