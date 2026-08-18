# FedHealth DESIGN.md

## Visual Theme And Atmosphere

FedHealth is a clinical operations dashboard for a federated learning demo. It should feel precise, calm, premium, and trustworthy: more executive medical command center than gaming HUD. The interface is dark because it is intended for projected demos, but the dark treatment must stay restrained. Avoid neon halos, decorative bokeh, purple gradients, excessive glow, and fake sci-fi ornament.

The product language is compact and data-dense. Every panel should earn its space by showing useful status, metrics, or system state. Empty space is used for hierarchy and readability, not decoration.

## Color Palette And Roles

- `bg`: `#090D12` for the app background.
- `surface`: `#121821` for primary panels.
- `surface-raised`: `#151C26` for cards and nested operational surfaces.
- `line`: `#263040` for panel borders and chart axes.
- `text`: `#EEF2F7` for primary text.
- `muted`: `#94A0B2` for labels and secondary metadata.
- `accent`: `#7AA7FF` for model accuracy and active training.
- `success`: `#38D996` for connected, received, and privacy-safe states.
- `warning`: `#F6C86A` for elevated risk states.
- `danger`: `#F87171` for offline, failure, and DP-off states.

Use color sparingly. Prefer neutral borders and elevation. Colored surfaces should be low-opacity and reserved for semantic state.

## Typography Rules

- Primary UI font: `Plus Jakarta Sans`, then `Aptos`, then `Segoe UI Variable`, then `Segoe UI`, then `Arial`, then generic sans-serif.
- Monospace font: `JetBrains Mono`, then `Cascadia Mono`, then `IBM Plex Mono`, then platform monospace.
- Minimum functional label size: `11px`.
- Panel titles: uppercase, 13px, medium-wide tracking.
- Metric values: 24-36px depending on available space, tabular numerals.
- Body and metadata should favor clarity over stylized microtype.

## Component Styling

- Panels use 12px radius, 1px neutral border, and neutral elevation only.
- Do not use colored glow box shadows. If emphasis is needed, use color, weight, or a small status fill.
- The slim blue line beneath the header is an intentional brand motion detail. Keep it restrained, 1px tall, and limited to the header divider.
- Accuracy chart should show one local reference line: the best local baseline.
- Privacy budget uses segmented bars with stable height.
- Patient image receipt counter should be prominent, green, and close to the throughput metrics without creating wasted vertical space.

## Layout Principles

- Dashboard layout is dense but not cramped.
- Right-column cards must not overlap or create large dead zones.
- Related metrics stay visually grouped: round, bytes, updates, payload, then received-images counter.
- Charts should use the available panel width and a balanced height. Avoid extreme shallow aspect ratios that flatten data.

## Depth And Elevation

Use neutral shadows only:

- Primary elevation: `0 18px 50px -36px rgba(0, 0, 0, 0.92)`.
- Inset highlight: `inset 0 1px 0 rgba(255, 255, 255, 0.06)`.

Avoid chromatic glow, text glow, and blurred colored shadows.

## Do And Don't

Do:

- Keep the chart legible from a projector.
- Keep metric labels at 11px or larger.
- Use semantic color only where it carries state.
- Use one best-baseline chart reference instead of several close overlapping lines.

Don't:

- Add emoji icons.
- Add decorative shimmer or infinite marquee motion.
- Use purple gradients, colored halos, or fake glass overload.
- Use three overlapping baseline lines around `0.68`.
- Let the patient counter float far away from throughput metrics.

## Responsive Behavior

- Preserve the two-column dashboard on projector and desktop widths.
- At narrower widths, panels may stack, but metric groups must keep labels and values readable.
- No horizontal scrolling.
- No text below 11px except nonfunctional legal fine print, which this app does not use.

## Agent Prompt Guide

Before editing UI, read this file and treat it as the visual source of truth. Prefer smaller focused corrections over broad restyles. Run `npx impeccable detect ui-server` after UI edits when npm access is available, and fix real findings instead of suppressing them.
