import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from './departments.ts';
import { dataFormat, flowInterface, flowRowLabel, plainName, stationRows, TRANSPORT_DETAILS, uniqueTransports, wireTexts, ZONE_LABELS } from './layerLabels.ts';

describe('flowRowLabel', () => {
  it('shows the message type and transport after the payload', () => {
    assert.equal(
      flowRowLabel({ payload: 'Identité patient', messageType: 'ADT^A01', transport: 'MLLP' }),
      'Identité patient (ADT^A01, MLLP)',
    );
  });

  it('puts the protocol first when the source diagram names one', () => {
    assert.equal(
      flowRowLabel({ payload: 'ADT messages', protocol: 'HL7 v2', messageType: 'ADT^A01', transport: 'MLLP' }),
      'ADT messages (HL7 v2, ADT^A01, MLLP)',
    );
  });

  it('returns the bare payload when nothing more is known', () => {
    assert.equal(flowRowLabel({ payload: 'Planning' }), 'Planning');
  });
});

describe('flowInterface', () => {
  it('names HL7 v2 for a message type sent over MLLP', () => {
    assert.equal(flowInterface({ payload: 'Planning', messageType: 'SIU^S12', transport: 'MLLP' }), 'HL7 v2 SIU^S12');
  });

  it('names HL7 v2 alone when the message type is not chosen', () => {
    assert.equal(flowInterface({ payload: 'Disponibilités', transport: 'MLLP' }), 'HL7 v2');
  });

  it('keeps the protocol written in the flow, with its DICOM service', () => {
    assert.equal(
      flowInterface({ payload: 'Images', protocol: 'DICOM', messageType: 'WADO-RS', transport: 'HTTPS' }),
      'DICOM WADO-RS',
    );
  });
});

describe('dataFormat', () => {
  it('reads the family from the protocol of the flow first', () => {
    assert.equal(dataFormat({ payload: 'Images', protocol: 'DICOM', messageType: 'WADO-RS', transport: 'HTTPS' }), 'DICOM');
  });

  it('reads HL7 v2 from a trigger event, and DICOM from a DICOM service, without a protocol', () => {
    assert.equal(dataFormat({ payload: 'Planning', messageType: 'SIU^S12' }), 'HL7 v2');
    assert.equal(dataFormat({ payload: 'Images', messageType: 'C-STORE' }), 'DICOM');
    assert.equal(dataFormat({ payload: 'Images', messageType: 'WADO-RS' }), 'DICOM');
  });

  it('reads CDA and FHIR from the message type', () => {
    assert.equal(dataFormat({ payload: 'Document', messageType: 'CDA R2' }), 'CDA');
    assert.equal(dataFormat({ payload: 'Dossier', messageType: 'FHIR Patient' }), 'FHIR');
  });

  it('falls back on the standard of the transport, and answers nothing for plain web exchanges', () => {
    assert.equal(dataFormat({ payload: 'Disponibilités', transport: 'MLLP' }), 'HL7 v2');
    assert.equal(dataFormat({ payload: 'Créneaux', transport: 'HTTPS' }), undefined);
  });
});

describe('wireTexts', () => {
  const flows = [
    { payload: 'Identité patient', messageType: 'ADT^A01', transport: 'MLLP' as const },
    { payload: 'Disponibilités', transport: 'MLLP' as const },
  ];

  it('writes the message type and transport on the software sheet', () => {
    assert.deepEqual(wireTexts(flows).logiciels, ['ADT^A01 · MLLP', 'Disponibilités · MLLP']);
  });

  it('writes the payload and its format family on the data sheet', () => {
    assert.deepEqual(wireTexts(flows).donnees, ['Identité patient · HL7 v2', 'Disponibilités · HL7 v2']);
  });

  it('writes the transport and its port on the network sheet', () => {
    assert.deepEqual(wireTexts(flows).reseau, ['MLLP · port 2575', 'MLLP · port 2575']);
  });

  it('writes the bare payload on the network sheet when the flow has no transport', () => {
    assert.deepEqual(wireTexts([{ payload: 'Planning' }]).reseau, ['Planning']);
  });

  it('writes one row per flow on every sheet, for every flow of the diagram', () => {
    for (const { flows: direct } of DEPARTMENTS) {
      for (const rows of Object.values(wireTexts(direct))) assert.equal(rows.length, direct.length);
    }
  });
});

describe('plainName', () => {
  it('drops the parenthesis that names a vendor or a precision', () => {
    assert.equal(plainName('M-GAM (Docaposte Santé)'), 'M-GAM');
    assert.equal(plainName('Identité patient (dont l\'INS)'), 'Identité patient');
  });

  it('leaves a name without parenthesis whole', () => {
    assert.equal(plainName('Venue / séjour'), 'Venue / séjour');
  });
});

describe('stationRows', () => {
  const [gam] = DEPARTMENTS;
  const pharmacy = DEPARTMENTS.find(({ id }) => id === 'pharmacie')!;

  it('shows the room name, then the first product of the market, on the software sheet', () => {
    assert.deepEqual(stationRows(gam!).logiciels, [
      { kind: 'name', text: 'Accueil / Admissions' },
      { kind: 'detail', text: 'M-GAM' },
    ]);
  });

  it('shows the first two data entities on the data sheet', () => {
    assert.deepEqual(stationRows(gam!).donnees.map(({ text }) => text), ['Identité patient', 'Venue / séjour']);
  });

  it('shows the first network zone, in French, on the network sheet', () => {
    assert.deepEqual(stationRows(gam!).reseau.map(({ text }) => text), ['Postes utilisateurs']);
  });

  it('leaves out the room name when it repeats the acronym', () => {
    assert.equal(pharmacy.acronym, pharmacy.roomName);
    assert.deepEqual(stationRows(pharmacy).logiciels.map(({ kind }) => kind), ['detail']);
  });

  it('gives every service a row on every sheet', () => {
    for (const department of DEPARTMENTS) {
      for (const rows of Object.values(stationRows(department))) assert.ok(rows.length > 0, department.id);
    }
  });
});

describe('uniqueTransports', () => {
  it('lists each transport once, in order of first use, skipping flows without one', () => {
    assert.deepEqual(
      uniqueTransports([{ transport: 'DICOM' }, {}, { transport: 'MLLP' }, { transport: 'DICOM' }]),
      ['DICOM', 'MLLP'],
    );
  });
});

describe('labels', () => {
  it('writes the zone and transport labels in French', () => {
    const english = /\b(the|and|with|from|servers?|workstations?|devices?)\b/i;
    const texts = [
      ...Object.values(ZONE_LABELS),
      ...Object.values(TRANSPORT_DETAILS).flatMap(({ description, ports }) => [description, ports]),
    ];
    for (const text of texts) assert.doesNotMatch(text, english, text);
  });

  it('gives every transport used by a flow a description and a port', () => {
    const flows = DEPARTMENTS.flatMap(({ flows: direct, network }) => [...direct, ...network.externalFlows]);
    for (const transport of uniqueTransports(flows)) {
      const { description, ports } = TRANSPORT_DETAILS[transport];
      assert.ok(description.length > 0 && ports.length > 0, transport);
    }
  });

  it('gives every zone used by a department a French label', () => {
    for (const { network } of DEPARTMENTS) {
      for (const zone of [...network.zones, ...network.externalFlows.map(({ zone: passage }) => passage)]) {
        assert.ok((ZONE_LABELS[zone] ?? '').length > 0, zone);
      }
    }
  });

  it('uses the IANA ports for MLLP, DICOM, HTTPS and SMTP submission', () => {
    assert.match(TRANSPORT_DETAILS.MLLP.ports, /2575/);
    assert.match(TRANSPORT_DETAILS.DICOM.ports, /104.*11112/);
    assert.match(TRANSPORT_DETAILS.HTTPS.ports, /443/);
    assert.match(TRANSPORT_DETAILS.SMTP.ports, /587/);
  });
});
