# Specification

## Summary
**Goal:** Add an opt-in, privacy-preserving learning mechanism that contributes only anonymized aggregate signals (no private text leakage) and reduce repetitive Mama replies via deterministic anti-repetition behavior.

**Planned changes:**
- Add backend support (single Motoko actor) for per-user opt-in preference (set/get), authenticated ingestion of anonymized signal records (reject any raw text fields), and querying of high-level aggregate public-memory signals (no principals or text returned).
- Add a Private Chat UI control (Persian-labeled) to enable/disable privacy-preserving learning; persist and restore the toggle state via backend APIs.
- When opt-in is enabled, derive and send anonymized/aggregate signal payloads from private messages after existing keyboard correction/normalization, ensuring no raw private message text is included in the payload.
- Extend the Mama pipeline with a deterministic anti-repetition strategy within the current chat UI session; when repetition triggers, switch to a different deterministic template and include the exact Persian phrase «لرد، بذار یه زاویه جدید باز کنیم» in the response content.
- Use aggregate public-memory signals as an additional deterministic input in Public Chat response selection to improve variety/grounding without referencing private chat origins; fall back to existing behavior if signal queries fail.

**User-visible outcome:** Users can opt in (or keep off) a privacy-preserving learning setting in Private Chat; when enabled, their private messages contribute only anonymized aggregate signals. Mama repeats itself less in a session (and uses the specified Persian “new angle” phrase when it would repeat), and Public Chat responses can be influenced by aggregate signals without revealing any private information.
