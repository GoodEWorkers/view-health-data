---
name: Comment les données circulent dans un hôpital
description: An anatomy-style cutaway of a hospital floor where, on the software, data and network layers, each room's IT equipment lights up and thin coloured cables, one colour per service, run across the floor between the devices; on the software layer the eight computer screens rise from their monitors into floating skeleton windows linked by jack wires.
colors:
  paper: "#fbfbfa"
  face: "#ffffff"
  ink: "#18181a"
  ink-soft: "#57575a"
  ink-faint: "#8c8c90"
  rule: "#d4d4d6"
  page: "#f2f2ef"
  line-gam: "#096ead"
  line-rdv: "#e69f00"
  line-dpi: "#ca7aac"
  line-sgl: "#f4e846"
  line-pacs-ris: "#5bbbf1"
  line-pharmacie: "#009e73"
  line-bloc: "#d55e00"
  line-eai: "#4a4a4a"
  text-gam: "#0f4e77"
  text-rdv: "#604711"
  text-dpi: "#614056"
  text-sgl: "#4f4c25"
  text-pacs-ris: "#2f4f63"
  text-pharmacie: "#0d5643"
  text-bloc: "#753a0d"
  text-eai: "#484848"
  family-mllp: "#005191"
  family-dicom: "#e59500"
  family-https: "#209265"
  family-smtp: "#cc81b4"
  zone-workstations: "#a5b6cf"
  zone-servers: "#3b506c"
  zone-biomedical: "#78353c"
  zone-dmz: "#a42b10"
typography:
  device-label:
    fontFamily: "Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "7.5px (viewBox)"
    fontWeight: 700
    lineHeight: 1.15
  pill:
    fontFamily: "Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "7.5px (viewBox)"
    fontWeight: 600
    lineHeight: 1.2
    fontFeature: "tnum"
  plate-chrome:
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "10.5px"
    letterSpacing: "0.04em"
  screen-text:
    fontFamily: "Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "13.5px (416 x 256 logical window)"
    fontWeight: 400
    lineHeight: 1.25
  editor-text:
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "25px (416 x 256 logical window; 9.1 px on screen in the smallest window at 1440, 13.5 px in the largest)"
    fontWeight: 400
    lineHeight: "27px"
  wire-label:
    fontFamily: "Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "10px (CSS)"
    fontWeight: 600
    fontFeature: "tnum"
  header-title:
    fontFamily: "Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "1rem (0.875rem on phones)"
    fontWeight: 600
    lineHeight: 1.2
  header-sentence:
    fontFamily: "Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.25
  layer-tab:
    fontFamily: "Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
  inspector-code:
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.8125rem"
    lineHeight: 1.6
  inspector-text:
    fontFamily: "Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "0.6875rem, 0.78rem, 0.875rem, 1rem (code, label, value, summary)"
    fontWeight: 400
    fontFeature: "tnum"
rounded:
  pill: "1.5px (viewBox)"
  screen: "12px (logical)"
  glass: "5px (logical)"
  control: "0.35rem"
  control-group: "0.5rem"
spacing:
  header: "4rem (two rows below 1020 px)"
  control: "0.5rem"
  legend: "0.75rem 1.5rem 1rem"
components:
  pill:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.pill}"
    rounded: "{rounded.pill}"
    padding: "2.2px 3px (viewBox)"
  device-label:
    textColor: "{colors.ink}"
    typography: "{typography.device-label}"
  screen:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.screen-text}"
    rounded: "{rounded.screen}"
  wire-label:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.wire-label}"
    rounded: "2px (CSS)"
---

# Design system

## Overview

The software, data and network layers are not a second picture laid over the floor: they are the floor itself, read for its IT. The architectural model stays exactly as it is. What changes is the light: every device a hospital IT person would call "the system" (workstation screens, printers, the analyser, the CT gantry, the server racks) is lit as the subject of the drawing, and thin coloured cables run across the floor to link them, bundled and rounded like transit lines. A cable carries one flow and takes the colour of the service that sends it; the eight service colours of `departments.ts` are the only chroma. Colour is functional: a hue names a service, never decorates.

Thesis: nothing in the drawing is dimmed. Emphasis comes from lighting the devices and from the cables, and the cables lie on the floor, so furniture stands on them and a cable disappears under a desk and comes out the other side. The same drawing answers three questions with the same geometry and different text: which software (Logiciels), which data and format (Données), which transport and port (Réseau). Hovering a device or a cable is the signature interaction: its room lights and its packets ride its cables, and the side panel stays where it is until a click selects the room (see Interaction). The exception is the pair of layers that open the windows, Logiciels and Données: switching to either plays one sequence that lifts every screen out of the drawing and leaves them open (see Window sequence), and the floor cables, their packets and the device labels stay hidden, because the windows carry the software or the data and the jack wires carry the links.

Chosen and inferred, not interviewed (the brief pinned the form): Atkinson Hyperlegible Next as the single site face (public wayfinding legibility, slashed zero for HL7 codes such as `OML^O21` against `ORU^R01`); the plate keeps the kit's monospace chrome.

## Colors

- **Paper, face, ink**: the kit's light variables. Paper `#fbfbfa` is the plate and the pill ground, face `#ffffff` is the lit face of a device, ink `#18181a` is its lit edge (`--anatomy-strong`).
- **Cable colours**: one per sending service, read from `departments.ts` through `--room` on each cable. No hex lives in the figure code. On Réseau the same cables take the colour of their protocol family instead (`--family`, see Réseau).
- **Room palette**: the Okabe and Ito colour-blind-safe set, one colour per room, blue for the GAM, orange for the RDV, reddish purple for the DPI, yellow for the SGL, sky blue for the PACS/RIS, bluish green for the Pharmacie, vermillion for the Bloc and a dark grey for the server room. Four hexes moved by at most ΔE 2.7 (GAM, DPI, SGL, PACS/RIS) until the 28 pairs stay at ΔE76 18 or more in normal vision and under deuteranopia, protanopia and tritanopia (least distances 30.2, 18.3, 20.9 and 18.3; `content/palette.test.ts`, `content/network/cvd.ts`). The DPI hue also stays 30 degrees from the biomedical wine of Réseau.
- **Room text** is never the room colour itself: `departments.ts` derives a `textColour` per room, the colour mixed into ink in 1 percent steps until it reads at 4.5:1 on paper and on the 20 percent tint of its room, and its floor numeral keeps 3:1 against the floor; the numeral rule sets the darkness, so every text colour lands at 8.3:1 or more on paper and the test holds it at 4.5:1 on the tint of every room. It reaches the CSS as `--room-text`, set wherever `--room` is, and as `--text-<id>` for the three service colours of the syntax tokens. Pill and device-label text, panel headings, window and editor text, wire labels and floor numerals use it; dots, hairlines, bars, cables and glows keep `--room`. Yellow and sky blue are the colours that need it: yellow is 1.2:1 and sky blue 2.1:1 on paper.
- **Glow** is the room colour at 70 percent over 1.5px and 35 percent over 4px behind a device, rising by 30 points each for the active room's devices (`--glow`). It is a small halo, not a wash.
- Nothing lowers its opacity. The cable's glow stroke sits at 22 percent opacity because it is a halo; the active room's cables raise it, never lower the others.

## Typography

One face for the whole site, self-hosted through `@fontsource-variable/atkinson-hyperlegible-next`. Device labels and pills are SVG text at 7.5 viewBox pixels, so they scale with the drawing: 600 for pills with tabular figures, 700 for device labels, which also carry a paper halo so they stay legible over the floor. Plate corners, hints and readouts stay in the kit monospace; the plate title and hint follow the layer.

## Layout

- **One drawing.** Devices, cables, pills and labels share the floor's viewBox (800 by 458) and its single affine camera. Cables are built in world units (corner rounding, lane offsets) and projected afterwards, so a curve stays smooth. The drawing itself never zooms or pans; the floating screens are HTML laid over it.
- **Cables.** One per flow in `departments.ts`, 24 internal and 7 external, 0.4 world units above the floor. A cable follows the hops of its flow (see Réseau): the anchor monitor of its room, the room door, the cable trunking to the hub, then the bus of the server room. A cable never doubles back; a message for another room returns by a second leg.
- **Bundles.** Cables that overlap on a line share a bundle with a lane pitch of 1.4 world units, centred on the trunking. Within a bundle, strands are ordered by where they first part ways, so a strand keeps its side round corners and the bundle turns concentrically; the pitch shrinks only when a bundle would be wider than a door. Corners are rounded with a radius of 4 world units, wider on the outside of a turn and tighter on the inside.
- **Numerals.** The eight room numerals share one size, `NUMERAL_SIZE`, three quarters of the short side of the smallest room (computed from `ROOMS`), so every digit fits inside its walls; each is centred on the main plan of its room (the DPI's, not its bay) and lies on the floor right after the floors, under the ground marks, zone patches, trunking, walls and furniture. Furniture may cover part of a digit: legibility comes from the size and from the room text colour, which keeps the digit at 3:1 against its floor (multiplied over the floor at 60 percent opacity on a 16 percent tint, 80 percent on 42 when lit; yellow and sky blue included).
- **Anchors.** Each room has one anchor device, a screen-bearing workstation monitor listed in `devices.ts`; cables end under it and a later zoom lands on its screen face, whose four corners are exported.
- **Pills.** One per cable, on the middle of its longest straight leg, slid along the cable out of rooms and away from other labels. Each pill holds three texts, one per layer, and the stylesheet shows the active one. A pill has no text at rest on any layer: it fades in over 160 ms for the hovered cable, and for every cable of the selected room (a click, Enter on a room key, an arrow key), so keyboard visitors can read them. Below about 620 px of stage width, on a phone, pills stay hidden and the panel under the plate carries every interface.
- The legend row under the plate keeps the room keys on every layer: the room colour is the cable colour.

## Navigation

The layers, the glossary and the credit live in one slim bar across the whole page, above the two columns; the side panel keeps only the room content. Choices inferred, not interviewed.

- **Bar.** Paper ground, a 1 px `--anatomy-faint` rule under it, no shadow, 4 rem (64 px) high from 1020 px, padded 1 rem so the credit's right edge lines up with the panel's. Three cells: the title on the left, the layer control in the centre, the glossary button and the credit on the right. The page is a column (`Base.astro`, header slot then `main`): the two-column layout takes what the header leaves, so nothing hard-codes its height, and the stage is measured by its own box, which the header never enters.
- **Title.** The page `<h1>`, one line, 1 rem semibold (0.875 rem on phones). Under it, from 1280 px, the active layer's one-sentence overview from `layers.ts` in `--anatomy-text` at 0.8 rem, balanced on at most two lines, a two-line height reserved so switching never moves the bar. It is `aria-live="polite"`, swaps text with a 160 ms fade (none under reduced motion) and below 1280 px stays in the panel's empty state instead (it needs 420 px to fit in two lines). The centre column never leaves the page centre until the left cell would drop under that width.
- **Layer control.** `role="tablist"`: a 1 px hairline track with 3 px padding and 0.5 rem radius around four tabs of 30 px (0.35 rem radius, 0.8125 rem, 500). Each tab holds a drawn 16 px icon in the same 1.5 px round stroke and its label: a floor plan for Salles, a window for Logiciels, a document for Données, three linked nodes for Réseau. Resting tabs read in `--anatomy-text` (7:1, the old tabs used the 3.2:1 muted grey), hover tints 6 percent of ink, the selected tab is filled ink with paper text, focus is the 2 px ink ring one pixel off the tab. Keys 1 to 4, Left and Right, the URL hash and the ids are unchanged (`layerSwitch.ts` owns the state).
- **Key hint.** While the pointer is on the control, or a tab has keyboard focus, the four icons crossfade (120 ms) to `<kbd>` chips 1 to 4 in the same 16 px slot, so the hint shows which key goes with which tab without a second row or any layout shift. It never shows on touch.
- **Glossary button.** A chip in the chip vocabulary (1 px `--anatomy-mid` border, 0.35 rem radius, paper face) with a drawn open-book icon; the label « Glossaire » shows from 1200 px and the button is icon-only below, always with an `aria-label`, `aria-haspopup="dialog"` and `aria-keyshortcuts="g"`. It opens the Glossaire view over the stage on any layer, like the key `g` (ignored while typing); the Réseau panel's « Glossaire » button opens the same view. Changing layer closes it.
- **Glossary view.** The existing fullscreen frame and motion (the stage centre, 450 ms, a 200 ms fade under reduced motion), closed by Escape, ×, the scrim or a layer change; opening it closes an open inspector, and Escape or × returns focus to the button. One search field, focused and emptied on every open; « 99 termes » under it becomes « 12 termes sur 99 » while filtering. A query matches when every word appears in the term, its expansion or the definition, without case or accents. Entries are alphabetical (French collation), the acronym's expansion beside the term in `--anatomy-text`, then one plain-French sentence from the hospital's side and a Source link when a standard or an agency page backs it. On phones the stage grows to 34 rem (the viewport minus 8 rem at most) while a Réseau view or the glossary is open so a list has room, and the summary is dropped under 32 rem of panel width.
- **Credit.** `Credit.astro` in the right cell: the Good eWorkers logo at 96 px on `#111111` (the brand's dark-ground pattern, never recoloured; 96 px is below the brand's 110 px minimum, by request) with « Créé par Richard Raduly » over « pour Good eWorkers » at 0.72 rem in `#e0e0e0` (14.3:1) from 1100 px, the logo alone below, the link's `aria-label` always carrying the full sentence; a 0.5 rem radius, no shadow, 2 px ink focus ring.
- **Narrow.** From 1020 px down the bar is two rows: the title beside the glossary and the credit, then the control. Phones (720 px and below) keep that, with the control full width, scrolling sideways without a scrollbar and centring the selected tab, the title on at most three balanced lines, and a 44 px touch size. The bar scrolls away with the page; the stacked layout below it is unchanged.
- **Fullscreen views.** The inspector, the flow sheet, the rule table, the partners and the glossary stay absolutely positioned inside the stage: they cover the stage and never the bar.

## Interaction

Hover shows, a click decides. Two states, owned by `live.ts` through the pure transitions of `selection.ts` (tested, including that hover never changes the selection):

- **Highlight**: the room lit on the map with the existing glow, named in the plate's readout and, with a mouse, in a tooltip. It comes from the pointer over a room floor, device, gear, window, cable, wire or legend key; from keyboard focus on a legend key; or from the idle tour. It never touches the side panel. The tooltip is a paper card with an offset and blurred shadow, the room (« 3 · DPI · Dossier patient / Poste de soins ») over « Cliquer pour les détails », set 16 px right of and below the pointer (flipped at the viewport edges) and following it with a 70 ms exponential lag; it is never shown for touch, below 720 px or for keyboard focus, and under reduced motion it sits on the pointer with no lag. The cursor is `pointer` over everything selectable.
- **Selection**: set by a click on a room floor, device, gear, window, wire, cable or legend key, by Enter or Space on a focused key, by the arrow keys (the selection moves, from nothing: Right selects the first room, Left the last) and by Home and End. It loads the side panel through a 200 ms fade (100 ms out, 100 ms in, none under reduced motion) and scrolls it to the top. The selected room keeps a 2.4 px outline in its text colour over a 5 px paper halo, laid on the floor footprint after the walls and before the standing furniture; its window keeps the full ring; its legend key is `aria-pressed` and inked; the panel head shows « Salle sélectionnée » with a « × Désélectionner » button. Escape does the same when nothing else is open (an overlay or a focused window takes the key first); clicking a room again keeps it selected; closing an overlay keeps it.
- **Idle tour**: highlights the eight rooms in turn (2.8 s each) only while nothing is selected, the pointer is off the figure, no keyboard focus is inside it, the figure is on screen and motion is not reduced. The first selection stops it; deselecting restarts it from a fresh dwell once the pointer is away.
- **Empty state**: with nothing selected the panel shows the page purpose in two short paragraphs, the one-sentence overview of the active layer (`layers.ts`, shown here only below 1280 px; the header carries it above), « Cliquez une salle pour la découvrir » and the eight rooms as buttons (colour dot, number, acronym, room name) that select. The layer control in the header keeps working and keeps the selection.
- **Flow focus**: on every layer a highlighted room fades every cable, jack wire, packet and gate glyph that is neither from nor to it to 15 percent over 200 ms (the EAI counts as the destination of every flow into it, an external cable belongs to its source room), and a selection hides the unrelated ones completely over 240 ms with pointer events off while the room pointed at meanwhile brings its own flows back at 50 percent; the idle tour never filters, nothing fades under reduced motion, and windows, devices, gear, floors and numerals are never filtered. `live.ts` writes `data-focus-room` and `data-selected-room` on `.layout`, and `flowFocusCss.ts` generates the per-room selectors that `flowFocus.css` turns into opacity.

| Event | Highlighted | Selected | Tour running |
|---|---|---|---|
| Pointer over a room | that room | unchanged | no |
| Pointer over an empty part of the figure | the selected room, else none | unchanged | no |
| Pointer leaves the figure | the selected room, else the tour room | unchanged | if nothing selected |
| Keyboard focus on a legend key | that room (a hovered room wins) | unchanged | no |
| Focus leaves the figure | the selected room, else the tour room | unchanged | if nothing selected and the pointer is away |
| Click, Enter or Space on a room | that room | that room | no |
| Arrow, Home, End | the new selection | next, first or last room | no |
| Escape or × with nothing open | the hovered room, else the tour room | none | if the pointer is away |
| Tour tick | next room | unchanged | unchanged (only while running) |

The side panel is a column: the selection bar while a room is selected, the one scrolling area (overview or room), and on Réseau the trace strip. Chips, keys and buttons share one vocabulary: 1 px `--anatomy-mid` border, 0.35 rem radius, paper face, ink border and a 14 to 16 percent room tint on hover, ink fill when selected, a 2 px ink focus ring.

## Elevation & Depth

Nothing is raised over the model. The only depth is the kit's own: solids with four tones, cables on the floor under the furniture, and the soft glow behind a lit device.

**Switching** is one custom property, `--device-light`, registered as a number and eased for 320 ms with the kit's exponential ease-out: 0 on Salles (devices as drawn, cables and labels at opacity 0, pointer events off), 1 on any other layer, and no transition under reduced motion. A second one, `--cable-show`, is 0 on Logiciels and Données (it jumps, so no ghost cables show while `--device-light` rises) and fades back to 1 in 320 ms on Salles and Réseau. The floor itself is never hidden or faded.

**Floating screens** are the one thing raised over the model, on Logiciels and Données only, and they carry the layer's only shadows: a soft shadow under each window (a blurred ink rectangle offset down and growing with its progress, up to 16 px down and a 10 px blur in logical units) that sells the levitation.

## Shapes

Round everything a cable touches: round caps and joins, circular arcs at every corner, pill labels at 1.5 viewBox pixels. Devices keep the kit's bevels.

## Components

- **Device**: a part flagged `device` in `parts.ts`, wrapped in `<g data-device>`. On a software, data or network layer its edges take the lit ink, its top face lightens as in the kit's `lit` tone, and a colour glow rises behind it.
- **Anchor device**: the room's workstation monitor, wrapped in `<g data-device data-anchor>` and carrying a `data-screen` path on its screen face.
- **Cable**: a `<g data-cable data-from data-to>` with two round strokes in the service colour: a glow stroke 2.6 viewBox pixels wide at 22 percent opacity under a core stroke 0.9 wide. Hovering it lights its source room.
- **Pill**: paper rectangle with a hairline in the room colour and one row of text: Logiciels writes the message type then the transport; Données the payload then its format family (HL7 v2, DICOM, CDA, FHIR); Réseau the name of the protocol family then its port, and for an external flow the way out and the partner (« HTTPS · 443 · proxy → DMP »).
- **Device label**: beside the anchor monitor; Logiciels shows the first software product (a market example, vendor dropped), Données the first two data entities, Réseau the first network zone. All come from `departments.ts` through `layerLabels.ts`.
- **Packet**: a bead of the service colour with a paper ring, riding the cables of the active room on the shared packet timing; absent under reduced motion, at most 48 at once.
- **Credit badge**: `Credit.astro`, the right end of the header (see Navigation), so it shows on every layer and state. A `#111111` pill (0.5 rem radius, no shadow) holding the Good eWorkers logo vendored unaltered at 96 px (the brand's own dark-ground pattern, never recoloured) and « Créé par Richard Raduly / pour Good eWorkers » on two lines at 0.72 rem in `#e0e0e0` (14.3:1), the whole badge a link to goodeworkers.org with the 2 px ink focus ring; logo only below 1100 px; no heading, no accent.
- **Legend key**: a button with a dot in the room colour and the room name; hovering it highlights its room, a click or Enter selects it (`aria-pressed`, drawn in ink like the selected layer tab).
- **Window sequence**: one timeline of 2.0 s, all constants in `sequence.ts` and tested. Entering Logiciels or Données from another layer plays it forward, leaving both runs the same clock back in 600 ms (windows down, wires undrawn, glow off), and returning replays it. Going between Logiciels and Données keeps the windows open and changes only what they show. Under reduced motion the clock is compressed to a 200 ms fade, with no draw, no lift and no glow wave.
  1. **0 to 0.5 s, glow wave.** The eight anchor computers rise to full glow (`--wave`, which feeds the same `--emphasis` as the active room's glow plus a 7 px bloom), 40 ms apart by distance from the DPI. Nothing else in the floor changes.
  2. **0.4 to 1.3 s, wires draw.** Each jack wire draws itself from its source plug to its target plug in 500 ms (a dash offset on a path of length 1), the 24 starts spread so the last ends at 1.3 s. Their ends sit on the sockets of the still-lowered monitors' small screen faces and hang as a slack chord; they keep following the windows as these rise and settle into their lanes. The source plug shows when the wire starts, the target plug when it arrives.
  3. **0.9 to 2.0 s, windows open.** The eight windows lift, rotate and zoom, 70 ms apart by distance from the DPI, each taking what is left of the span (610 ms), and stay open. Clicking a computer, a window or the floor selects its room; Escape closes an open overlay or a focused window first and deselects only when none is open.
  4. **On Données, after the opening (at once from Logiciels): loading, then the editor.** Each window shows « Chargement… » in its brand-less title bar with a thin progress bar under it and its skeleton dimmed to 30 percent, for 500 ms, 40 ms apart by distance from the DPI (all done 780 ms after the opening). It then crossfades in 240 ms to its file. Back on Logiciels the content crossfades back to the skeleton with no loading. Under reduced motion the bar stays full and the editor appears after the same 500 ms, with no crossfade.
- **Floating screen**: an HTML window, 416 by 256 logical pixels (the monitor's 1.625 aspect), with `transform-origin: 0 0` and a `matrix3d` that maps its box onto the current quad. One eased progress per window (the kit's ease-out) mixes the four corners from the projected monitor face to a frontal rectangle, which reads as lift, rotate and zoom. The rectangle is the largest one of the monitor's aspect inside the room's projected plan rectangle, inset by 4 viewBox pixels and, in the left column where rooms touch, by a gutter for plugs and wire lanes; it floats up by up to 6 viewBox pixels where the room has height to spare.
- **Skeleton window**: an ink bezel (12 logical px radius) around a paper glass, a title bar in 16 percent of the room colour with the product name from `softwareExamples[0]` and the system acronym, and a body of real labels, fields and tables filled with synthetic data from `screenMocks.ts`: GAM identity and admission, RDV week agenda, DPI record with tabs, SGL results with units and flags, PACS/RIS worklist and an image placeholder with a crosshair, Pharmacie prescription with an interaction alert, Bloc planning by room and hour, EAI message monitor. The room colour appears only in the title bar, the chips and the active row. Text is 12 to 13.5 logical pixels, so it scales with the window: legible on a large screen, texture on the smallest windows at 1440 px.
- **Editor view**: the content of a window on Données, a file about the same synthetic patient (Martin DURAND, born 14/06/1958, venue 25-004821, bed 214-B, Dr ROUX), one per service, built by pure generators in `src/content/messages/` from `screenMocks.ts`, shown as an **excerpt**. No brand: the title bar's product name and acronym are hidden on this layer (the bar only carries the loading state) and the editor covers the whole glass. The chrome is a 20 px tab strip with the file name, a format badge in 14 percent of the room colour and the service dot and acronym at the right. Under it a 16 px hint row, then 7 rows of 23 columns in the site's mono stack at 25 logical px on a 27 px line, with a 38 px gutter of true line numbers. At 1440 px that is 9.05 px on screen in the smallest window (EAI), 9.5 px in SGL and Pharmacie, 11.6 px in the DPI, 13.1 px in PACS/RIS and Bloc and 13.5 px in GAM and RDV. Thirty-four columns would need 6.9 px in the smallest window, so 23 is what 9 px allows. `excerptOf(file, focus)` takes a named range, soft-wraps the file to 23 columns (HL7 before a field separator or after a space, XML before a tag or an attribute, JSON at spaces and after a dot, DICOM before the value and the comment; continuation rows indented by two and unnumbered), dedents the non-HL7 formats to the range, shows the range from its first row, fills spare rows with the neighbouring lines and folds the rest into IDE markers (« ⋯ 3 segments repliés », « ⋯ 12 lignes repliées »). A range taller than the window shows its first rows and folds the remainder.
- **Highlighted range**: each file declares named ranges (`messages/ranges.ts`) and one main range, highlighted at rest like an IDE's current line: a full-width tint of 14 percent of the room colour over its rows, a 5 logical px bar in the room colour in the gutter, and the range label as a hint right-aligned above the code in small caps in the room colour (18 characters at most). Hovering a wire lights the range its flow names in the source window and, where the destination declares that payload as received, the matching range there too; the excerpt re-folds to show it and crossfades in 160 ms, and returns to the main ranges when the pointer leaves. The 24 flows are keyed `from→payload` in `FLOW_RANGE_KEYS`, defaulting to the source's main range.
- **Focus**: clicking a window on Logiciels grows it 1.6 times about its centre, slides it just enough to stay inside the stage (8 px margin), raises it above its neighbours and deepens its shadow (up to twice the offset and blur); its wires relax to slack chords. Clicking it again, Escape, clicking another window or the floor shrinks it. It follows one eased progress over 350 ms, reversible mid-flight; under reduced motion it jumps. On Données the same click opens the Inspector instead, and entering Données clears any focus.
- **Inspector**: on Données, a click on a window (or Enter on the room selected with the arrow keys) opens the full file of that service over the whole stage. The panel is laid out at the stage size minus a 16 px margin and projected by the same `matrix3d` as the windows, on one eased progress over 450 ms from the window's own quad to the stage rectangle (`screens/inspect.ts`); the window hands over to the panel on the first 35 percent of the linear level, the other windows and the wires fade to 0 over the first half, and a paper scrim at 78 percent dims the floor. Under reduced motion nothing moves: the panel fades in 200 ms at its final place. Escape, the × button, a click on the scrim, or leaving Données closes it by the reverse motion; Left and Right (or the two « Fichier précédent / suivant » buttons) switch to the previous or next room's file without closing, wrapping around, and select that room so the side panel follows. `screensLive.ts` stays the owner of window states and talks to the inspector through events (`inspector/inspectorChannel.ts`).
  - **Layout**: a header (file name in mono, format badge, service dot, acronym and room, one plain-French sentence about the file from `content/decode/summaries.ts`, the two navigation buttons and ×), the two panes, a detail strip and a footer. From 1024 px the panes sit side by side (Brut 1.08, Lisible 1); below, one pane and a « Brut / Lisible » toggle (Lisible first). Below 46 rem of panel width the navigation buttons keep only their chevrons.
  - **Brut**: the whole file, nothing folded, with true line numbers, a gutter tag per segment or block (« En-tête », « Patient », « Venue », « Mouvement », « Résultat »…), the token colours of `editor.css` (every token at least 4.5:1 on white and on the 14 percent tint) and soft wrapping with a hanging indent of two columns, breaking after `|` and `~` first, which keeps the existing continuation style without numbering the continuation rows. Each segment id, field, DICOM tag line, CDA attribute or text and FHIR key with its value is a unit with a `data-ref`.
  - **Lisible**: one card per segment or block (title, optional subtitle such as « Hémoglobine · 11,2 g/dL · bas », raw code at the right) listing label, value and the raw reference in 11 px mono under the label; long CDA and FHIR paths are shortened to their last parts. FHIR rows are grouped under the first key below the resource. Values come from `content/decode/`: dates in French, codes expanded with their raw code in parentheses, INS grouped, repetitions on their own lines.
  - **Linking**: hovering or focusing a unit, a row or a gutter in either pane lights its counterpart through the shared ref: a tint of 14 percent of the room colour, a 1.5 px underline under a field and the 4 px gutter bar on its line. Clicking pins it (pinned adds a 1 px ring and `aria-pressed`) and scrolls the other pane to it; clicking the pinned unit again returns to the file's main range, which is selected on open (whole blocks when the range covers them, only the rows inside it otherwise). Rows are tab stops (Up and Down move between them, Enter or Space pins).
  - **Detail strip**: the label, the raw reference, the raw text and a plain-French sentence for the hovered, else the pinned, field; it is how the dictionary teaches what a field is for.
  - **Footer**: a legend of the token colours of this file's format (« segment », « champ », « date », « séparateur »; « élément », « attribut », « valeur » for CDA; « clé », « nombre » for FHIR; « balise », « type », « nom » for DICOM) and the flows the file travels on, read from `departments.ts` (« Envoyé au DPI et à l'EAI · HL7 v2 · MLLP »).
  - **Choices inferred**: no gradient text, no kicker, no coloured border on cards (the card ring and tint carry selection); the only coloured bars are the 4 px editor gutter bar of the brief and the 2 px underline of the Brut / Lisible toggle; depth is offset and blurred shadows on the panel and the kit's lift on cards; secondary text uses `--anatomy-text` (7:1), never `--anatomy-muted` (3.2:1); the two chevrons and × are drawn SVG, not glyphs.
- **Syntax colours**: one tokenizer per format in `syntax.ts` emits `data-token` spans; `editor.css` colours them from the room text colour and the text colours of three services (`--text-pharmacie`, `--text-rdv`, `--text-dpi`), every token at least 4.5:1 on the editor's white and on the 14 percent tint of any room (lowest 6.9:1, tested). Segment, tag and key take the room text colour in bold; separators and comments (italic) are the quiet ink; text is ink.
- **Jack wire**: one per flow (24), from a socket ring on the source window's bottom bezel to a socket ring on the target's top bezel, sockets spaced along the bezel by where the other end sits. A chain of cubic Béziers (a clamped B-spline over lane waypoints found at build time by an A* router through the gutters between windows, side by side on parallel lanes, with a gentle sag on long level runs): a 1.2 px core in the room colour over a 3.5 px glow at 25 percent, round caps, under the windows so a wire never draws across a window face. Endpoints and plugs follow the windows every frame; the route blends in from a straight chord during the second half of the rise and the wire fades in over the same half. Hovering a wire thickens it, lights the source room and the bezel rings of its two windows; nothing else dims. The label carries one text per layer, so on Données a hovered wire reads payload and format. The plate hint on Logiciels and Données reads « Cliquez une fenêtre, survolez un fil ». A click on a wire selects its source room.
- **Jack plug**: a metal tip entering the socket ring, an insulating ring in the room colour, an ink body and a strain relief, 25 logical px long, scaled with its window and turned to the bezel's outward direction.
- **Wire label**: a paper pill with a 0.75 px hairline in the room colour and the message type then the transport, above the windows, on the visible part of the wire. Shown only for the hovered wire and for the wires of the selected room.

## Réseau

The network engineer's reading of the same floor. Entering the layer plays one 2.0 s sequence on the clock of the window sequence (600 ms back, a 200 ms fade under reduced motion); the windows stay closed. All constants are in `network/networkSequence.ts`.

- **Sequence.** 0 to 0.9 s zones: the room tints fade to the faint outline (first half), the zone fills rise (second half). 0.3 to 1.1 s a halo pulse runs over the gear from the firewall outwards. 0.7 to 2.0 s the 31 cables draw themselves, 0.6 s each, following their own dash pattern; a cable's firewall gate closes in the last fifth of its draw. Under reduced motion cables and zones only fade.
- **Zones replace room colours.** Four fills that stay apart without hue: the share of the zone colour in the floor grows from workstations (22 percent, the lightest) to servers (45), biomedical (67) and DMZ (79, the darkest), and the biomedical patches carry a 45 degree hatch, the DMZ patch a dot grid, drawn as SVG `<pattern>` fills laid on the floor by the camera. Room numerals stay. The legend row swaps to the four zones and four families in a 320 ms crossfade, swatches carrying the same tint and pattern.
- **Gear.** Drawn on every layer as architectural parts, each resting on something: a wall switch per room (a box with ears, a port row, LEDs and a gland over a riser conduit), and in the server room a core rack with a 1U unit, a free-standing firewall box on a plinth with a status LED row, a DMZ rack on its patch, a WAN router on feet; outside the left wall a telecom box on a plinth at the baseboard edge, joined by a fibre tray and two covers through the wall. On Réseau gear glows in its zone colour; the firewall glows stronger while a cable that crosses it is hovered.
- **Bus.** In the server room the trunking continues as one straight line, `BUS_Y`: door, core rack, gate, firewall, EAI branch (north to the foot of the EAI rack), DMZ rack, router, wall, tray, telecom box. A flow's hops map to its drawn path in `cableRoutes.ts`: device (the anchor, or the scanner for the biomedical flow), its room switch when the hops have one (the scanner route runs along the wall under it), the trunking to the hub, the bus to the end station; a message for another room returns on a second leg from that station. An external flow runs straight on to the telecom box.
- **Cables by family.** Colour from `PROTOCOL_FAMILIES` with a dash pattern of its own: HL7 v2 solid, DICOM dashed (6 3), HTTPS dotted (1.5 3), SMTP dash-dot (6 3 1.5 3), in the cable, the legend swatch and the hover label, which always starts with the family name. The glow stays solid. A small gate straddles each cable at the firewall.
- **Trace.** Hovering a cable raises its strokes, walks one packet along it in 1.6 s hop by hop (it dwells 100 ms at each station, then rests 350 ms and repeats) and lights the hop in the strip at the bottom of the side panel, only while the pointer is on the map (or a flow button has keyboard focus). The strip is outside the scrolling area and has a fixed height (15 rem on wide screens, in flow at the end of the panel on phones), so hovering never scrolls or reflows the panel; with no cable hovered it holds a one-line hint.
- **Views.** Click a cable, the firewall or the telecom box, or use the panel buttons: fullscreen over the stage on the inspector's frame and motion (450 ms from the clicked thing, 200 ms fade under reduced motion). Fiche de flux in two columns (stack table, rule card, stepper with zone dots; capture with the MLLP bytes, DICOM PDU header, TLS ClientHello or ESP packets highlighted), Table de règles (deny rows tinted at 8 percent and marked by a « Refus » chip with a filled square, the last hovered flow's rule outlined), Partenaires (one card each, flows per room). The Glossaire is global and opens from the header on any layer (see Navigation). Left and Right step through the flows of a room.
- **Colour-blind safe.** Family colours start from the Okabe and Ito set and were adjusted until every pair stays at ΔE76 20 or more under deuteranopia, protanopia and tritanopia (`content/network/cvd.ts`, tested); zone fills pass the same test. No distinction rests on colour alone: dash patterns, hatch and dots, lightness order, the family name in every label, zone names next to every dot, the « Refus » chip.
- **Choices inferred.** The biomedical hex moved from teal to a muted wine so a patch never reads as the Bloc colour; the Okabe and Ito blue, green and purple were darkened or lightened by up to ΔE 12 to pass the pair test; hovering a cable in a dense bundle picks the topmost strand, so the panel buttons reach every flow.

## Do's and Don'ts

- Do keep one colour per service across the floor, the cables and the panel.
- Do give every acronym a visitor can read a glossary entry: `content/glossaryCoverage.test.ts` fails on visitor-facing text with an acronym the glossary does not define.
- Do keep wire and cable text hidden until a wire is hovered or its room is selected; a keyboard visitor must be able to select a room and read its labels.
- Do keep hover to the map: it highlights and never changes the side panel, which only a click, a key or the room chips change.
- Do give every clickable thing a pointer cursor and a visible button look or a tooltip: legend keys and room chips are bordered buttons, rooms, devices, gear, windows, wires and cables show the pointer and the tooltip « Cliquer pour les détails ».
- Do keep wires under the windows and in the gutters between them.
- Do keep cables on the floor and below the furniture, so they read as laid cables.
- Do keep bundles on whole lanes and corners concentric.
- Don't add hex values to the figure code; add a service colour in `departments.ts`.
- Don't mix a room colour into ink for text: use `--room-text`. Don't pick a room colour by hue alone: two rooms must stay ΔE76 18 apart under the three simulations.
- Don't dim anything by opacity: the floor, the numerals and the furniture stay as drawn on every layer. Only the cables, packets and labels stay hidden, and only on Logiciels and Données.
- Don't put real patient data in a skeleton window: every name, INS number, date and value is invented (CLAUDE.md, section 11).
- Don't use a second typeface, a gradient, or a coloured side border above 1px.
- Don't let colour be the only cue on Réseau: pair it with a dash, a pattern, a lightness step or a name.
- Don't add zoom, pan or wheel handling to the drawing; the windows rise by themselves when the Logiciels layer opens, never on a wheel or a drag.
- Don't show real patient data in an editor view either: the INS has month 99, every name is invented, the document payload is a placeholder.
- Don't fold, truncate or rewrite anything in the Inspector's Brut pane: the windows show excerpts, the inspector shows the file.
- Don't open the Inspector on Logiciels: its windows keep the 1.6 times focus.
