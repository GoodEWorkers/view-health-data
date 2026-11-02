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
  wire-label:
    fontFamily: "Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "10px (CSS)"
    fontWeight: 600
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

Thesis: nothing in the drawing is dimmed. Emphasis comes from lighting the devices and from the cables, and the cables lie on the floor, so furniture stands on them and a cable disappears under a desk and comes out the other side. The same drawing answers three questions with the same geometry and different text: which software (Logiciels), which data and format (Données), which transport and port (Réseau). Hovering a device or a cable is the signature interaction: its room lights, its packets ride its cables, the side panel follows. The one exception is the Logiciels layer, where switching to it plays one sequence that lifts every screen out of the drawing and leaves them open (see Logiciels sequence), and the floor cables, their packets and the device labels stay hidden, because the screens carry the software and the jack wires carry the links.

Chosen and inferred, not interviewed (the brief pinned the form): Atkinson Hyperlegible Next as the single site face (public wayfinding legibility, slashed zero for HL7 codes such as `OML^O21` against `ORU^R01`); the plate keeps the kit's monospace chrome.

## Colors

- **Paper, face, ink**: the kit's light variables. Paper `#fbfbfa` is the plate and the pill ground, face `#ffffff` is the lit face of a device, ink `#18181a` is its lit edge (`--anatomy-strong`).
- **Cable colours**: one per sending service, read from `departments.ts` through `--room` on each cable. No hex lives in the figure code.
- **Pill and device-label text** is the room colour mixed 65 percent into ink (`--pill-ink-share`), which keeps the text legible on paper.
- **Glow** is the room colour at 70 percent over 1.5px and 35 percent over 4px behind a device, rising by 30 points each for the active room's devices (`--glow`). It is a small halo, not a wash.
- Nothing lowers its opacity. The cable's glow stroke sits at 22 percent opacity because it is a halo; the active room's cables raise it, never lower the others.

## Typography

One face for the whole site, self-hosted through `@fontsource-variable/atkinson-hyperlegible-next`. Device labels and pills are SVG text at 7.5 viewBox pixels, so they scale with the drawing: 600 for pills with tabular figures, 700 for device labels, which also carry a paper halo so they stay legible over the floor. Plate corners, hints and readouts stay in the kit monospace; the plate title and hint follow the layer.

## Layout

- **One drawing.** Devices, cables, pills and labels share the floor's viewBox (800 by 458) and its single affine camera. Cables are built in world units (corner rounding, lane offsets) and projected afterwards, so a curve stays smooth. The drawing itself never zooms or pans; the floating screens are HTML laid over it.
- **Cables.** One per flow in `departments.ts`, 24 in all, 0.4 world units above the floor. A cable runs from the anchor monitor of its room, through the room door, along the cable trunking, through the door of the receiving room to its anchor. EAI-bound cables follow the room's route to the hub; room-to-room cables take the shortest trunking path, so the ring's two sides share the load. A cable never doubles back.
- **Bundles.** Cables that overlap on a line share a bundle with a lane pitch of 1.4 world units, centred on the trunking. Within a bundle, strands are ordered by where they first part ways, so a strand keeps its side round corners and the bundle turns concentrically; the pitch shrinks only when a bundle would be wider than a door. Corners are rounded with a radius of 4 world units, wider on the outside of a turn and tighter on the inside.
- **Anchors.** Each room has one anchor device, a screen-bearing workstation monitor listed in `devices.ts`; cables end under it and a later zoom lands on its screen face, whose four corners are exported.
- **Pills.** One per cable, on the middle of its longest straight leg, slid along the cable out of rooms and away from other labels. Each pill holds three texts, one per layer, and the stylesheet shows the active one. A pill has no text at rest on any layer: it fades in over 160 ms for the hovered cable, and for every cable of a room pinned on purpose (arrow keys, a focused room key, a click on a screen), so keyboard visitors can read them. Below about 620 px of stage width, on a phone, pills stay hidden and the panel under the plate carries every interface.
- The legend row under the plate keeps the room keys on every layer: the room colour is the cable colour.

## Elevation & Depth

Nothing is raised over the model. The only depth is the kit's own: solids with four tones, cables on the floor under the furniture, and the soft glow behind a lit device.

**Switching** is one custom property, `--device-light`, registered as a number and eased for 320 ms with the kit's exponential ease-out: 0 on Salles (devices as drawn, cables and labels at opacity 0, pointer events off), 1 on any other layer, and no transition under reduced motion. A second one, `--cable-show`, is 0 on Logiciels (it jumps, so no ghost cables show while `--device-light` rises) and fades back to 1 in 320 ms on the other layers. The floor itself is never hidden or faded.

**Floating screens** are the one thing raised over the model, on the Logiciels layer only, and they carry the layer's only shadows: a soft shadow under each window (a blurred ink rectangle offset down and growing with its progress, up to 16 px down and a 10 px blur in logical units) that sells the levitation.

## Shapes

Round everything a cable touches: round caps and joins, circular arcs at every corner, pill labels at 1.5 viewBox pixels. Devices keep the kit's bevels.

## Components

- **Device**: a part flagged `device` in `parts.ts`, wrapped in `<g data-device>`. On a software, data or network layer its edges take the lit ink, its top face lightens as in the kit's `lit` tone, and a colour glow rises behind it.
- **Anchor device**: the room's workstation monitor, wrapped in `<g data-device data-anchor>` and carrying a `data-screen` path on its screen face.
- **Cable**: a `<g data-cable data-from data-to>` with two round strokes in the service colour: a glow stroke 2.6 viewBox pixels wide at 22 percent opacity under a core stroke 0.9 wide. Hovering it lights its source room.
- **Pill**: paper rectangle with a hairline in the room colour and one row of text: Logiciels writes the message type then the transport; Données the payload then its format family (HL7 v2, DICOM, CDA, FHIR); Réseau the transport then its port. External flows are not drawn.
- **Device label**: beside the anchor monitor; Logiciels shows the first software product (a market example, vendor dropped), Données the first two data entities, Réseau the first network zone. All come from `departments.ts` through `layerLabels.ts`.
- **Packet**: a bead of the service colour with a paper ring, riding the cables of the active room on the shared packet timing; absent under reduced motion, at most 48 at once.
- **Legend key**: a dot in the room colour with the room name; hovering a key pins its room.
- **Logiciels sequence**: one timeline of 2.0 s, all constants in `sequence.ts` and tested. Entering the layer plays it forward, leaving it runs the same clock back in 600 ms (windows down, wires undrawn, glow off), and returning replays it. Under reduced motion the clock is compressed to a 200 ms fade, with no draw, no lift and no glow wave.
  1. **0 to 0.5 s, glow wave.** The eight anchor computers rise to full glow (`--wave`, which feeds the same `--emphasis` as the active room's glow plus a 7 px bloom), 40 ms apart by distance from the DPI. Nothing else in the floor changes.
  2. **0.4 to 1.3 s, wires draw.** Each jack wire draws itself from its source plug to its target plug in 500 ms (a dash offset on a path of length 1), the 24 starts spread so the last ends at 1.3 s. Their ends sit on the sockets of the still-lowered monitors' small screen faces and hang as a slack chord; they keep following the windows as these rise and settle into their lanes. The source plug shows when the wire starts, the target plug when it arrives.
  3. **0.9 to 2.0 s, windows open.** The eight windows lift, rotate and zoom, 70 ms apart by distance from the DPI, each taking what is left of the span (610 ms), and stay open. Clicking a computer or a window pins its room; clicking the floor releases the pin; Escape does nothing.
- **Floating screen**: an HTML window, 416 by 256 logical pixels (the monitor's 1.625 aspect), with `transform-origin: 0 0` and a `matrix3d` that maps its box onto the current quad. One eased progress per window (the kit's ease-out) mixes the four corners from the projected monitor face to a frontal rectangle, which reads as lift, rotate and zoom. The rectangle is the largest one of the monitor's aspect inside the room's projected plan rectangle, inset by 4 viewBox pixels and, in the left column where rooms touch, by a gutter for plugs and wire lanes; it floats up by up to 6 viewBox pixels where the room has height to spare.
- **Skeleton window**: an ink bezel (12 logical px radius) around a paper glass, a title bar in 16 percent of the room colour with the product name from `softwareExamples[0]` and the system acronym, and a body of real labels, fields and tables filled with synthetic data from `screenMocks.ts`: GAM identity and admission, RDV week agenda, DPI record with tabs, SGL results with units and flags, PACS/RIS worklist and an image placeholder with a crosshair, Pharmacie prescription with an interaction alert, Bloc planning by room and hour, EAI message monitor. The room colour appears only in the title bar, the chips and the active row. Text is 12 to 13.5 logical pixels, so it scales with the window: legible on a large screen, texture on the smallest windows at 1440 px.
- **Jack wire**: one per flow (24), from a socket ring on the source window's bottom bezel to a socket ring on the target's top bezel, sockets spaced along the bezel by where the other end sits. A chain of cubic Béziers (a clamped B-spline over lane waypoints found at build time by an A* router through the gutters between windows, side by side on parallel lanes, with a gentle sag on long level runs): a 1.2 px core in the room colour over a 3.5 px glow at 25 percent, round caps, under the windows so a wire never draws across a window face. Endpoints and plugs follow the windows every frame; the route blends in from a straight chord during the second half of the rise and the wire fades in over the same half. Hovering a wire thickens it, lights the source room and the bezel rings of its two windows; nothing else dims. The plate hint on Logiciels reads « Survolez un fil ou cliquez une fenêtre ».
- **Jack plug**: a metal tip entering the socket ring, an insulating ring in the room colour, an ink body and a strain relief, 25 logical px long, scaled with its window and turned to the bezel's outward direction.
- **Wire label**: a paper pill with a 0.75 px hairline in the room colour and the message type then the transport, above the windows, on the visible part of the wire. Shown only for the hovered wire and for the wires of a pinned room.

## Do's and Don'ts

- Do keep one colour per service across the floor, the cables and the panel.
- Do keep wire and cable text hidden until a wire is hovered or its room is pinned on purpose; a keyboard visitor must be able to pin a room and read its labels.
- Do keep wires under the windows and in the gutters between them.
- Do keep cables on the floor and below the furniture, so they read as laid cables.
- Do keep bundles on whole lanes and corners concentric.
- Don't add hex values to the figure code; add a service colour in `departments.ts`.
- Don't dim anything by opacity: the floor, the numerals and the furniture stay as drawn on every layer. Only the cables, packets and labels stay hidden, and only on Logiciels.
- Don't put real patient data in a skeleton window: every name, INS number, date and value is invented (CLAUDE.md, section 11).
- Don't use a second typeface, a gradient, or a coloured side border above 1px.
- Don't add zoom, pan or wheel handling to the drawing; the windows rise by themselves when the Logiciels layer opens, never on a wheel or a drag.
