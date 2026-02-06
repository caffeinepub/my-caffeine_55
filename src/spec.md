# Specification

## Summary
**Goal:** Add a deterministic per-message “heartbeat” processing pipeline in chat that runs a fixed 7-step refinement sequence before generating Mama’s reply, with a visible 7-step progress indicator and lightweight UI-only feedback.

**Planned changes:**
- Implement a deterministic 7-step per-message pipeline that runs after the user message is stored and before Mama’s response is stored, working in both private and public chat modes.
- Add a “heartbeat” processing UI on ChatPage that shows an active pulse and a 7-step timeline/stepper (pending → active → completed, with failed state on error) for the latest message, and allow collapsing/dismissing after completion.
- Extend Mama response generation to output both the final response text and a deterministic structured feedback payload from the same pipeline run, and render that feedback in the UI as a non-persisted annotation for the latest interaction.

**User-visible outcome:** When a user sends a message, they see a heartbeat-style 7-step processing indicator while Mama prepares a reply; after completion they receive Mama’s response plus a small feedback annotation explaining what was refined, without altering chat history storage.
