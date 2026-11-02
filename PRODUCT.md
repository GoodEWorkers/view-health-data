# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Several audiences read the same site, each on its own layer:

- Hospital IT and DSI teams, who run or buy the systems and want interfaces,
  standards and ports stated precisely.
- Non-technical hospital decision makers (directors, clinicians, project owners),
  who need the big picture of how patient data moves without jargon.
- Consultants and sales staff of partner firms, who use the site as a visual aid in meetings
  and proposals to explain a hospital information system (SI hôpital) to prospects.
- Students and the general public, with no prior knowledge assumed.

Layers exist so that each audience finds its own depth: the physical floor for
orientation, then logiciels, données and réseau for increasing technical detail.

## Product Purpose

A static, French-language site that explains visually how data flows inside a
French hospital information system: which service produces which data, which
software carries it, in which format, over which network path, and how the EAI
centralises the exchanges. Success: a visitor of any of the audiences above can
point at a room, a system or a wire and say what data it carries and why.

## Positioning

One continuous model across layers. The same eight services keep the same
position and colour whether seen as a cutaway architectural model (SVG, anatomy
style), as the same model with each room's IT equipment lit and linked by
coloured cables, or as data and network detail in the side panel. Every fact on screen traces to a
standard or to `doc/sources.md`.

## Constraints

- Source of truth for the eight services, their functions, flows and colours:
  `src/content/departments.ts`. The services and acronyms come from the client's
  "SI hôpital — Flux interne + externe" diagram and must not be renamed.
- Visitor-facing text is French; code and docs are English (CLAUDE.md, Appendix C).
- Vendor names appear as examples only, each verified against the vendor's site or
  a French health-IT source.
- Facts about standards and services (HL7 v2, DICOM, FHIR, INS, DMP, MSSanté,
  PMSI) carry a source in `doc/sources.md`; modelling choices are listed there as
  assumptions to confirm.
- Figure 1 (the floor) stays an anatomy-kit SVG. The software, data and network
  layers are drawn into that same drawing: each room's IT equipment is lit and
  coloured cables link it; a label on each cable states what it carries and
  appears only for the hovered cable or a room pinned on purpose, never on
  phones, where it is too small and the panel carries it. On the software and
  data layers, opening the layer lights the computers, draws the jack wires
  between them and lifts the eight screens: skeleton interfaces with synthetic
  data on Logiciels, and on Données the message or document each service holds
  about the same synthetic patient, in an editor view.
- Static output (Astro), pinned dependencies, no backend.

## Open decisions

- Patient-journey narrative (following one record through the software screens) is
  planned as a later step and not yet specified.
