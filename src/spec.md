# Specification

## Summary
**Goal:** Make Mama automatically expand response angles and increase answer depth in a deterministic, privacy-preserving way, while keeping the existing response pipeline and transparency UX intact.

**Planned changes:**
- Add an automatic internal “angle expansion” step that generates and selects multiple response angles without any user configuration, while remaining deterministic and compatible with existing response paths (FAQ match, civic-empowerment, empathetic).
- Strengthen non-FAQ response structures to be deeper and more creatively organized (e.g., diagnosis, actionable steps, reflective question, alternative perspective, concise summary) without adding any external AI/LLM dependencies.
- Extend deterministic selection and repetition-avoidance to any new angle/templates (continue using lastTemplateKey; diversify via aggregate variety seed in Public chat).
- Expand and use privacy-preserving learning signals (no raw private text stored) plus backend aggregate stats/seed to bias deterministic angle/template selection over time.
- Update the Transparency page to display high-level self-improvement indicators from aggregate stats (aggregate variety seed and a small anonymized category table) while keeping the existing auto-refresh behavior.

**User-visible outcome:** Mama’s replies more often include multiple helpful angles and deeper structure automatically (in both Private and Public chat), remain non-repetitive and deterministic, and the Transparency page shows new aggregate/self-improvement indicators without exposing any private message content.
