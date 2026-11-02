# Sources and assumptions for the logiciels / données / réseau layers

Developer-facing. Every fact shown in `src/content/departments.ts` (layers, `messageType`, `transport`,
`externalFlows`) and `src/content/layerLabels.ts` (ports, labels) is either in the table below with a source
URL, or in the assumptions list for the owner to confirm. Checked on 2026-11-01.

Verification limits, stated plainly:

- `esante.gouv.fr` PDFs sit behind bot protection and could not be downloaded; the ANS facts marked
  "excerpt" come from search-result excerpts of those pages, not from the full text. Re-read them before publishing.
- The HL7 MLLP transport specification itself could not be retrieved (hl7.org PDF empty, product brief is a stub).
- The IANA service name for port 2575 is `hl7`, not `hl7-mllp`. The site only says "port 2575".

## Facts and their authority

| # | Fact | Source |
|---|---|---|
| F1 | HL7 v2 ADT trigger events: A01 Admit/Visit Notification, A02 Transfer a Patient, A03 Discharge/End Visit, A04 Register a Patient (outpatient, not assigned to a bed), A08 Update Patient Information | HL7 v2.5.1 ch. 3, sections 3.3.1 to 3.3.8 (HL7 Europe edition): https://www.hl7.eu/HL7v2x/v251/std251/ch03.html |
| F2 | ORM^O01 General Order, OML^O21 Laboratory Order, OMP^O09 Pharmacy/treatment Order, RDE^O11 Pharmacy/Treatment Encoded Order (the pharmacy application's encoding of the order), RRE^O12 Encoded Order Acknowledgment | HL7 v2.5.1 ch. 4 (4.13.3 to 4.13.6): https://www.hl7.eu/HL7v2x/v251/std251/ch04.html |
| F3 | ORU^R01 Unsolicited Observation Message | HL7 v2.5.1 ch. 7: https://www.hl7.eu/HL7v2x/v251/std251/ch07.html |
| F4 | MDM^T02 Original Document Notification and Content | HL7 v2.5.1 ch. 9: https://www.hl7.eu/HL7v2x/v251/std251/ch09.html |
| F5 | SIU^S12 Notification of New Appointment Booking (sent by a filler application) | HL7 v2.5.1 ch. 10, section 10.4.1: https://www.hl7.eu/HL7v2x/v251/std251/ch10.html |
| F6 | In France ADT messages follow IHE PAM with the French national extension: A01 inpatient, A04 outpatient, A03 discharge, A08 demographic update, A28 for identity, the ZBE segment carries the movement, the PID segment carries identifiers including the INS | IHE France PAM National Extension v2.11.1: https://www.interopsante.org/f/0684e0c5ee4f9e19c61fc1bffc7c133e38e3e975/Publication-IHE_FRANCE_PAM_National_Extension_v2.11.1.pdf and v2.10.2: https://interop.esante.gouv.fr/document/IHE_France_PAM_National_Extension_v2.10.2.pdf (excerpt) |
| F7 | A GAM-to-DPI message is an `ADT^A01` over HL7 2.5 with the French PAM profile (`MSH|^~\&|GAM|CHU-X|DPI|CHU-X|...|ADT^A01^ADT_A01|...|2.5^FRA^2.11`) | ANS example messages, `SGL/admission.er7`: https://raw.githubusercontent.com/ansforge/hl7V2-exemples/main/SGL/admission.er7 |
| F8 | A radiology report as CDA R2 travels in `MDM^T02` (RIS to intermediation platform); a biology report as CDA R2 travels in `ORU^R01` (lab system to platform) | ANS examples repository, `Vague 2/Trans_Doc-CDA-HL7V2/.../MDM` and `.../ORU`: https://github.com/ansforge/hl7V2-exemples |
| F9 | CI-SIS "Transmission de document(s) CDA en HL7v2": a document-creating system sends CDA R2 documents to an intermediation platform (PFI) that publishes to the DMP and/or sends by MSSanté and returns acknowledgements | https://interop.esante.gouv.fr/ig/hl7v2/trans-cda-r2/ |
| F10 | Ségur at the hospital: the DPI produces exit documents (lettre de liaison de sortie, compte-rendu opératoire, ordonnances de sortie) as CDA R2 N1 with the INS, sent to the DMP / Mon espace santé and by MSSanté | https://esante.gouv.fr/segur/hopital and https://esante.gouv.fr/sites/default/files/media/document/DSR-HOP-DPI-Va2.pdf (excerpt) |
| F11 | Mon espace santé document API: REST-FHIR transactions, OAuth2 private-key JWT, "binary" mode converted to CDA R2 N1 for the DMP | https://esante.gouv.fr/sites/default/files/media_entity/documents/mes_specifications_api_documents_v1.8.pdf (excerpt) |
| F12 | INS retrieval and verification go through the INSi téléservice run by the Cnam over a single national reference base; the calling software authenticates with a CPx card or a legal-entity certificate; each information system must hold an identity referential | https://gnius.esante.gouv.fr/sites/default/files/2021-05/INS_Guide%20implementation_VD_0.pdf and https://esante.gouv.fr/sites/default/files/media_entity/documents/ANS_INS_FAQ%20PSL_VF.pdf (FAQ: excerpt) |
| F13 | MSSanté: trusted space managed by the ANS; operators exchange by SMTP inside mutual-TLS channels; mail clients use SMTP/IMAP over TLS; the operator must offer SMTP on port 587 | https://esante.gouv.fr/strategie-nationale/mssante and Référentiel #1 https://esante.gouv.fr/sites/default/files/media_entity/documents/mss_dsft_operateurs_mssante_v1.4_draft_20210205.pdf (excerpt) |
| F14 | PMSI: hospitals build RSS summaries and send them to ATIH through the e-PMSI online platform | https://www.atih.sante.fr/mco/presentation and https://www.epmsi.atih.sante.fr |
| F15 | DICOM C-STORE and C-FIND are DIMSE-C services | DICOM PS3.7 sections 9.1.1 and 9.1.2: https://dicom.nema.org/medical/dicom/current/output/chtml/part07/chapter_9.html |
| F16 | DICOM well-known port 104, registered port 11112 | DICOM PS3.8 section 9.1 note: https://dicom.nema.org/medical/dicom/current/output/chtml/part08/chapter_9.html |
| F17 | Modality Worklist SOP Class (Basic Worklist Management Service Class) | DICOM PS3.4 K.6.1: https://dicom.nema.org/medical/dicom/current/output/chtml/part04/sect_K.6.html |
| F18 | DICOMweb: WADO-RS (retrieve), STOW-RS (store), QIDO-RS (search) | DICOM PS3.18 chapter 10: https://dicom.nema.org/medical/dicom/current/output/chtml/part18/chapter_10.html |
| F19 | DICOM SR (structured report), e.g. Basic Text SR | DICOM PS3.3 A.35: https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_A.35.html |
| F20 | IANA registry: `hl7` 2575/tcp, `acr-nema` 104/tcp, `dicom` 11112/tcp, `https` 443/tcp, `submission` 587/tcp | https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.csv (grepped on 2026-11-01) |
| F21 | IHE Scheduled Workflow: RAD-2 Placer Order Management is HL7 `ORM^O01`; RAD-5 Query Modality Worklist; RAD-8 Modality Images Stored | IHE Radiology TF-2: https://www.ihe.net/uploadedFiles/Documents/Radiology/IHE_RAD_TF_Rev12.0_Vol2_FT_2013-09-06.pdf (search excerpt) |
| F22 | MLLP is the HL7 lower-layer transport used for HL7 v2 over TCP | HL7 product brief: https://www.hl7.org/implement/standards/product_brief.cfm?product_id=55 and https://learn.microsoft.com/en-us/azure/logic-apps/connectors/integrate-healthcare-systems (the MLLP text itself was not retrieved) |
| F23 | DMZ is a sub-network separating two zones of different trust through firewalls; where physical separation is impossible, logical segmentation by VLAN | ANSSI-PA-066, section 2.1 and 2.2: https://messervices.cyber.gouv.fr/documents-guides/anssi-guide-passerelle_internet_securisee-v3.pdf (text read) |
| F24 | Systems to partition include the office IT, the biomedical device management IT and the emergency IT; partition at least logically (VLAN) | CERT-FR CERTFR-2024-CTI-010, recommendation R6: https://www.cert.ssi.gouv.fr/uploads/CERTFR-2024-CTI-010.pdf (text read) |
| F25 | Connected medical devices should allow isolation from the network (R26) and a VPN (R27) | ANSM cybersecurity recommendations 2022: https://ansm.sante.fr/uploads/2022/09/23/20220923-recommandations-ansm-cybersecurite-des-dmil.pdf (text read) |
| F26 | A grossiste-répartiteur buys, stores and distributes medicines and supplies pharmacies and hospital pharmacies (PUI) | Code de la santé publique R5124-2 and R5124-59: https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000026446691 (excerpt) |
| F27 | Doctolib sells an online appointment offer to hospitals ("Doctolib Hôpital") | https://info.doctolib.fr/hopital/demande-de-rdv/ and https://www.doctolib.fr/hopital-public |
| F28 | Teleradiology is telemedicine applied to imaging (télédiagnostic and téléexpertise), framed by the G4-CNOM guide and charter | https://www.conseil-national.medecin.fr/sites/default/files/2025-06/charteteleradiologie.pdf and https://www.telemedecine-360.com/wp-content/uploads/2018/12/teleradiologie-g4cnom.pdf (charter text read) |
| F29 | Vendor examples (Product (Vendor)) already shown in the "Salles" layer | Verified in the earlier content commit; not re-checked here |

## Assumptions to confirm with the owner

Each is a reasonable hospital practice or an interpretation of the source diagram, not a standard. All of them live in `departments.ts` strings or `layerLabels.ts`.

1. **Trigger event per flow.** The diagram only names payloads, so each flow's `messageType` is the most representative event, and families are listed in the "Formats" lists. Chosen: Identité patient `ADT^A01` (F7), Mouvements `ADT^A02`, Planning and Consultations programmées and Programmation `SIU^S12`, DPI to SGL Prescriptions `OML^O21`, Observations `ORU^R01`, imaging prescriptions `ORM^O01` (F21), pharmacy prescriptions `OMP^O09`, Dossier anesthésie `MDM^T02`, SGL results `ORU^R01`, RIS and Bloc reports `MDM^T02` (F8), Pharmacie Prescriptions `RDE^O11`, Interactions `RRE^O12` (an acknowledgement of the encoded order carrying the pharmacist's alerts), DPI Clinical data `ORU^R01`. The EAI row "ADT messages" shows `ADT^A01` as the example of the family.
2. **GAM to RDV "Disponibilités"** has no message type: no HL7 v2 event was found for pushing availabilities from a GAM, so only `MLLP` is shown.
3. **MLLP everywhere for HL7 v2**, and **every direct flow of the diagram physically transits the EAI** (project brief: "everything transits the EAI"). Ports 2575, 104, 11112, 443 and 587 are the registered defaults (F20); real sites often configure others.
4. **PACS/RIS to DPI "Images"** is modelled as DICOMweb `WADO-RS` over HTTPS (F18): the DPI opens images from the PACS. **PACS/RIS to EAI** uses `C-STORE` (F15) as the representative DICOM service.
5. **Network zones per room.** User workstations (accueil, comptoir, postes de soins, guichet), hospital servers (all applications), biomedical modalities (scanner, lab analyser, anaesthesia machine), DMZ (EAI relay). Segmenting these is supported in principle by F23 to F25, but which equipment sits in which VLAN is the hospital's choice.
6. **Firewall statements** in the Réseau paragraphs: an internal firewall between user workstations and servers, and between the biomedical network and servers; no firewall between servers of the same zone; the EAI keeps its exchanges inside the server zone.
7. **Crossing zone of each external flow:** INSi via proxy, e-PMSI via proxy, grossiste-répartiteur via proxy, online booking via DMZ, DMP / Mon espace santé via DMZ, MSSanté via DMZ, teleradiology via VPN (F25 mentions VPN for devices only). The INSi transport is shown as HTTPS: the Sesam-Vitale page does not state the protocol. The wholesaler order channel (HTTPS) is not sourced.
8. **PMSI flow is attached to the GAM**, because admission and billing software often sit together; the "Facturation" function listed for PACS/RIS in CLAUDE.md has no external flow.
9. **DPI to DMP directly over HTTPS.** Under Ségur wave 2 the DPI may instead hand CDA documents to a PFI in HL7 v2 (F9), which then publishes. The site shows the direct path as the simplest explanation.
10. **Online booking agenda** mirrors the open slots of the RDV and exchanges over HTTPS; Doctolib's technical interface to hospital systems is not public (F27 covers the offer only).
11. **Screen names** are generic functional names, not vendor screens: Fiche d'identité, Admission du patient, Planning des lits, Mouvements du jour, Agenda du praticien, Planning des ressources, Prise de rendez-vous, Dossier patient, Prescriptions, Résultats de biologie, Lettre de liaison de sortie (the term itself is in F10), Liste de travail, Suivi des échantillons, Validation biologique, Planning des salles, Liste de travail des examens, Visionneuse d'images, Compte-rendu du radiologue, Analyse pharmaceutique, Dispensation, Gestion des stocks, Commandes, Planning des blocs, Feuille de bloc, Compte-rendu opératoire, Supervision des interfaces, Journal des messages, Rejeu des messages en erreur.
12. **Storage statements**: application database per system, document server for the DPI, image archive for the PACS, local copies of identity and results in receiving systems, and a message log and queue in the EAI.
13. **Role sentences** restate the functions of the domain vocabulary table in CLAUDE.md. For the EAI: it controls, transforms and routes messages, keeps a trace to replay them, and is supervised by the IT team. For the SGL: it talks to the analysers.
14. **SGL and Bloc have no direct external exchange**: lab results and operative reports leave through the DPI (F10).
15. **FHIR in the DPI formats** rests on an excerpt of the Mon espace santé API specification (F11); the PDF could not be opened.
16. **GAM as the identity referential**, and the diagram arrow GAM to DPI carrying the PID of each ADT, follow the INS guide (F12) and F6.
17. **Metro map is a schematic.** A line passes through the stations of its flows in the order of the flows and ends in the EAI, so a wire between two stops of one line does not stand for one physical cable: its labels name the flows that arrive at the stop it leads to. Line names (ADT, SIU, clinique, ORU, DICOM, RDE, MDM) follow the message family of each service's main flow; the geometry (lanes, loops, crossings) carries no meaning.
