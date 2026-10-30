import { City3DLayout, Vector3D } from '../types';

export const CITY_3D_LAYOUTS: Record<string, City3DLayout> = {
  BLR_MG_ROAD: {
    id: 'BLR_MG_ROAD',
    name: 'Bengaluru MG Road Infinite Arterial Loop',
    city: 'Bengaluru',
    description: 'Continuous never-ending 3D arterial loop: MG Road corridor, Cubbon Park curve, Mayo Hall U-turn, and elevated skyway return.',
    // Closed continuous circuit of 14 points (x, y, z)
    roadCurvePoints: [
      { x: -210, y: 0, z: 0 },    // Start / Cubbon Entry
      { x: -110, y: 0, z: -12 },  // INT-1: MG Road Junction (Kamraj Rd)
      { x: -30, y: 0, z: 6 },     // INT-2: Brigade Cross
      { x: 60, y: 0, z: 24 },     // INT-3: Residency Roundabout (S-bend)
      { x: 170, y: 1, z: -6 },    // INT-4: Hosur Link Junction
      { x: 260, y: 0, z: 2 },     // Victoria Hospital Emergency Bay
      { x: 330, y: 3, z: 25 },    // East Overpass Ramp
      { x: 340, y: 7, z: 75 },    // East High-Speed Flyover Bend
      { x: 250, y: 8, z: 110 },   // Elevated Skyway Return (Westbound)
      { x: 120, y: 8, z: 115 },   // Mid Skyway Span
      { x: -10, y: 7, z: 105 },   // Trinity Skyway Overpass
      { x: -130, y: 4, z: 85 },   // Skyway Descent Ramp
      { x: -210, y: 1, z: 55 },   // Mayo Hall Cloverleaf Connector
      { x: -245, y: 0, z: 22 },   // West U-turn Bay & Return Approach
    ],
    uTurnPoints: [
      { x: 50, y: 0, z: 22 },
      { x: 65, y: 0, z: 42 },
      { x: 80, y: 0, z: 40 },
      { x: 75, y: 0, z: 20 },
    ],
    intersections: [
      { id: 'INT-1', name: 'MG Road Junction', position: { x: -110, y: 0, z: -12 }, crossStreet: 'Kamraj Road' },
      { id: 'INT-2', name: 'Brigade Cross', position: { x: -30, y: 0, z: 6 }, crossStreet: 'Brigade Road' },
      { id: 'INT-3', name: 'Residency Roundabout', position: { x: 60, y: 0, z: 24 }, crossStreet: 'Residency Road' },
      { id: 'INT-4', name: 'Hosur Link Junction', position: { x: 170, y: 1, z: -6 }, crossStreet: 'Hosur Main Road' },
    ],
    buildings: [
      // North side of arterial
      { x: -160, z: -55, width: 36, depth: 32, height: 65, color: '#1e293b', type: 'COMMERCIAL' },
      { x: -90, z: -60, width: 28, depth: 26, height: 50, color: '#334155', type: 'COMMERCIAL' },
      { x: -20, z: -50, width: 34, depth: 30, height: 80, color: '#0f172a', type: 'COMMERCIAL' },
      { x: 50, z: -55, width: 42, depth: 35, height: 95, color: '#1e293b', type: 'COMMERCIAL' },
      { x: 120, z: -50, width: 30, depth: 28, height: 55, color: '#334155', type: 'COMMERCIAL' },
      { x: 190, z: -55, width: 35, depth: 32, height: 70, color: '#1e293b', type: 'COMMERCIAL' },
      // Central Greenbelt / Metro
      { x: -140, z: 50, width: 32, depth: 28, height: 42, color: '#1e293b', type: 'RESIDENTIAL' },
      { x: -80, z: 58, width: 42, depth: 34, height: 55, color: '#334155', type: 'METRO' },
      { x: 10, z: 55, width: 36, depth: 30, height: 75, color: '#1e293b', type: 'COMMERCIAL' },
      { x: 110, z: 55, width: 34, depth: 30, height: 52, color: '#334155', type: 'COMMERCIAL' },
      // Hospital Trauma Destination with Helipad
      { x: 265, z: -25, width: 52, depth: 42, height: 60, color: '#047857', type: 'HOSPITAL' },
      // South Skyway Outer Skyline
      { x: 250, z: 155, width: 44, depth: 38, height: 110, color: '#0f172a', type: 'COMMERCIAL' },
      { x: 130, z: 160, width: 48, depth: 40, height: 125, color: '#1e293b', type: 'COMMERCIAL' },
      { x: -20, z: 150, width: 40, depth: 36, height: 90, color: '#334155', type: 'COMMERCIAL' },
      { x: -140, z: 140, width: 38, depth: 34, height: 75, color: '#1e293b', type: 'RESIDENTIAL' },
    ],
  },

  MUM_WEH: {
    id: 'MUM_WEH',
    name: 'Mumbai Western Express Highway Infinite Circuit',
    city: 'Mumbai',
    description: 'Elevated coastal flyover circuit: Andheri-Bandra expressway, Sea Link bridge overpass, and endless coastal skyway.',
    roadCurvePoints: [
      { x: -210, y: 0, z: -25 },
      { x: -110, y: 4, z: -32 },  // INT-1: Andheri Metro Cross
      { x: -25, y: 7, z: -18 },   // INT-2: Airport Flyover Base
      { x: 65, y: 7, z: 18 },     // INT-3: Bandra Reclamation
      { x: 180, y: 2, z: 26 },    // INT-4: Kalanagar Junction
      { x: 270, y: 0, z: 10 },    // Lilavati Emergency Hospital Bay
      { x: 340, y: 5, z: -20 },   // Sea Link Approach Ramp
      { x: 335, y: 11, z: -85 },  // Bandra-Worli Sea Link High Span
      { x: 220, y: 12, z: -115 }, // Coastal Skyway Return Span
      { x: 90, y: 11, z: -120 },  // Mid Coastal Skyway
      { x: -40, y: 9, z: -110 },  // Mahim Bay Elevated Skyway
      { x: -150, y: 5, z: -85 },  // Skyway Descent
      { x: -225, y: 2, z: -55 },  // Reclamation Cloverleaf Loop
      { x: -240, y: 0, z: -35 },  // Western Highway Seamless Return
    ],
    uTurnPoints: [
      { x: -10, y: 0, z: 10 },
      { x: -15, y: 0, z: 35 },
      { x: 10, y: 0, z: 40 },
      { x: 15, y: 0, z: 12 },
    ],
    intersections: [
      { id: 'INT-1', name: 'Andheri Metro Cross', position: { x: -110, y: 4, z: -32 }, crossStreet: 'Andheri-Kurla Rd' },
      { id: 'INT-2', name: 'Airport Flyover Base', position: { x: -25, y: 7, z: -18 }, crossStreet: 'Terminal Link Rd' },
      { id: 'INT-3', name: 'Bandra Reclamation', position: { x: 65, y: 7, z: 18 }, crossStreet: 'SV Road Cross' },
      { id: 'INT-4', name: 'Kalanagar Junction', position: { x: 180, y: 2, z: 26 }, crossStreet: 'BKC Connector' },
    ],
    buildings: [
      { x: -160, z: -75, width: 40, depth: 36, height: 120, color: '#0f172a', type: 'COMMERCIAL' },
      { x: -80, z: -85, width: 44, depth: 38, height: 140, color: '#1e293b', type: 'COMMERCIAL' },
      { x: 0, z: -70, width: 38, depth: 34, height: 105, color: '#334155', type: 'COMMERCIAL' },
      { x: 80, z: -65, width: 42, depth: 36, height: 150, color: '#0f172a', type: 'COMMERCIAL' },
      { x: 170, z: -70, width: 45, depth: 38, height: 115, color: '#1e293b', type: 'COMMERCIAL' },
      { x: -120, z: 65, width: 36, depth: 32, height: 90, color: '#1e293b', type: 'RESIDENTIAL' },
      { x: -30, z: 75, width: 44, depth: 36, height: 130, color: '#334155', type: 'COMMERCIAL' },
      { x: 90, z: 80, width: 38, depth: 34, height: 100, color: '#1e293b', type: 'COMMERCIAL' },
      { x: 275, z: -15, width: 54, depth: 46, height: 75, color: '#047857', type: 'HOSPITAL' },
      // Coastal Skyline
      { x: 260, z: -160, width: 50, depth: 42, height: 160, color: '#0f172a', type: 'COMMERCIAL' },
      { x: 110, z: -165, width: 46, depth: 40, height: 145, color: '#1e293b', type: 'COMMERCIAL' },
      { x: -60, z: -155, width: 42, depth: 38, height: 130, color: '#334155', type: 'COMMERCIAL' },
    ],
  },

  DEL_RING_ROAD: {
    id: 'DEL_RING_ROAD',
    name: 'Delhi AIIMS Emergency Infinite Boulevard',
    city: 'New Delhi',
    description: 'Endless multi-lane capital boulevard loop: Ring Road, Moolchand underpass, AIIMS Trauma Gate, and Barapullah flyover skyway.',
    roadCurvePoints: [
      { x: -210, y: 0, z: 20 },
      { x: -110, y: 0, z: 32 },   // INT-1: Safdarjung Crossing
      { x: -25, y: 0, z: 18 },    // INT-2: Ring Road Intersection
      { x: 70, y: 0, z: -18 },    // INT-3: Moolchand Flyover Underpass
      { x: 180, y: 0, z: -22 },   // INT-4: AIIMS Trauma Gate
      { x: 270, y: 0, z: 0 },     // AIIMS Emergency Apex
      { x: 330, y: 4, z: -40 },   // Outer Ring Road Overpass
      { x: 335, y: 7, z: -100 },  // Barapullah Skyway Curve
      { x: 210, y: 8, z: -125 },  // Elevated Capital Skyway
      { x: 60, y: 8, z: -120 },   // Central Delhi Flyover
      { x: -70, y: 6, z: -105 },  // Safdarjung Skyway
      { x: -160, y: 3, z: -75 },  // Descent Ramp
      { x: -225, y: 0, z: -35 },  // South Ext U-Turn Interchange
      { x: -240, y: 0, z: -5 },   // Seamless Return to Ring Road
    ],
    uTurnPoints: [
      { x: 120, y: 0, z: -10 },
      { x: 135, y: 0, z: 15 },
      { x: 155, y: 0, z: 10 },
      { x: 145, y: 0, z: -15 },
    ],
    intersections: [
      { id: 'INT-1', name: 'Safdarjung Crossing', position: { x: -110, y: 0, z: 32 }, crossStreet: 'Aurobindo Marg' },
      { id: 'INT-2', name: 'Ring Road Intersection', position: { x: -25, y: 0, z: 18 }, crossStreet: 'Africa Avenue' },
      { id: 'INT-3', name: 'Moolchand Flyover Underpass', position: { x: 70, y: 0, z: -18 }, crossStreet: 'Lajpat Link' },
      { id: 'INT-4', name: 'AIIMS Trauma Gate', position: { x: 180, y: 0, z: -22 }, crossStreet: 'Ring Road Loop' },
    ],
    buildings: [
      { x: -150, z: -60, width: 44, depth: 40, height: 55, color: '#78350f', type: 'COMMERCIAL' },
      { x: -80, z: -55, width: 40, depth: 36, height: 65, color: '#1e293b', type: 'COMMERCIAL' },
      { x: 0, z: -50, width: 48, depth: 42, height: 75, color: '#334155', type: 'COMMERCIAL' },
      { x: 90, z: -65, width: 46, depth: 38, height: 70, color: '#78350f', type: 'COMMERCIAL' },
      { x: -130, z: 75, width: 42, depth: 36, height: 48, color: '#1e293b', type: 'RESIDENTIAL' },
      { x: -40, z: 70, width: 46, depth: 40, height: 58, color: '#334155', type: 'METRO' },
      { x: 60, z: 65, width: 44, depth: 38, height: 65, color: '#1e293b', type: 'COMMERCIAL' },
      { x: 270, z: 25, width: 58, depth: 50, height: 70, color: '#047857', type: 'HOSPITAL' },
      // Northern Capital Government / Tech Blocks
      { x: 220, z: -165, width: 50, depth: 44, height: 85, color: '#78350f', type: 'COMMERCIAL' },
      { x: 80, z: -160, width: 48, depth: 42, height: 95, color: '#1e293b', type: 'COMMERCIAL' },
      { x: -60, z: -155, width: 46, depth: 40, height: 80, color: '#334155', type: 'COMMERCIAL' },
    ],
  },
};

/**
 * Evaluates position and tangent along the continuous closed curved city road at parameter t (0 to 1).
 * Smoothly wraps for infinite endless loops (t can be any real number).
 */
export function getCurvePosition(
  points: Vector3D[],
  t: number,
  closed: boolean = true
): { position: Vector3D; tangent: Vector3D } {
  const n = points.length;
  if (n === 0) {
    return {
      position: { x: 0, y: 0, z: 0 },
      tangent: { x: 1, y: 0, z: 0 },
    };
  }
  if (n === 1) {
    return {
      position: { ...points[0] },
      tangent: { x: 1, y: 0, z: 0 },
    };
  }

  // Seamless wrap for continuous infinite driving
  const normalizedT = ((t % 1) + 1) % 1;
  const totalSegments = closed ? n : n - 1;
  const progress = normalizedT * totalSegments;
  const segment = Math.min(Math.floor(progress), totalSegments - 1);
  const localT = progress - segment;

  const idx0 = segment % n;
  const idx1 = (segment + 1) % n;
  const idxPrev = (segment - 1 + n) % n;
  const idxNext = (segment + 2) % n;

  const p0 = points[idx0];
  const p1 = points[idx1];
  const pPrev = closed ? points[idxPrev] : segment > 0 ? points[segment - 1] : p0;
  const pNextPoint = closed ? points[idxNext] : segment < n - 2 ? points[segment + 2] : p1;

  // Catmull-Rom cubic spline interpolation
  const t2 = localT * localT;
  const t3 = t2 * localT;

  const x =
    0.5 *
    (2 * p0.x +
      (-pPrev.x + p1.x) * localT +
      (2 * pPrev.x - 5 * p0.x + 4 * p1.x - pNextPoint.x) * t2 +
      (-pPrev.x + 3 * p0.x - 3 * p1.x + pNextPoint.x) * t3);

  const y =
    0.5 *
    (2 * p0.y +
      (-pPrev.y + p1.y) * localT +
      (2 * pPrev.y - 5 * p0.y + 4 * p1.y - pNextPoint.y) * t2 +
      (-pPrev.y + 3 * p0.y - 3 * p1.y + pNextPoint.y) * t3);

  const z =
    0.5 *
    (2 * p0.z +
      (-pPrev.z + p1.z) * localT +
      (2 * pPrev.z - 5 * p0.z + 4 * p1.z - pNextPoint.z) * t2 +
      (-pPrev.z + 3 * p0.z - 3 * p1.z + pNextPoint.z) * t3);

  // Tangent derivative calculation
  const dLocalT = 0.001;
  const nextProgress = (normalizedT + dLocalT / totalSegments) % 1;
  const nextTotal = nextProgress * totalSegments;
  const nSeg = Math.min(Math.floor(nextTotal), totalSegments - 1);
  const nLocal = nextTotal - nSeg;

  const n0 = points[nSeg % n];
  const n1 = points[(nSeg + 1) % n];
  const nPrev = closed ? points[(nSeg - 1 + n) % n] : nSeg > 0 ? points[nSeg - 1] : n0;
  const nNext = closed ? points[(nSeg + 2) % n] : nSeg < n - 2 ? points[nSeg + 2] : n1;

  const nt2 = nLocal * nLocal;
  const nt3 = nt2 * nLocal;

  const nx =
    0.5 *
    (2 * n0.x +
      (-nPrev.x + n1.x) * nLocal +
      (2 * nPrev.x - 5 * n0.x + 4 * n1.x - nNext.x) * nt2 +
      (-nPrev.x + 3 * n0.x - 3 * n1.x + nNext.x) * nt3);

  const ny =
    0.5 *
    (2 * n0.y +
      (-nPrev.y + n1.y) * nLocal +
      (2 * nPrev.y - 5 * n0.y + 4 * n1.y - nNext.y) * nt2 +
      (-nPrev.y + 3 * n0.y - 3 * n1.y + nNext.y) * nt3);

  const nz =
    0.5 *
    (2 * n0.z +
      (-nPrev.z + n1.z) * nLocal +
      (2 * nPrev.z - 5 * n0.z + 4 * n1.z - nNext.z) * nt2 +
      (-nPrev.z + 3 * n0.z - 3 * n1.z + nNext.z) * nt3);

  const dx = nx - x;
  const dy = ny - y;
  const dz = nz - z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

  return {
    position: { x, y, z },
    tangent: { x: dx / len, y: dy / len, z: dz / len },
  };
}
