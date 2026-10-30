import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateETA,
  evaluatePriorityRequest,
  tickIntersection,
  calculateComparisonMetrics,
  createInitialIntersections,
  createInitialAmbulance,
  replenishTrafficIfSparse,
  shouldRedirectForConstruction,
} from './engine';
import { PriorityRequestMessage } from '../types';

test('calculateETA computes correct seconds based on distance and speed', () => {
  const eta = calculateETA(100, 300, 50); // dist = 200, speed = 50 => 4s
  assert.equal(eta, 4);

  const etaZero = calculateETA(300, 300, 50);
  assert.equal(etaZero, 0);

  const etaPast = calculateETA(350, 300, 50);
  assert.equal(etaPast, 0);
});

test('evaluatePriorityRequest accepts CRITICAL requests with optimal green window', () => {
  const intersections = createInitialIntersections();
  const target = intersections[0];

  const req: PriorityRequestMessage = {
    type: 'PRIORITY_REQUEST',
    requestId: 'REQ-TEST-1',
    ambulanceId: 'AMB-108',
    urgency: 'CRITICAL',
    currentLocation: { x: 50, y: 220 },
    speedKmph: 50,
    routeId: 'ROUTE-1',
    targetIntersectionId: target.id,
    targetIntersectionName: target.name,
    estimatedArrivalTimeSec: 35,
    timestamp: new Date().toISOString(),
  };

  const response = evaluatePriorityRequest(req, target);
  assert.equal(response.status, 'ACCEPTED');
  assert.equal(response.greenWindow?.startInSec, 29); // 35 - 6
  assert.equal(response.greenWindow?.durationSec, 24);
});

test('evaluatePriorityRequest rejects IDLE urgency or manual override', () => {
  const intersections = createInitialIntersections();
  const target = intersections[0];

  const idleReq: PriorityRequestMessage = {
    type: 'PRIORITY_REQUEST',
    requestId: 'REQ-TEST-IDLE',
    ambulanceId: 'AMB-108',
    urgency: 'IDLE',
    currentLocation: { x: 50, y: 220 },
    speedKmph: 20,
    routeId: 'ROUTE-1',
    targetIntersectionId: target.id,
    targetIntersectionName: target.name,
    estimatedArrivalTimeSec: 30,
    timestamp: new Date().toISOString(),
  };

  const idleResp = evaluatePriorityRequest(idleReq, target);
  assert.equal(idleResp.status, 'REJECTED');

  const lockedTarget = { ...target, manualOverrideActive: true };
  const lockedResp = evaluatePriorityRequest({ ...idleReq, urgency: 'CRITICAL' }, lockedTarget);
  assert.equal(lockedResp.status, 'REJECTED');
  assert.match(lockedResp.reason || '', /override/i);
});

test('tickIntersection advances signal states and handles priority holding', () => {
  const intersections = createInitialIntersections();
  const int1 = { ...intersections[0], currentPhase: 'E_W_GREEN' as const, phaseTimer: 23, ewGreenDuration: 24 };
  
  // At timer = 23 + 1 = 24, reaches ewGreenDuration and transitions immediately to E_W_AMBER
  const ticked = tickIntersection(int1, 1);
  assert.equal(ticked.currentPhase, 'E_W_AMBER');
  assert.equal(ticked.corridorLightColor, 'AMBER');
  assert.equal(ticked.phaseTimer, 0);

  // When priority status is ACTIVE, corridor is forced GREEN and cross is RED
  const priorityInt = { ...intersections[0], priorityStatus: 'ACTIVE' as const, phaseTimer: 5, priorityLockedUntil: 10 };
  const activeTicked = tickIntersection(priorityInt, 1);
  assert.equal(activeTicked.corridorLightColor, 'GREEN');
  assert.equal(activeTicked.crossLightColor, 'RED');
  assert.equal(activeTicked.currentPhase, 'PRIORITY_CORRIDOR_GREEN');
});

test('calculateComparisonMetrics computes time saved and fairness correctly', () => {
  const baseline = { tripTimeSec: 180, redWaitSec: 75, crossDelaySec: 120, maxQueue: 14 };
  const priority = { tripTimeSec: 85, redWaitSec: 0, crossDelaySec: 155, maxQueue: 18, requestsSent: 4, requestsAccepted: 4 };

  const comp = calculateComparisonMetrics(baseline, priority);
  assert.equal(comp.timeSavedSec, 95);
  assert.equal(comp.timeSavedPercent, 53);
  assert.equal(comp.redWaitReductionSec, 75);
  assert.equal(comp.hitRatePercent, 100);
  assert.ok(comp.fairnessRatio > 0);
});

test('replenishTrafficIfSparse spawns vehicles when count drops below threshold', () => {
  const intersections = createInitialIntersections();
  const counter = { current: 10 };
  const replenished = replenishTrafficIfSparse([], intersections, counter, 12);
  assert.equal(replenished.length, 12);
  assert.equal(counter.current, 22);

  // Does not over-replenish if already sufficient
  const unchanged = replenishTrafficIfSparse(replenished, intersections, counter, 10);
  assert.equal(unchanged.length, 12);
});

test('shouldRedirectForConstruction flags vehicles near active construction barricade', () => {
  const constructionZone = { active: true, x: 0, z: 0 };
  // Vehicle near center of MG road corridor at x = 550, y = 220 => normX approx 60
  assert.equal(shouldRedirectForConstruction(420, 220, constructionZone), true);

  // Inactive construction zone
  assert.equal(shouldRedirectForConstruction(420, 220, { ...constructionZone, active: false }), false);

  // Far away from zone
  assert.equal(shouldRedirectForConstruction(80, 220, constructionZone), false);
});

