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
  line-gam: "#0284c7"
  line-rdv: "#ea7f12"
  line-dpi: "#a21caf"
  line-sgl: "#ca9a04"
  line-pacs-ris: "#4f46e5"
  line-pharmacie: "#16a34a"
  line-bloc: "#0d9488"
  line-eai: "#64748b"
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

Thesis: nothing in the drawing is dimmed. Emphasis comes from lighting the devices and from the cables, and the cables lie on the floor, so furniture stands on them and a cable disappears under a desk and comes out the other side. The same drawing answers three questions with the same geometry and different text: which software (Logiciels), which data and format (Données), which transport and port (Réseau). Hovering a device or a cable is the signature interaction: its room lights, its packets ride its cables, the side panel follows. The exception is the pair of layers that open the windows, Logiciels and Données: switching to either plays one sequence that lifts every screen out of the drawing and leaves them open (see Window sequence), and the floor cables, their packets and the device labels stay hidden, because the windows carry the software or the data and the jack wires carry the links.

Chosen and inferred, not interviewed (the brief pinned the form): Atkinson Hyperlegible Next as the single site face (public wayfinding legibility, slashed zero for HL7 codes such as `OML^O21` against `ORU^R01`); the plate keeps the kit's monospace chrome.

## Colors

- **Paper, face, ink**: the kit's light variables. Paper `#fbfbfa` is the plate and the pill ground, face `#ffffff` is the lit face of a device, ink `#18181a` is its lit edge (`--anatomy-strong`).
- **Cable colours**: one per sending service, read from `departments.ts` through `--room` on each cable. No hex lives in the figure code. On Réseau the same cables take the colour of their protocol family instead (`--family`, see Réseau).
- **Pill and device-label text** is the room colour mixed 65 percent into ink (`--pill-ink-share`), which keeps the text legible on paper.
- **Glow** is the room colour at 70 percent over 1.5px and 35 percent over 4px behind a device, rising by 30 points each for the active room's devices (`--glow`). It is a small halo, not a wash.
- Nothing lowers its opacity. The cable's glow stroke sits at 22 percent opacity because it is a halo; the active room's cables raise it, never lower the others.

## Typography

One face for the whole site, self-hosted through `@fontsource-variable/atkinson-hyperlegible-next`. Device labels and pills are SVG text at 7.5 viewBox pixels, so they scale with the drawing: 600 for pills with tabular figures, 700 for device labels, which also carry a paper halo so they stay legible over the floor. Plate corners, hints and readouts stay in the kit monospace; the plate title and hint follow the layer.

## Layout

- **One drawing.** Devices, cables, pills and labels share the floor's viewBox (800 by 458) and its single affine camera. Cables are built in world units (corner rounding, lane offsets) and projected afterwards, so a curve stays smooth. The drawing itself never zooms or pans; the floating screens are HTML laid over it.
- **Cables.** One per flow in `departments.ts`, 24 internal and 7 external, 0.4 world units above the floor. A cable follows the hops of its flow (see Réseau): the anchor monitor of its room, the room door, the cable trunking to the hub, then the bus of the server room. A cable never doubles back; a message for another room returns by a second leg.
- **Bundles.** Cables that overlap on a line share a bundle with a lane pitch of 1.4 world units, centred on the trunking. Within a bundle, strands are ordered by where they first part ways, so a strand keeps its side round corners and the bundle turns concentrically; the pitch shrinks only when a bundle would be wider than a door. Corners are rounded with a radius of 4 world units, wider on the outside of a turn and tighter on the inside.
- **Numerals.** The eight room numerals share one size, `NUMERAL_SIZE`, three quarters of the short side of the smallest room (computed from `ROOMS`), so every digit fits inside its walls; each is centred on the main plan of its room (the DPI's, not its bay) and lies on the floor right after the floors, under the ground marks, zone patches, trunking, walls and furniture. Furniture may cover part of a digit: legibility comes from the size and the room tint.
- **Anchors.** Each room has one anchor device, a screen-bearing workstation monitor listed in `devices.ts`; cables end under it and a later zoom lands on its screen face, whose four corners are exported.
- **Pills.** One per cable, on the middle of its longest straight leg, slid along the cable out of rooms and away from other labels. Each pill holds three texts, one per layer, and the stylesheet shows the active one. A pill has no text at rest on any layer: it fades in over 160 ms for the hovered cable, and for every cable of a room pinned on purpose (arrow keys, a focused room key, a click on a screen), so keyboard visitors can read them. Below about 620 px of stage width, on a phone, pills stay hidden and the panel under the plate carries every interface.
- The legend row under the plate keeps the room keys on every layer: the room colour is the cable colour.

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
- **Legend key**: a dot in the room colour with the room name; hovering a key pins its room.
- **Window sequence**: one timeline of 2.0 s, all constants in `sequence.ts` and tested. Entering Logiciels or Données from another layer plays it forward, leaving both runs the same clock back in 600 ms (windows down, wires undrawn, glow off), and returning replays it. Going between Logiciels and Données keeps the windows open and changes only what they show. Under reduced motion the clock is compressed to a 200 ms fade, with no draw, no lift and no glow wave.
  1. **0 to 0.5 s, glow wave.** The eight anchor computers rise to full glow (`--wave`, which feeds the same `--emphasis` as the active room's glow plus a 7 px bloom), 40 ms apart by distance from the DPI. Nothing else in the floor changes.
  2. **0.4 to 1.3 s, wires draw.** Each jack wire draws itself from its source plug to its target plug in 500 ms (a dash offset on a path of length 1), the 24 starts spread so the last ends at 1.3 s. Their ends sit on the sockets of the still-lowered monitors' small screen faces and hang as a slack chord; they keep following the windows as these rise and settle into their lanes. The source plug shows when the wire starts, the target plug when it arrives.
  3. **0.9 to 2.0 s, windows open.** The eight windows lift, rotate and zoom, 70 ms apart by distance from the DPI, each taking what is left of the span (610 ms), and stay open. Clicking a computer or a window pins its room; clicking the floor releases the pin; Escape does nothing.
  4. **On Données, after the opening (at once from Logiciels): loading, then the editor.** Each window shows « Chargement… » in its brand-less title bar with a thin progress bar under it and its skeleton dimmed to 30 percent, for 500 ms, 40 ms apart by distance from the DPI (all done 780 ms after the opening). It then crossfades in 240 ms to its file. Back on Logiciels the content crossfades back to the skeleton with no loading. Under reduced motion the bar stays full and the editor appears after the same 500 ms, with no crossfade.
- **Floating screen**: an HTML window, 416 by 256 logical pixels (the monitor's 1.625 aspect), with `transform-origin: 0 0` and a `matrix3d` that maps its box onto the current quad. One eased progress per window (the kit's ease-out) mixes the four corners from the projected monitor face to a frontal rectangle, which reads as lift, rotate and zoom. The rectangle is the largest one of the monitor's aspect inside the room's projected plan rectangle, inset by 4 viewBox pixels and, in the left column where rooms touch, by a gutter for plugs and wire lanes; it floats up by up to 6 viewBox pixels where the room has height to spare.
- **Skeleton window**: an ink bezel (12 logical px radius) around a paper glass, a title bar in 16 percent of the room colour with the product name from `softwareExamples[0]` and the system acronym, and a body of real labels, fields and tables filled with synthetic data from `screenMocks.ts`: GAM identity and admission, RDV week agenda, DPI record with tabs, SGL results with units and flags, PACS/RIS worklist and an image placeholder with a crosshair, Pharmacie prescription with an interaction alert, Bloc planning by room and hour, EAI message monitor. The room colour appears only in the title bar, the chips and the active row. Text is 12 to 13.5 logical pixels, so it scales with the window: legible on a large screen, texture on the smallest windows at 1440 px.
- **Editor view**: the content of a window on Données, a file about the same synthetic patient (Martin DURAND, born 14/06/1958, venue 25-004821, bed 214-B, Dr ROUX), one per service, built by pure generators in `src/content/messages/` from `screenMocks.ts`, shown as an **excerpt**. No brand: the title bar's product name and acronym are hidden on this layer (the bar only carries the loading state) and the editor covers the whole glass. The chrome is a 20 px tab strip with the file name, a format badge in 14 percent of the room colour and the service dot and acronym at the right. Under it a 16 px hint row, then 7 rows of 23 columns in the site's mono stack at 25 logical px on a 27 px line, with a 38 px gutter of true line numbers. At 1440 px that is 9.05 px on screen in the smallest window (EAI), 9.5 px in SGL and Pharmacie, 11.6 px in the DPI, 13.1 px in PACS/RIS and Bloc and 13.5 px in GAM and RDV. Thirty-four columns would need 6.9 px in the smallest window, so 23 is what 9 px allows. `excerptOf(file, focus)` takes a named range, soft-wraps the file to 23 columns (HL7 before a field separator or after a space, XML before a tag or an attribute, JSON at spaces and after a dot, DICOM before the value and the comment; continuation rows indented by two and unnumbered), dedents the non-HL7 formats to the range, shows the range from its first row, fills spare rows with the neighbouring lines and folds the rest into IDE markers (« ⋯ 3 segments repliés », « ⋯ 12 lignes repliées »). A range taller than the window shows its first rows and folds the remainder.
- **Highlighted range**: each file declares named ranges (`messages/ranges.ts`) and one main range, highlighted at rest like an IDE's current line: a full-width tint of 14 percent of the room colour over its rows, a 5 logical px bar in the room colour in the gutter, and the range label as a hint right-aligned above the code in small caps in the room colour (18 characters at most). Hovering a wire lights the range its flow names in the source window and, where the destination declares that payload as received, the matching range there too; the excerpt re-folds to show it and crossfades in 160 ms, and returns to the main ranges when the pointer leaves. The 24 flows are keyed `from→payload` in `FLOW_RANGE_KEYS`, defaulting to the source's main range.
- **Focus**: clicking a window on Logiciels grows it 1.6 times about its centre, slides it just enough to stay inside the stage (8 px margin), raises it above its neighbours and deepens its shadow (up to twice the offset and blur); its wires relax to slack chords. Clicking it again, Escape, clicking another window or the floor shrinks it. It follows one eased progress over 350 ms, reversible mid-flight; under reduced motion it jumps. On Données the same click opens the Inspector instead, and entering Données clears any focus.
- **Inspector**: on Données, a click on a window (or Enter on the room pinned with the arrow keys) opens the full file of that service over the whole stage. The panel is laid out at the stage size minus a 16 px margin and projected by the same `matrix3d` as the windows, on one eased progress over 450 ms from the window's own quad to the stage rectangle (`screens/inspect.ts`); the window hands over to the panel on the first 35 percent of the linear level, the other windows and the wires fade to 0 over the first half, and a paper scrim at 78 percent dims the floor. Under reduced motion nothing moves: the panel fades in 200 ms at its final place. Escape, the × button, a click on the scrim, or leaving Données closes it by the reverse motion; Left and Right (or the two « Fichier précédent / suivant » buttons) switch to the previous or next room's file without closing, wrapping around, and pin that room so the side panel follows. `screensLive.ts` stays the owner of window states and talks to the inspector through events (`inspector/inspectorChannel.ts`).
  - **Layout**: a header (file name in mono, format badge, service dot, acronym and room, one plain-French sentence about the file from `content/decode/summaries.ts`, the two navigation buttons and ×), the two panes, a detail strip and a footer. From 1024 px the panes sit side by side (Brut 1.08, Lisible 1); below, one pane and a « Brut / Lisible » toggle (Lisible first). Below 46 rem of panel width the navigation buttons keep only their chevrons.
  - **Brut**: the whole file, nothing folded, with true line numbers, a gutter tag per segment or block (« En-tête », « Patient », « Venue », « Mouvement », « Résultat »…), the token colours of `editor.css` (every token at least 4.5:1 on white and on the 14 percent tint) and soft wrapping with a hanging indent of two columns, breaking after `|` and `~` first, which keeps the existing continuation style without numbering the continuation rows. Each segment id, field, DICOM tag line, CDA attribute or text and FHIR key with its value is a unit with a `data-ref`.
  - **Lisible**: one card per segment or block (title, optional subtitle such as « Hémoglobine · 11,2 g/dL · bas », raw code at the right) listing label, value and the raw reference in 11 px mono under the label; long CDA and FHIR paths are shortened to their last parts. FHIR rows are grouped under the first key below the resource. Values come from `content/decode/`: dates in French, codes expanded with their raw code in parentheses, INS grouped, repetitions on their own lines.
  - **Linking**: hovering or focusing a unit, a row or a gutter in either pane lights its counterpart through the shared ref: a tint of 14 percent of the room colour, a 1.5 px underline under a field and the 4 px gutter bar on its line. Clicking pins it (pinned adds a 1 px ring and `aria-pressed`) and scrolls the other pane to it; clicking the pinned unit again returns to the file's main range, which is selected on open (whole blocks when the range covers them, only the rows inside it otherwise). Rows are tab stops (Up and Down move between them, Enter or Space pins).
  - **Detail strip**: the label, the raw reference, the raw text and a plain-French sentence for the hovered, else the pinned, field; it is how the dictionary teaches what a field is for.
  - **Footer**: a legend of the token colours of this file's format (« segment », « champ », « date », « séparateur »; « élément », « attribut », « valeur » for CDA; « clé », « nombre » for FHIR; « balise », « type », « nom » for DICOM) and the flows the file travels on, read from `departments.ts` (« Envoyé au DPI et à l'EAI · HL7 v2 · MLLP »).
  - **Choices inferred**: no gradient text, no kicker, no coloured border on cards (the card ring and tint carry selection); the only coloured bars are the 4 px editor gutter bar of the brief and the 2 px underline of the Brut / Lisible toggle; depth is offset and blurred shadows on the panel and the kit's lift on cards; secondary text uses `--anatomy-text` (7:1), never `--anatomy-muted` (3.2:1); the two chevrons and × are drawn SVG, not glyphs.
- **Syntax colours**: one tokenizer per format in `syntax.ts` emits `data-token` spans; `editor.css` colours them from the room colour and three service colours mixed into ink, every token at least 4.5:1 on the editor's white and on the 14 percent tint (measured in the browser: lowest 4.65 for timestamps on the tint, 4.67 for numbers, 5.0 for segment ids, 5.1 for values). Segment, tag and key take the room colour in bold; separators and comments (italic) are the quiet ink; text is ink.
- **Jack wire**: one per flow (24), from a socket ring on the source window's bottom bezel to a socket ring on the target's top bezel, sockets spaced along the bezel by where the other end sits. A chain of cubic Béziers (a clamped B-spline over lane waypoints found at build time by an A* router through the gutters between windows, side by side on parallel lanes, with a gentle sag on long level runs): a 1.2 px core in the room colour over a 3.5 px glow at 25 percent, round caps, under the windows so a wire never draws across a window face. Endpoints and plugs follow the windows every frame; the route blends in from a straight chord during the second half of the rise and the wire fades in over the same half. Hovering a wire thickens it, lights the source room and the bezel rings of its two windows; nothing else dims. The label carries one text per layer, so on Données a hovered wire reads payload and format. The plate hint on Logiciels and Données reads « Survolez un fil ou cliquez une fenêtre ».
- **Jack plug**: a metal tip entering the socket ring, an insulating ring in the room colour, an ink body and a strain relief, 25 logical px long, scaled with its window and turned to the bezel's outward direction.
- **Wire label**: a paper pill with a 0.75 px hairline in the room colour and the message type then the transport, above the windows, on the visible part of the wire. Shown only for the hovered wire and for the wires of a pinned room.

## Réseau

The network engineer's reading of the same floor. Entering the layer plays one 2.0 s sequence on the clock of the window sequence (600 ms back, a 200 ms fade under reduced motion); the windows stay closed. All constants are in `network/networkSequence.ts`.

- **Sequence.** 0 to 0.9 s zones: the room tints fade to the faint outline (first half), the zone fills rise (second half). 0.3 to 1.1 s a halo pulse runs over the gear from the firewall outwards. 0.7 to 2.0 s the 31 cables draw themselves, 0.6 s each, following their own dash pattern; a cable's firewall gate closes in the last fifth of its draw. Under reduced motion cables and zones only fade.
- **Zones replace room colours.** Four fills that stay apart without hue: the share of the zone colour in the floor grows from workstations (22 percent, the lightest) to servers (45), biomedical (67) and DMZ (79, the darkest), and the biomedical patches carry a 45 degree hatch, the DMZ patch a dot grid, drawn as SVG `<pattern>` fills laid on the floor by the camera. Room numerals stay. The legend row swaps to the four zones and four families in a 320 ms crossfade, swatches carrying the same tint and pattern.
- **Gear.** Drawn on every layer as architectural parts, each resting on something: a wall switch per room (a box with ears, a port row, LEDs and a gland over a riser conduit), and in the server room a core rack with a 1U unit, a free-standing firewall box on a plinth with a status LED row, a DMZ rack on its patch, a WAN router on feet; outside the left wall a telecom box on a plinth at the baseboard edge, joined by a fibre tray and two covers through the wall. On Réseau gear glows in its zone colour; the firewall glows stronger while a cable that crosses it is hovered.
- **Bus.** In the server room the trunking continues as one straight line, `BUS_Y`: door, core rack, gate, firewall, EAI branch (north to the foot of the EAI rack), DMZ rack, router, wall, tray, telecom box. A flow's hops map to its drawn path in `cableRoutes.ts`: device (the anchor, or the scanner for the biomedical flow), its room switch when the hops have one (the scanner route runs along the wall under it), the trunking to the hub, the bus to the end station; a message for another room returns on a second leg from that station. An external flow runs straight on to the telecom box.
- **Cables by family.** Colour from `PROTOCOL_FAMILIES` with a dash pattern of its own: HL7 v2 solid, DICOM dashed (6 3), HTTPS dotted (1.5 3), SMTP dash-dot (6 3 1.5 3), in the cable, the legend swatch and the hover label, which always starts with the family name. The glow stays solid. A small gate straddles each cable at the firewall.
- **Trace.** Hovering a cable raises its strokes, walks one packet along it in 1.6 s hop by hop (it dwells 100 ms at each station, then rests 350 ms and repeats) and lights the hop in the dock of the side panel, which docks to the bottom of the panel on wide screens. Flow buttons in the panel do the same on focus or hover.
- **Views.** Click a cable, the firewall or the telecom box, or use the panel buttons: fullscreen over the stage on the inspector's frame and motion (450 ms from the clicked thing, 200 ms fade under reduced motion). Fiche de flux in two columns (stack table, rule card, stepper with zone dots; capture with the MLLP bytes, DICOM PDU header, TLS ClientHello or ESP packets highlighted), Table de règles (deny rows tinted at 8 percent and marked by a « Refus » chip with a filled square, the last hovered flow's rule outlined), Partenaires (one card each, flows per room), Glossaire (accent- and case-insensitive filter). Left and Right step through the flows of a room.
- **Colour-blind safe.** Family colours start from the Okabe and Ito set and were adjusted until every pair stays at ΔE76 20 or more under deuteranopia, protanopia and tritanopia (`content/network/cvd.ts`, tested); zone fills pass the same test. No distinction rests on colour alone: dash patterns, hatch and dots, lightness order, the family name in every label, zone names next to every dot, the « Refus » chip.
- **Choices inferred.** The biomedical hex moved from teal to a muted wine so a patch never reads as the Bloc colour; the Okabe and Ito blue, green and purple were darkened or lightened by up to ΔE 12 to pass the pair test; hovering a cable in a dense bundle picks the topmost strand, so the panel buttons reach every flow.

## Do's and Don'ts

- Do keep one colour per service across the floor, the cables and the panel.
- Do keep wire and cable text hidden until a wire is hovered or its room is pinned on purpose; a keyboard visitor must be able to pin a room and read its labels.
- Do keep wires under the windows and in the gutters between them.
- Do keep cables on the floor and below the furniture, so they read as laid cables.
- Do keep bundles on whole lanes and corners concentric.
- Don't add hex values to the figure code; add a service colour in `departments.ts`.
- Don't dim anything by opacity: the floor, the numerals and the furniture stay as drawn on every layer. Only the cables, packets and labels stay hidden, and only on Logiciels and Données.
- Don't put real patient data in a skeleton window: every name, INS number, date and value is invented (CLAUDE.md, section 11).
- Don't use a second typeface, a gradient, or a coloured side border above 1px.
- Don't let colour be the only cue on Réseau: pair it with a dash, a pattern, a lightness step or a name.
- Don't add zoom, pan or wheel handling to the drawing; the windows rise by themselves when the Logiciels layer opens, never on a wheel or a drag.
- Don't show real patient data in an editor view either: the INS has month 99, every name is invented, the document payload is a placeholder.
- Don't fold, truncate or rewrite anything in the Inspector's Brut pane: the windows show excerpts, the inspector shows the file.
- Don't open the Inspector on Logiciels: its windows keep the 1.6 times focus.
