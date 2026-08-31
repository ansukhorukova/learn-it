# Anastasiya Brand Package

Ready-to-drop brand system for Claude Code.

## Files

- `brand/BRAND.md` — the source of truth
- `brand/design-tokens.json` — colors, spacing, typography, radius, motion
- `brand/UI-GUIDELINES.md` — component behavior
- `brand/CONTENT-VOICE.md` — product copy rules
- `brand/VISUAL-LANGUAGE.md` — images, illustration, visual direction
- `src/brand.css` — ready-to-use CSS variables
- `.claude/brand-instructions.md` — short instructions you can point Claude Code to

## Recommended Claude Code prompt

```text
Read brand/BRAND.md, brand/design-tokens.json and .claude/brand-instructions.md before making UI changes.

Audit the existing interface against the brand system first.
Do not rewrite functionality.
Create a short plan, then apply the design system consistently.
Reuse existing components where possible.
Do not invent new colors or visual styles outside the tokens.
```

## For a new screen

```text
Design and implement this screen using the brand system in brand/.
Prioritize usability over decoration.
Use brand pink only for meaningful emphasis and primary actions.
The result should feel like Engineering × AI × People: dark technical foundation, pink energy, human warmth.
```

## For a redesign

```text
Before changing code, review this screen against brand/BRAND.md.
List the 5 most important inconsistencies.
Then implement the smallest coherent redesign that brings the screen into the brand system.
Do not turn it into generic SaaS.
```

## Important
The LinkedIn content style is intentionally more expressive than the product UI.
Do not copy carousel visuals 1:1 into application screens.
