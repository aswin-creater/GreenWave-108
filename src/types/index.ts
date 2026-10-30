export type AmbulanceUrgency = 'IDLE' | 'ON_CALL' | 'CRITICAL';

export type SignalPhaseType = 'N_S_GREEN' | 'N_S_AMBER' | 'E_W_GREEN' | 'E_W_AMBER' | 'PRIORITY_CORRIDOR_GREEN' | 'PRIORITY_CLEARING';

export type PriorityStatus = 'NONE' | 'REQUESTED' | 'ACCEPTED' | 'ACTIVE' | 'RECOVERY' | 'REJECTED';

export interface Coordinates {
  x: number;
  y: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface ConstructionZone {
  active: boolean;
  intersectionId: string;
  roadName: string;
  x: number;
  z: number;
  detourAngle: number;
  description: string;
}

export interface Intersection {
  id: string;
  name: string;
  x: number;
  y: number;
  z?: number;
  corridorOrder: number;
  cycleLength: number;
  nsGreenDuration: number;
  nsAmberDuration: number;
  ewGreenDuration: number;
  ewAmberDuration: number;
  currentPhase: SignalPhaseType;
  phaseTimer: number;
  corridorLightColor: 'RED' | 'AMBER' | 'GREEN';
  crossLightColor: 'RED' | 'AMBER' | 'GREEN';
  priorityStatus: PriorityStatus;
  priorityAmbulanceId?: string;
  greenWindowStartInSec?: number;
  greenWindowDurationSec?: number;
  priorityLockedUntil?: number;
  manualOverrideActive: boolean;
  corridorQueue: number;
  crossQueue: number;
  totalCrossWaitSeconds: number;
}

export type VehicleType = 'CAR' | 'AUTO_RICKSHAW' | 'MOTORBIKE' | 'BUS';

export interface Vehicle {
  id: string;
  type: VehicleType;
  x: number;
  y: number;
  z?: number;
  direction: 'E' | 'W' | 'N' | 'S';
  targetIntersectionId: string;
  speed: number;
  maxSpeed: number;
  isQueued: boolean;
  queuedDurationSec: number;
  color: string;
  isDetouring?: boolean;
  isUturning?: boolean;
  turnProgress?: number;
  pathId?: string;
  pathT?: number; // 0 to 1 along curved path
}

export interface Ambulance {
  id: string;
  name: string;
  plate: string;
  x: number;
  y: number;
  z?: number;
  targetX: number;
  targetY: number;
  targetZ?: number;
  progressPercent: number;
  speedKmph: number;
  headingDeg: number;
  urgency: AmbulanceUrgency;
  isPriorityActive: boolean;
  currentIntersectionIndex: number;
  totalTripTimeSec: number;
  totalRedWaitTimeSec: number;
  isFinished: boolean;
  routeId: string;
  activePath: Coordinates[];
  isDetouring?: boolean;
}

export interface PriorityRequestMessage {
  type: 'PRIORITY_REQUEST';
  requestId: string;
  ambulanceId: string;
  urgency: AmbulanceUrgency;
  currentLocation: { x: number; y: number };
  speedKmph: number;
  routeId: string;
  targetIntersectionId: string;
  targetIntersectionName: string;
  estimatedArrivalTimeSec: number;
  timestamp: string;
  isDetourRoute?: boolean;
}

export interface PriorityResponseMessage {
  type: 'PRIORITY_RESPONSE';
  requestId: string;
  intersectionId: string;
  status: 'ACCEPTED' | 'QUEUED' | 'REJECTED';
  reason?: string;
  greenWindow?: {
    startInSec: number;
    durationSec: number;
  };
  timestamp: string;
}

export type ProtocolMessage = PriorityRequestMessage | PriorityResponseMessage | {
  type: 'TELEMETRY_PING' | 'OVERRIDE_EVENT' | 'CLEARANCE_NOTICE' | 'CONSTRUCTION_DETOUR' | 'AUDIO_ALERT';
  [key: string]: any;
};

export interface SimulationMetrics {
  runType: 'BASELINE' | 'PRIORITY';
  ambulanceTripTimeSec: number;
  ambulanceRedWaitTimeSec: number;
  totalCrossTrafficDelaySec: number;
  maxQueueLength: number;
  priorityRequestsSent: number;
  priorityRequestsAccepted: number;
  priorityHitRatePercent: number;
  fairnessRatio: number;
  completedAt?: string;
}

export interface City3DLayout {
  id: string;
  name: string;
  city: string;
  description: string;
  roadCurvePoints: Vector3D[];
  uTurnPoints: Vector3D[];
  intersections: {
    id: string;
    name: string;
    position: Vector3D;
    crossStreet: string;
  }[];
  buildings: {
    x: number;
    z: number;
    width: number;
    depth: number;
    height: number;
    color: string;
    type: 'COMMERCIAL' | 'HOSPITAL' | 'RESIDENTIAL' | 'METRO';
  }[];
}

export interface CorridorScenario {
  id: string;
  name: string;
  city: string;
  description: string;
  totalLengthMeters: number;
  intersections: {
    id: string;
    name: string;
    crossStreet: string;
    distanceMeters: number;
    baseTrafficDensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
}
