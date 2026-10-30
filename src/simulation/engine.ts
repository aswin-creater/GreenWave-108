import {
  Ambulance,
  Intersection,
  PriorityRequestMessage,
  PriorityResponseMessage,
  SignalPhaseType,
  Vehicle,
  VehicleType,
} from '../types';

export const CANVAS_WIDTH = 1100;
export const CANVAS_HEIGHT = 440;
export const CORRIDOR_Y = 220; // Main East-West thoroughfare

export const DEFAULT_INTERSECTIONS: Omit<Intersection, 'phaseTimer' | 'corridorLightColor' | 'crossLightColor' | 'priorityStatus' | 'manualOverrideActive' | 'corridorQueue' | 'crossQueue' | 'totalCrossWaitSeconds'>[] = [
  {
    id: 'INT-1',
    name: 'MG Road Junction',
    x: 180,
    y: CORRIDOR_Y,
    corridorOrder: 0,
    cycleLength: 60,
    nsGreenDuration: 28,
    nsAmberDuration: 4,
    ewGreenDuration: 24,
    ewAmberDuration: 4,
    currentPhase: 'N_S_GREEN',
  },
  {
    id: 'INT-2',
    name: 'Brigade Cross',
    x: 390,
    y: CORRIDOR_Y,
    corridorOrder: 1,
    cycleLength: 64,
    nsGreenDuration: 30,
    nsAmberDuration: 4,
    ewGreenDuration: 26,
    ewAmberDuration: 4,
    currentPhase: 'E_W_GREEN',
  },
  {
    id: 'INT-3',
    name: 'Residency Roundabout',
    x: 620,
    y: CORRIDOR_Y,
    corridorOrder: 2,
    cycleLength: 70,
    nsGreenDuration: 34,
    nsAmberDuration: 4,
    ewGreenDuration: 28,
    ewAmberDuration: 4,
    currentPhase: 'N_S_GREEN',
  },
  {
    id: 'INT-4',
    name: 'Hosur Link Junction',
    x: 860,
    y: CORRIDOR_Y,
    corridorOrder: 3,
    cycleLength: 60,
    nsGreenDuration: 28,
    nsAmberDuration: 4,
    ewGreenDuration: 24,
    ewAmberDuration: 4,
    currentPhase: 'E_W_GREEN',
  },
];

export function createInitialIntersections(): Intersection[] {
  return DEFAULT_INTERSECTIONS.map((item, idx) => {
    // Stagger phase offsets so not all lights are synchronized identically
    const initialPhase: SignalPhaseType = idx % 2 === 0 ? 'N_S_GREEN' : 'E_W_GREEN';
    const isCorridorGreen = initialPhase === 'E_W_GREEN';
    return {
      ...item,
      phaseTimer: (idx * 11) % item.cycleLength,
      currentPhase: initialPhase,
      corridorLightColor: isCorridorGreen ? 'GREEN' : 'RED',
      crossLightColor: isCorridorGreen ? 'RED' : 'GREEN',
      priorityStatus: 'NONE',
      manualOverrideActive: false,
      corridorQueue: 3 + (idx % 3),
      crossQueue: 5 + (idx * 2),
      totalCrossWaitSeconds: 0,
    };
  });
}

export function createInitialAmbulance(startRunType: 'BASELINE' | 'PRIORITY' = 'PRIORITY'): Ambulance {
  return {
    id: 'AMB-108',
    name: 'Emergency LifeSupport 108',
    plate: 'KA-01-EA-9921',
    x: 20,
    y: CORRIDOR_Y,
    targetX: CANVAS_WIDTH - 30,
    targetY: CORRIDOR_Y,
    progressPercent: 0,
    speedKmph: 45,
    headingDeg: 90,
    urgency: startRunType === 'PRIORITY' ? 'CRITICAL' : 'IDLE',
    isPriorityActive: startRunType === 'PRIORITY',
    currentIntersectionIndex: 0,
    totalTripTimeSec: 0,
    totalRedWaitTimeSec: 0,
    isFinished: false,
    routeId: 'CORRIDOR-GREEN-ALPHA',
    activePath: [
      { x: 20, y: CORRIDOR_Y },
      { x: 180, y: CORRIDOR_Y },
      { x: 390, y: CORRIDOR_Y },
      { x: 620, y: CORRIDOR_Y },
      { x: 860, y: CORRIDOR_Y },
      { x: CANVAS_WIDTH - 30, y: CORRIDOR_Y },
    ],
  };
}

/**
 * Calculates Estimated Time of Arrival (ETA in seconds) to an intersection.
 */
export function calculateETA(ambulanceX: number, intersectionX: number, speedPxPerSec: number): number {
  const dist = intersectionX - ambulanceX;
  if (dist <= 0) return 0;
  if (speedPxPerSec <= 0) return 999;
  return Math.round((dist / speedPxPerSec) * 10) / 10;
}

/**
 * Decision Engine for Priority Request Messages
 */
export function evaluatePriorityRequest(
  request: PriorityRequestMessage,
  intersection: Intersection
): PriorityResponseMessage {
  const timestamp = new Date().toISOString();

  if (intersection.manualOverrideActive) {
    return {
      type: 'PRIORITY_RESPONSE',
      requestId: request.requestId,
      intersectionId: intersection.id,
      status: 'REJECTED',
      reason: 'Manual operator override currently active at intersection.',
      timestamp,
    };
  }

  if (request.urgency === 'IDLE') {
    return {
      type: 'PRIORITY_RESPONSE',
      requestId: request.requestId,
      intersectionId: intersection.id,
      status: 'REJECTED',
      reason: 'Ambulance status is IDLE; normal signal cycle maintained.',
      timestamp,
    };
  }

  // Calculate timing for Green Wave
  const eta = request.estimatedArrivalTimeSec;
  // Give green starting slightly before ETA to clear queued vehicles ahead
  const startInSec = Math.max(0, Math.floor(eta - 6));
  const durationSec = request.urgency === 'CRITICAL' ? 24 : 16;

  return {
    type: 'PRIORITY_RESPONSE',
    requestId: request.requestId,
    intersectionId: intersection.id,
    status: 'ACCEPTED',
    greenWindow: {
      startInSec,
      durationSec,
    },
    timestamp,
  };
}

/**
 * Advance signal state for one simulated second
 */
export function tickIntersection(
  intersection: Intersection,
  dt: number = 1
): Intersection {
  const next = { ...intersection };
  next.phaseTimer += dt;

  // If in AmbuWave Priority Active mode
  if (next.priorityStatus === 'ACTIVE') {
    next.corridorLightColor = 'GREEN';
    next.crossLightColor = 'RED';
    next.currentPhase = 'PRIORITY_CORRIDOR_GREEN';

    // Accumulate delay for cross traffic held at red
    next.totalCrossWaitSeconds += next.crossQueue * dt;

    if (next.priorityLockedUntil !== undefined && next.phaseTimer >= next.priorityLockedUntil) {
      // Transition to recovery
      next.priorityStatus = 'RECOVERY';
      next.currentPhase = 'PRIORITY_CLEARING';
      next.phaseTimer = 0;
    }
    return next;
  }

  if (next.priorityStatus === 'RECOVERY') {
    // 3 seconds amber recovery for corridor, then resume regular cycle
    if (next.phaseTimer < 3) {
      next.corridorLightColor = 'AMBER';
      next.crossLightColor = 'RED';
    } else {
      next.priorityStatus = 'NONE';
      next.currentPhase = 'N_S_GREEN'; // Let cross traffic clear
      next.corridorLightColor = 'RED';
      next.crossLightColor = 'GREEN';
      next.phaseTimer = 0;
    }
    return next;
  }

  // Standard cycle management
  // N_S Green -> N_S Amber -> E_W Green (Corridor) -> E_W Amber
  const { nsGreenDuration, nsAmberDuration, ewGreenDuration, ewAmberDuration } = next;

  switch (next.currentPhase) {
    case 'N_S_GREEN':
      if (next.phaseTimer >= nsGreenDuration) {
        next.currentPhase = 'N_S_AMBER';
        next.corridorLightColor = 'RED';
        next.crossLightColor = 'AMBER';
        next.phaseTimer = 0;
      } else {
        next.corridorLightColor = 'RED';
        next.crossLightColor = 'GREEN';
      }
      break;

    case 'N_S_AMBER':
      if (next.phaseTimer >= nsAmberDuration) {
        next.currentPhase = 'E_W_GREEN';
        next.corridorLightColor = 'GREEN';
        next.crossLightColor = 'RED';
        next.phaseTimer = 0;
      } else {
        next.corridorLightColor = 'RED';
        next.crossLightColor = 'AMBER';
      }
      break;

    case 'E_W_GREEN':
      next.totalCrossWaitSeconds += next.crossQueue * dt;
      if (next.phaseTimer >= ewGreenDuration) {
        next.currentPhase = 'E_W_AMBER';
        next.corridorLightColor = 'AMBER';
        next.crossLightColor = 'RED';
        next.phaseTimer = 0;
      } else {
        next.corridorLightColor = 'GREEN';
        next.crossLightColor = 'RED';
      }
      break;

    case 'E_W_AMBER':
      if (next.phaseTimer >= ewAmberDuration) {
        next.currentPhase = 'N_S_GREEN';
        next.corridorLightColor = 'RED';
        next.crossLightColor = 'GREEN';
        next.phaseTimer = 0;
      } else {
        next.corridorLightColor = 'AMBER';
        next.crossLightColor = 'RED';
      }
      break;

    default:
      next.currentPhase = 'N_S_GREEN';
      next.corridorLightColor = 'RED';
      next.crossLightColor = 'GREEN';
      next.phaseTimer = 0;
      break;
  }

  return next;
}

/**
 * Calculates comparative simulation metrics
 */
export function calculateComparisonMetrics(
  baseline: { ambulanceTripTimeSec?: number; tripTimeSec?: number; ambulanceRedWaitTimeSec?: number; redWaitSec?: number; totalCrossTrafficDelaySec?: number; crossDelaySec?: number },
  priority: { ambulanceTripTimeSec?: number; tripTimeSec?: number; ambulanceRedWaitTimeSec?: number; redWaitSec?: number; totalCrossTrafficDelaySec?: number; crossDelaySec?: number; priorityRequestsSent?: number; requestsSent?: number; priorityRequestsAccepted?: number; requestsAccepted?: number }
) {
  const baseTripTime = baseline.ambulanceTripTimeSec ?? baseline.tripTimeSec ?? 0;
  const prioTripTime = priority.ambulanceTripTimeSec ?? priority.tripTimeSec ?? 0;
  const baseRedWait = baseline.ambulanceRedWaitTimeSec ?? baseline.redWaitSec ?? 0;
  const prioRedWait = priority.ambulanceRedWaitTimeSec ?? priority.redWaitSec ?? 0;
  const baseCrossDelay = baseline.totalCrossTrafficDelaySec ?? baseline.crossDelaySec ?? 0;
  const prioCrossDelay = priority.totalCrossTrafficDelaySec ?? priority.crossDelaySec ?? 0;
  const reqSent = priority.priorityRequestsSent ?? priority.requestsSent ?? 0;
  const reqAccepted = priority.priorityRequestsAccepted ?? priority.requestsAccepted ?? 0;

  const timeSavedSec = Math.max(0, baseTripTime - prioTripTime);
  const timeSavedPercent = baseTripTime > 0 ? Math.round((timeSavedSec / baseTripTime) * 100) : 0;
  const redWaitReductionSec = Math.max(0, baseRedWait - prioRedWait);
  const extraCrossDelaySec = Math.max(0, prioCrossDelay - baseCrossDelay);
  
  // Fairness ratio: seconds of ambulance saved per extra second imposed on cross traffic
  const fairnessRatio = extraCrossDelaySec > 0 
    ? Math.round((timeSavedSec / (extraCrossDelaySec / 10)) * 100) / 100
    : timeSavedSec > 0 ? 5.0 : 1.0;

  const hitRatePercent = reqSent > 0
    ? Math.round((reqAccepted / reqSent) * 100)
    : 100;

  return {
    timeSavedSec,
    timeSavedPercent,
    redWaitReductionSec,
    extraCrossDelaySec,
    fairnessRatio,
    hitRatePercent,
  };
}

/**
 * Spawns a background vehicle for Indian traffic simulation
 */
export function spawnRandomVehicle(intersection: Intersection, idCounter: number): Vehicle {
  const types: VehicleType[] = ['AUTO_RICKSHAW', 'MOTORBIKE', 'CAR', 'BUS'];
  const typeWeights = [0.35, 0.35, 0.20, 0.10]; // Characteristic Indian city modal split
  const rand = Math.random();
  let cumulative = 0;
  let selectedType: VehicleType = 'CAR';
  for (let i = 0; i < types.length; i++) {
    cumulative += typeWeights[i];
    if (rand <= cumulative) {
      selectedType = types[i];
      break;
    }
  }

  // Cross street traffic runs North to South or South to North
  const fromNorth = Math.random() > 0.5;
  const startY = fromNorth ? 20 : CANVAS_HEIGHT - 20;
  const dir = fromNorth ? 'S' : 'N';

  const colorMap: Record<VehicleType, string[]> = {
    AUTO_RICKSHAW: ['#facc15', '#eab308'], // Iconic yellow & green/black autos
    MOTORBIKE: ['#38bdf8', '#ef4444', '#10b981'],
    CAR: ['#e2e8f0', '#94a3b8', '#64748b', '#dc2626'],
    BUS: ['#ea580c', '#3b82f6'], // BMTC / state transport colors
  };

  const colors = colorMap[selectedType];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return {
    id: `veh-${idCounter}-${Math.random().toString(36).slice(2, 6)}`,
    type: selectedType,
    x: intersection.x + (fromNorth ? -12 : 12),
    y: startY,
    direction: dir,
    targetIntersectionId: intersection.id,
    speed: selectedType === 'MOTORBIKE' ? 3.2 : selectedType === 'AUTO_RICKSHAW' ? 2.5 : selectedType === 'BUS' ? 1.8 : 2.8,
    maxSpeed: 3.5,
    isQueued: false,
    queuedDurationSec: 0,
    color,
    isDetouring: false,
    isUturning: Math.random() > 0.75, // Some vehicles take U-turn bays
  };
}

/**
 * Ensures roads always have moving traffic even after vehicles exit the viewport
 */
export function replenishTrafficIfSparse(
  currentVehicles: Vehicle[],
  intersections: Intersection[],
  idCounterRef: { current: number },
  minVehicles: number = 10
): Vehicle[] {
  if (currentVehicles.length >= minVehicles) return currentVehicles;

  const toAdd = minVehicles - currentVehicles.length;
  const newVehicles: Vehicle[] = [...currentVehicles];

  for (let i = 0; i < toAdd; i++) {
    const randomInt = intersections[Math.floor(Math.random() * intersections.length)];
    idCounterRef.current++;
    newVehicles.push(spawnRandomVehicle(randomInt, idCounterRef.current));
  }

  return newVehicles;
}

/**
 * Evaluates whether vehicle needs to redirect due to construction work ahead
 */
export function shouldRedirectForConstruction(
  vehicleX: number,
  vehicleY: number,
  constructionZone: { active: boolean; x: number; z: number }
): boolean {
  if (!constructionZone.active) return false;
  // Normalized comparison
  const normX = ((vehicleX - 20) / 1060) * 480 - 180;
  return Math.abs(normX - constructionZone.x) < 35 && Math.abs(vehicleY - CORRIDOR_Y) < 35;
}

