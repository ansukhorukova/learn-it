# Anastasiya Brand System

## Purpose
This design system translates Anastasiya's LinkedIn visual identity into a usable product UI for Claude Code.

The brand is built around one idea:

> **Human warmth inside technical complexity.**

Alternative operating phrase:

> **Dark technical foundation. Pink energy. Human warmth.**

The product should feel:
- intelligent
- technical
- warm
- curious
- confident
- experimental
- premium
- human

It must NOT feel:
- like a generic blue SaaS dashboard
- sterile
- corporate
- overloaded with cyberpunk effects
- like an AI hype landing page
- visually noisy

---

## Brand Positioning

Core territory:

**Engineering × AI × People**

Supporting ideas:
- Build ideas.
- Grow people.
- Create impact.
- Build. Learn. Ship.
- Better tools → better impact.
- AI does not replace thinking — it frees time for it.
- Experience. Curiosity. Impact.

The brand combines:
1. engineering rigor
2. AI experimentation
3. teaching and mentoring
4. human-centered technology
5. visible learning-by-doing

---

## Visual Personality

### Foundation
Use a dark, near-black technical base.

### Energy
Use neon pink / magenta for emphasis, active states, selected items, important numbers, and key calls to action.

### Warmth
Counterbalance the dark UI with:
- warm photography
- off-white text
- handwritten notes
- subtle warm highlights
- human language
- occasional imperfect / tactile details

### Atmosphere
Think:
- modern engineering studio
- dark mode
- cozy workspace
- cinematic lighting
- subtle tech diagrams
- premium, not flashy

---

## Product Adaptation Rule

The LinkedIn visual identity is expressive.
The product UI must be calmer.

Use this rule:

**80% functional dark product UI + 15% brand character + 5% glow.**

Do not make every element pink.
Do not make every surface glow.
Do not put gradients on everything.

Pink is an accent, not the product background.

---

## Color Principles

Canonical tokens live in `design-tokens.json`.

Main usage:
- `background.primary`: application background
- `background.secondary`: panels and navigation
- `surface.default`: cards
- `surface.elevated`: modal / popover / highlighted areas
- `brand.pink`: primary brand emphasis
- `brand.magenta`: hover / secondary accent
- `brand.purple`: supportive accent only
- `text.primary`: primary readable text
- `text.secondary`: supporting copy
- `border.default`: neutral borders

Semantic colors are functional and should not be recolored pink:
- success = green
- warning = amber
- info = blue
- error = red

---

## Typography

Use a modern sans-serif.

Preferred order:
1. Inter
2. Geist
3. system-ui

Do not require a custom font to make the product usable.

### Hierarchy
- Display: 56–64px, 700
- H1: 40px, 700
- H2: 32px, 700
- H3: 24px, 600
- Body: 16px, 400
- Small: 14px, 400
- Micro: 12px, 500

Use bold typography selectively.
Avoid turning every title into uppercase.

---

## Layout

### Core principles
- clear visual hierarchy
- generous negative space
- strong alignment
- readable content density
- no card soup

### Grid
Use an 8px spacing system.

Recommended max content width:
- app: 1440px
- reading content: 760–880px
- forms: 520–680px

### Page composition
Prefer:
- one clear page purpose
- one dominant visual hierarchy
- grouped related content
- fewer, stronger cards

Avoid:
- grids of 12 equally-important cards
- tiny text everywhere
- excessive badges
- heavy decoration around normal content

---

## Components

### Primary Button
- brand pink background
- dark or white text depending on contrast
- medium radius
- no permanent glow
- subtle brighter hover state

### Secondary Button
- dark surface
- neutral or pink border
- white text

### Ghost Button
- transparent
- no border by default
- pink/text highlight on hover

### Cards
Default cards:
- dark surface
- subtle neutral border
- no glow

Highlighted cards:
- pink border or restrained soft glow
- reserve for selected / important / actionable content

### Inputs
- dark background
- neutral border
- pink focus ring
- clear labels
- never rely on placeholders as labels

### Navigation
- dark and restrained
- selected state may use pink icon/text/underline
- avoid large neon navigation blocks

---

## Glow Rules

Glow is a reward for importance.

Allowed:
- primary CTA hover
- selected feature
- hero graphic
- one key metric
- focus state
- decorative illustration

Do not use glow:
- on every card
- on body text
- behind all icons
- as a substitute for hierarchy

When in doubt: remove the glow.

---

## Iconography

Preferred:
- outline icons
- rounded corners
- consistent stroke width
- simple geometry
- white / secondary gray by default
- pink for active or important states

Common motifs:
- brain
- rocket
- AI / spark
- microphone
- waveform
- GPU / chip
- automation flow
- code
- database
- checkmark
- lightbulb
- people / mentoring
- architecture / nodes

Avoid generic robot-head imagery.

---

## Visual Language

Use:
- subtle circuit / node diagrams
- flow charts
- code fragments
- handwritten sketch motifs
- notebooks / sticky-note references
- warm workspace photography
- glassmorphism only in small doses

Avoid:
- random stock photography
- glowing humanoid robots
- blue hologram clichés
- excessive 3D blobs
- sterile abstract SaaS gradients

---

## Illustration / Image Direction

When creating branded visuals, combine:
- dark technical background
- neon pink accents
- cozy engineering workspace
- warm face light
- subtle orange rim light
- books / notebook / handwritten diagrams
- laptop
- sticky notes
- bokeh
- engineering tools

Human portraits should feel:
- confident
- warm
- smart
- approachable
- real rather than over-polished

---

## Content Voice

The product should sound:
- intelligent
- warm
- conversational
- concise
- practical
- self-aware

It should NOT sound:
- corporate
- patronizing
- over-excited
- like AI marketing copy
- like a motivational poster

Good:
- "Try another approach"
- "This needs your decision"
- "Nothing here yet"
- "Build the first version"
- "See what changed"

Avoid:
- "Unlock the power of AI"
- "Revolutionize your workflow"
- "Supercharge your productivity"
- "Seamlessly transform"
- "Game-changing"

---

## Humor

Humor may be:
- self-ironic
- engineering-oriented
- lightly sarcastic
- based on overthinking, agents, tools, debugging, or productivity chaos

Do not force humor into critical workflows, errors, billing, or destructive actions.

---

## Motion

Use motion to communicate:
- state changes
- hierarchy
- progress
- cause and effect

Recommended:
- 120–180ms micro-interactions
- 180–240ms panel transitions
- subtle opacity / translate
- no bouncing UI
- no constant animated glow

Respect `prefers-reduced-motion`.

---

## Accessibility

Brand expression never overrides usability.

Requirements:
- WCAG AA contrast minimum for text
- visible keyboard focus
- keyboard accessible interactive controls
- minimum 44px touch targets on mobile
- never use color alone to communicate status
- error messages must be explicit
- reduced-motion support

---

## Responsive Rules

### Desktop
Use the full visual hierarchy and supporting context.

### Tablet
Reduce side decoration.
Collapse secondary panels before shrinking typography excessively.

### Mobile
Prioritize:
1. task
2. content
3. action
4. brand decoration

On mobile:
- remove most decorative circuit graphics
- keep pink to interactive emphasis
- avoid dense multi-column cards
- use one-column layout by default

---

## Claude Code Operating Rules

When implementing or redesigning UI:

1. Read this file and `design-tokens.json`.
2. Preserve product usability before visual decoration.
3. Reuse tokens instead of inventing new colors.
4. Reuse existing components instead of creating near-duplicates.
5. Use pink sparingly and intentionally.
6. Default to dark technical surfaces with warm, human copy.
7. Avoid generic SaaS blue as the main brand color.
8. Avoid "AI-looking" robot imagery.
9. Prefer one strong focal point per view.
10. If a screen feels too busy, reduce decoration before reducing personality.

### Hard DON'Ts
- Do not redesign the product into generic blue SaaS.
- Do not use gradients everywhere.
- Do not make every element glow.
- Do not use pink as a full-page background.
- Do not create "card soup".
- Do not add decorative elements that compete with content.
- Do not use random stock imagery.
- Do not use generic AI buzzword copy.
- Do not silently introduce new brand colors.

### Decision rule
When uncertain:

> **Reduce decoration, not personality.**
