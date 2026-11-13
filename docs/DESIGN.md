# GitEx — DESIGN.md

**Purpose:** Visual and interaction direction for the GitEx MVP.  
**Status:** Proposed design direction for implementation.  
**Product:** GitEx — understand any repository without reading everything.

## 1. Product experience

GitEx should feel like a focused developer research workbench: calm, precise, information-dense without being cramped, and built around reading technical material.

The primary job is not to impress users with an AI landing page. It is to help them move from an unfamiliar repository URL to a trustworthy understanding of what the project does and how to try it.

**Experience principles**
- Lead with the repository URL input. It is the primary action and should be immediately obvious.
- Treat analysis as a technical document, not a chat transcript.
- Make evidence, source paths, commands, and caveats easy to inspect.
- Prefer clear hierarchy and useful whitespace over decorative containers.
- Keep the interface quiet so the repository content carries the visual weight.

## 2. Visual direction

### Concept: The developer's field notebook

A hybrid of a technical reference manual and a modern code editor: editorial reading surfaces, restrained chrome, crisp typography, and small high-contrast accents for actions and statuses.

This is a direction, not a template to copy from another product.

### Color palette

Use a warm, near-white canvas with deep ink text and a single electric-citrus accent. Dark mode should use deep charcoal rather than pure black.

| Token | Light | Dark | Purpose |
|---|---|---|---|
| Canvas | `#F7F7F2` | `#171916` | Main application background |
| Surface | `#FFFFFF` | `#20231F` | Reading and input surfaces |
| Surface muted | `#ECEDE6` | `#292D28` | Secondary regions |
| Text primary | `#20231F` | `#F1F2EA` | Main text |
| Text secondary | `#686D63` | `#A8AEA2` | Supporting text |
| Border | `#D9DCD2` | `#3A4038` | Dividers and outlines |
| Accent | `#C7F36B` | `#C7F36B` | Primary action and selected states |
| Accent ink | `#20231F` | `#20231F` | Text/icons on accent |
| Success | `#287A52` | `#65C58B` | Completed states |
| Warning | `#A76518` | `#E6B15E` | Warnings and caveats |
| Danger | `#B5413B` | `#F07870` | Errors |

Use accent sparingly: primary CTA, active navigation marker, and a few meaningful highlights. Do not use gradients as decoration. Do not rely on color alone to communicate status.

### Typography
- **UI and reading:** IBM Plex Sans (or a metrically similar system sans fallback).
- **Code, paths, metadata identifiers:** IBM Plex Mono.
- Use a clear type scale with strong distinction between page title, section heading, body, labels, and metadata.
- Body copy should be comfortable for long technical reading. Avoid tiny low-contrast metadata.

### Shape, borders, and elevation
- Use mostly square or subtly rounded geometry: 6–10px radius for controls and content surfaces.
- Prefer 1px borders and spacing to separate regions.
- Avoid stacking cards inside cards.
- Use shadows only when an element genuinely floats above content, such as a menu or dialog.
- Do not wrap every section in a card.

## 3. Information architecture and layouts

### Main dashboard
The dashboard is a launch point, not a marketing landing page.
- A compact header with GitEx wordmark, theme control, and a clear history entry point.
- A focused repository URL field as the dominant element.
- Provider recognition for GitHub and GitLab, with concise validation feedback.
- A small recent-analysis list below the input. Show repository name, owner/provider, language if known, and last analyzed time.
- For an empty state, explain the one-step workflow and show one realistic example URL. Do not add fake metrics, testimonials, or decorative feature-card grids.

### Analysis workspace
Use a documentation-first layout.
- A narrow left navigation/contents rail for the 12 analysis sections.
- A central reading column with a comfortable maximum line length.
- A compact repository identity row above the document: owner/name, provider, revision/commit when available, language, stars, and source link.
- A right-side evidence/context rail may be used on wide screens only when it contains real source references or useful metadata. Do not create an empty sidebar just to balance the layout.
- On smaller screens, collapse the section navigation into an accessible contents control and keep the reading column full width.

### Analysis progress
Show progress as explicit named stages: Validating, Fetching, Processing, Analyzing, Generating, Completed, or Failed.
- Communicate what is happening and what the user can do next.
- Avoid fake percentage progress when the underlying operation cannot report it.
- Preserve useful error messages and offer retry where appropriate.

### Analysis document
- Keep the 12 predefined sections in a consistent order.
- Use real heading hierarchy and a table of contents.
- Render code with syntax highlighting, language labels, and a copy action.
- Installation steps should be numbered and copyable command blocks should be visually distinct from prose.
- Mark unsupported or undocumented information explicitly.
- Display source paths/links close to the claims they support.
- Separate repository facts from AI recommendations.

## 4. Components and interaction behavior

### Repository URL input
- Accept GitHub and GitLab repository URLs.
- Keep the entered value visible after validation errors.
- Provide clear focus, invalid, loading, and disabled states.
- Submit with Enter as well as the primary button.

### Buttons
- Use one visually dominant primary action per view.
- Secondary actions should be quieter and text-forward.
- Destructive actions require clear labels and confirmation when data loss is meaningful.
- Every interactive control needs hover, focus-visible, active, disabled, and loading states as applicable.

### History
- Use a compact list/table-like presentation rather than a grid of oversized cards.
- Make repository identity and analysis date scannable.
- Confirm before clearing all history.
- Explain that history is stored in this browser only.

### Code and commands
- Use a monospace face and restrained syntax colors with sufficient contrast.
- Copy actions must provide visible success/failure feedback.
- Do not make a command look safe to run if it has not been verified against the repository.

### Notifications and errors
- Use inline feedback for field-level validation.
- Use concise toast/status feedback for completed copy and save actions.
- Errors must explain the cause when known and give a recovery action when possible.
- Never imply an analysis succeeded if required sections failed to generate.

## 5. Motion
Motion should explain state changes, not decorate the page.
- Use short transitions for focus, hover, menu, and theme changes.
- Use a restrained stage transition for analysis progress.
- Respect reduced-motion preferences.
- No perpetual pulsing, floating blobs, animated gradients, or attention-grabbing effects without a functional reason.

## 6. Accessibility and responsive behavior
- Meet WCAG AA contrast for text and controls.
- All functionality must be keyboard accessible.
- Provide visible focus indicators.
- Use semantic landmarks, headings, labels, and buttons.
- Announce meaningful progress and completion states to assistive technology.
- Do not use color as the only status indicator.
- At narrow widths, prevent horizontal overflow; code blocks may scroll horizontally within their own container.
- Touch targets should be comfortably usable on mobile.
- Test at phone, tablet, laptop, and wide desktop widths rather than only one mobile and one desktop breakpoint.

## 7. Content voice
GitEx copy should sound like a technically capable teammate: direct, specific, neutral, and helpful.
- Prefer concrete labels such as “Analyze repository”, “Prerequisites”, and “Installation”.
- Avoid generic AI marketing language such as “Unlock the power”, “Supercharge your workflow”, or claims that GitEx understands everything.
- Do not invent stars, compatibility, maintenance status, security findings, or production-readiness claims.
- Distinguish verified repository facts, inferred explanations, and recommendations.

## 8. MVP boundaries
- MVP is a single Node.js MVC application with browser LocalStorage for analysis history.
- No external database, account system, or cloud synchronization in MVP.
- The Node.js server handles repository fetching, Repomix processing, and Gemini API calls; secrets must not be exposed to browser code or persisted in LocalStorage.
- GitHub and GitLab public repositories are the initial supported inputs.
- The analysis output is a structured technical guide, not a conversational chatbot.

### PageIndex decision
**PageIndex is optional and excluded from the MVP critical path.** The first release should produce the 12-section repository guide using repository metadata, README, manifests, repository tree, and selected source files processed through Repomix.

PageIndex belongs to **Phase 2**, when GitEx adds repository-aware chatbot / question answering over a codebase. At that point, evaluate:
1. The official [VectifyAI/PageIndex](https://github.com/VectifyAI/PageIndex) implementation as the first candidate.
2. A small custom Python tree-indexing/retrieval implementation only if the official implementation does not fit the repository/code use case or its integration constraints.

Do not build a custom PageIndex clone during MVP. Phase 2 should validate code-repository indexing, retrieval quality, source-path citations, latency, operating cost, and how the Python component communicates with the Node.js application before selecting an approach.

## 9. Anti-slop design workflow
GitEx UI work must use [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop) as a quality filter alongside this design direction.

Anti-slop is not a visual theme or component library. It filters generic UI/copy/code patterns; this DESIGN.md supplies the product-specific visual direction.

Project setup:
- Run `npx antislop-ai` from the project and follow its installer to install the core rules for the coding agent being used.
- Select the UI skill for interface work.
- Also select the accessibility/human and responsive-layout skills for shipped UI.
- Use the copywriting skill when writing interface text.
- For new UI, use the during-build workflow; for an audit of existing UI, use the audit workflow.
- Follow the installed rules and complete the required Delivery Gate before calling UI work done.
- Treat this file as the source of GitEx visual direction; do not replace it with a generic template or copy another product's visual identity.

Before shipping, review:
- Does each major visual decision have a product-specific reason?
- Does the layout serve repository analysis and technical reading?
- Are there generic hero/card-grid patterns or decorative elements with no purpose?
- Are keyboard, focus, contrast, responsive, loading, empty, and error states implemented?
- Have the actual interactive controls been exercised?

## 10. Design decision rationale

| Decision | Reason |
|---|---|
| Developer field-notebook direction | The core task is researching and reading technical repositories |
| Warm neutral canvas and ink text | Long-form technical content needs a calm reading surface |
| Citrus accent used sparingly | Creates a recognizable action color without competing with code |
| Sans + monospace typography | Separates interface language from code and identifiers |
| Documentation-first analysis layout | The output is a structured guide, not a chat-first experience |
| Compact history list | Repository identity and recency matter more than decorative previews |
| PageIndex deferred to Phase 2 | MVP is structured one-shot analysis; hierarchical retrieval is more valuable for later codebase Q&A |
| LocalStorage for MVP history | Keeps the first release local-first and avoids database infrastructure |
