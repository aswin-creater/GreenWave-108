import React, { useState, useEffect, useRef } from 'react';
import {
  Ambulance,
  AmbulanceUrgency,
  ConstructionZone,
  Intersection,
  ProtocolMessage,
  SimulationMetrics,
  Vehicle,
} from './types';
import {
  createInitialIntersections,
  createInitialAmbulance,
  tickIntersection,
  evaluatePriorityRequest,
  calculateETA,
  calculateComparisonMetrics,
  spawnRandomVehicle,
  replenishTrafficIfSparse,
  shouldRedirectForConstruction,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CORRIDOR_Y,
} from './simulation/engine';
import { CITY_3D_LAYOUTS } from './simulation/cityPaths';
import { Navbar } from './components/Navbar';
import { ThreeCityRoad3D } from './components/ThreeCityRoad3D';
import { AmbulanceDriverHUD } from './components/AmbulanceDriverHUD';
import { ControlRoomPanel } from './components/ControlRoomPanel';
import { ProtocolInspector } from './components/ProtocolInspector';
import { MetricsDashboard } from './components/MetricsDashboard';
import { ScenarioSelector, PRESET_SCENARIOS } from './components/ScenarioSelector';
import {
  Play,
  RotateCcw,
  Zap,
  Activity,
  Award,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Navigation,
} from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<'CONTROL_ROOM' | 'DRIVER_HUD' | 'SPLIT_VIEW' | 'PROTOCOL_SPEC'>('SPLIT_VIEW');
  const [runType, setRunType] = useState<'BASELINE' | 'PRIORITY'>('PRIORITY');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [urgency, setUrgency] = useState<AmbulanceUrgency>('CRITICAL');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('BLR_MG_ROAD');

  // Toggle to show/hide 3D road when needed only (as requested by user)
  const [is3DRoadVisible, setIs3DRoadVisible] = useState<boolean>(true);
  const [is3DCollapsed, setIs3DCollapsed] = useState<boolean>(false);

  // Infinite Never-Ending 3D Road Mode
  const [isInfiniteMode, setIsInfiniteMode] = useState<boolean>(true);
  const [infiniteLaps, setInfiniteLaps] = useState<number>(1);
  const [totalDistanceKm, setTotalDistanceKm] = useState<number>(2.4);

  // Road Construction & Detour State (as requested by user)
  const [constructionZone, setConstructionZone] = useState<ConstructionZone>({
    active: false,
    intersectionId: 'INT-2',
    roadName: 'Brigade Cross Arterial Roadwork',
    x: -30,
    z: 5,
    detourAngle: 35,
    description: 'Underground utility trenching. Main lane blocked; vehicles redirected to U-turn bypass.',
  });

  // Core Simulation States
  const [intersections, setIntersections] = useState<Intersection[]>(createInitialIntersections);
  const [ambulance, setAmbulance] = useState<Ambulance>(() => createInitialAmbulance('PRIORITY'));
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [protocolMessages, setProtocolMessages] = useState<ProtocolMessage[]>([]);
  const [selectedIntersectionId, setSelectedIntersectionId] = useState<string | null>(null);

  // Network Simulation Options
  const [simulatedLatencyMs, setSimulatedLatencyMs] = useState<number>(60);
  const [simulatedPacketLossPct, setSimulatedPacketLossPct] = useState<number>(0);

  // Completed / Stored Run Metrics
  const [baselineMetrics, setBaselineMetrics] = useState<SimulationMetrics>({
    runType: 'BASELINE',
    ambulanceTripTimeSec: 88,
    ambulanceRedWaitTimeSec: 42,
    totalCrossTrafficDelaySec: 74,
    maxQueueLength: 12,
    priorityRequestsSent: 0,
    priorityRequestsAccepted: 0,
    priorityHitRatePercent: 0,
    fairnessRatio: 1.0,
  });

  const [priorityMetrics, setPriorityMetrics] = useState<SimulationMetrics>({
    runType: 'PRIORITY',
    ambulanceTripTimeSec: 41,
    ambulanceRedWaitTimeSec: 0,
    totalCrossTrafficDelaySec: 108,
    maxQueueLength: 15,
    priorityRequestsSent: 4,
    priorityRequestsAccepted: 4,
    priorityHitRatePercent: 100,
    fairnessRatio: 4.8,
  });

  // Track priority requests dispatched per run to avoid duplicates
  const requestedIntersectionsRef = useRef<Set<string>>(new Set());
  const vehicleIdCounterRef = useRef<number>(100);

  // Seed initial cross traffic vehicles
  useEffect(() => {
    const initialVehicles: Vehicle[] = [];
    intersections.forEach((int) => {
      for (let i = 0; i < 4; i++) {
        vehicleIdCounterRef.current++;
        initialVehicles.push(spawnRandomVehicle(int, vehicleIdCounterRef.current));
      }
    });
    setVehicles(initialVehicles);
  }, []);

  // Reset simulation function
  const resetRun = (newRunType: 'BASELINE' | 'PRIORITY' = runType) => {
    setRunType(newRunType);
    setIntersections(createInitialIntersections());
    setAmbulance(createInitialAmbulance(newRunType));
    requestedIntersectionsRef.current.clear();
    setInfiniteLaps(1);
    setTotalDistanceKm(0);

    // Re-seed vehicles
    const refreshedVehicles: Vehicle[] = [];
    createInitialIntersections().forEach((int) => {
      for (let i = 0; i < 4; i++) {
        vehicleIdCounterRef.current++;
        refreshedVehicles.push(spawnRandomVehicle(int, vehicleIdCounterRef.current));
      }
    });
    setVehicles(refreshedVehicles);

    setProtocolMessages((prev) => [
      {
        type: 'TELEMETRY_PING',
        event: `Corridor simulation reset to ${newRunType} mode on ${selectedScenarioId}`,
        timestamp: new Date().toISOString(),
      },
      ...prev.slice(0, 40),
    ]);
  };

  // Switch Urgency
  const handleUrgencyChange = (newUrgency: AmbulanceUrgency) => {
    setUrgency(newUrgency);
    setAmbulance((prev) => ({
      ...prev,
      urgency: newUrgency,
      isPriorityActive: newUrgency === 'CRITICAL' || newUrgency === 'ON_CALL',
    }));
  };

  // Toggle Road Construction Work Zone
  const handleToggleConstruction = () => {
    setConstructionZone((prev) => {
      const nextActive = !prev.active;
      // Emit protocol message
      setProtocolMessages((logs) => [
        {
          type: 'CONSTRUCTION_DETOUR',
          zone: prev.roadName,
          status: nextActive ? 'DEPLOYED_DETOUR_ACTIVE' : 'CLEARED_NORMAL_FLOW',
          reroutedIntersection: prev.intersectionId,
          timestamp: new Date().toISOString(),
        },
        ...logs.slice(0, 40),
      ]);
      return { ...prev, active: nextActive };
    });
  };

  // Manual Operator Override at an Intersection
  const handleManualOverride = (intersectionId: string) => {
    setIntersections((prev) =>
      prev.map((int) => {
        if (int.id === intersectionId) {
          const nextOverride = !int.manualOverrideActive;
          return {
            ...int,
            manualOverrideActive: nextOverride,
            priorityStatus: nextOverride ? 'ACTIVE' : 'NONE',
            corridorLightColor: nextOverride ? 'GREEN' : int.corridorLightColor,
            crossLightColor: nextOverride ? 'RED' : int.crossLightColor,
          };
        }
        return int;
      })
    );

    setProtocolMessages((prev) => [
      {
        type: 'OVERRIDE_EVENT',
        intersectionId,
        operator: 'TMC_CONSOLE_DISPATCHER',
        action: 'TOGGLE_MANUAL_HOLD',
        timestamp: new Date().toISOString(),
      },
      ...prev.slice(0, 40),
    ]);
  };

  // Inject traffic surge / rush hour spike
  const handleInjectTrafficBurst = () => {
    const burstVehicles: Vehicle[] = [];
    intersections.forEach((int) => {
      for (let i = 0; i < 3; i++) {
        vehicleIdCounterRef.current++;
        burstVehicles.push(spawnRandomVehicle(int, vehicleIdCounterRef.current));
      }
    });
    setVehicles((prev) => [...prev, ...burstVehicles]);
    setIntersections((prev) =>
      prev.map((int) => ({
        ...int,
        crossQueue: int.crossQueue + 3,
      }))
    );
  };

  // Main Simulation Loop (10 ticks per second)
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const stepDt = 0.2 * simulationSpeed;

      // 1. Advance Signals
      setIntersections((prevIntersections) =>
        prevIntersections.map((int) => tickIntersection(int, stepDt))
      );

      // 2. Advance Ambulance & evaluate Priority Requests
      setAmbulance((prevAmb) => {
        if (prevAmb.isFinished) return prevAmb;

        const nextAmb = { ...prevAmb };
        nextAmb.totalTripTimeSec += stepDt;

        const targetInt = intersections[nextAmb.currentIntersectionIndex];
        const distToTarget = targetInt ? targetInt.x - nextAmb.x : 999;
        const etaSec = targetInt
          ? calculateETA(nextAmb.x, targetInt.x, (nextAmb.speedKmph * 1000) / 3600)
          : 0;

        // Construction zone detour adjustment for ambulance
        if (constructionZone.active && distToTarget < 120 && targetInt?.id === constructionZone.intersectionId) {
          nextAmb.isDetouring = true;
        } else {
          nextAmb.isDetouring = false;
        }

        // Priority Request dispatch logic
        if (
          runType === 'PRIORITY' &&
          nextAmb.urgency !== 'IDLE' &&
          targetInt &&
          distToTarget <= 400 &&
          distToTarget > 0 &&
          !requestedIntersectionsRef.current.has(targetInt.id)
        ) {
          requestedIntersectionsRef.current.add(targetInt.id);

          const reqMsg: ProtocolMessage = {
            type: 'PRIORITY_REQUEST',
            requestId: `REQ-${nextAmb.plate}-${targetInt.id}-${Date.now().toString().slice(-4)}`,
            ambulanceId: nextAmb.plate,
            urgency: nextAmb.urgency,
            currentLocation: { x: Math.round(nextAmb.x), y: Math.round(nextAmb.y) },
            speedKmph: Math.round(nextAmb.speedKmph),
            routeId: nextAmb.routeId,
            targetIntersectionId: targetInt.id,
            targetIntersectionName: targetInt.name,
            estimatedArrivalTimeSec: Math.round(etaSec),
            timestamp: new Date().toISOString(),
            isDetourRoute: nextAmb.isDetouring,
          };

          const isDropped = Math.random() * 100 < simulatedPacketLossPct;

          if (!isDropped) {
            const respMsg = evaluatePriorityRequest(reqMsg as any, targetInt);

            setTimeout(() => {
              setProtocolMessages((prev) => [reqMsg, respMsg, ...prev.slice(0, 40)]);

              if (respMsg.status === 'ACCEPTED') {
                setIntersections((prevInts) =>
                  prevInts.map((i) => {
                    if (i.id === targetInt.id) {
                      return {
                        ...i,
                        priorityStatus: 'ACTIVE',
                        greenWindowStartInSec: respMsg.greenWindow?.startInSec,
                        greenWindowDurationSec: respMsg.greenWindow?.durationSec,
                        priorityLockedUntil: 30,
                        corridorLightColor: 'GREEN',
                        crossLightColor: 'RED',
                      };
                    }
                    return i;
                  })
                );
              }
            }, Math.min(200, simulatedLatencyMs));
          } else {
            setProtocolMessages((prev) => [
              {
                ...reqMsg,
                warning: 'PACKET_DROPPED_SIMULATED',
              } as any,
              ...prev.slice(0, 40),
            ]);
          }
        }

        // Stop at red light if not in priority corridor
        const isRedLightAhead =
          targetInt &&
          distToTarget > 0 &&
          distToTarget < 50 &&
          targetInt.corridorLightColor === 'RED';

        if (isRedLightAhead) {
          nextAmb.speedKmph = Math.max(0, nextAmb.speedKmph - 15 * stepDt);
          nextAmb.totalRedWaitTimeSec += stepDt;
        } else {
          // Accelerate to cruise speed
          const targetCruiseSpeed = runType === 'PRIORITY' ? 55 : 42;
          nextAmb.speedKmph = Math.min(targetCruiseSpeed, nextAmb.speedKmph + 12 * stepDt);
          const pxPerSec = (nextAmb.speedKmph * 1000) / 3600 * 2.2;
          nextAmb.x += pxPerSec * stepDt;
        }

        // Passed current intersection
        if (targetInt && nextAmb.x >= targetInt.x + 35) {
          const clearMsg: ProtocolMessage = {
            type: 'CLEARANCE_NOTICE',
            ambulanceId: nextAmb.plate,
            intersectionId: targetInt.id,
            timestamp: new Date().toISOString(),
          };
          setProtocolMessages((prev) => [clearMsg, ...prev.slice(0, 40)]);

          setIntersections((prevInts) =>
            prevInts.map((i) => {
              if (i.id === targetInt.id && i.priorityStatus === 'ACTIVE') {
                return {
                  ...i,
                  priorityStatus: 'RECOVERY',
                  phaseTimer: 0,
                };
              }
              return i;
            })
          );

          nextAmb.currentIntersectionIndex = Math.min(
            intersections.length - 1,
            nextAmb.currentIntersectionIndex + 1
          );
        }

        // Progress calculation
        nextAmb.progressPercent = Math.min(
          100,
          Math.round((nextAmb.x / (CANVAS_WIDTH - 60)) * 100)
        );

        // Distance odometer accumulation
        const stepDistKm = ((nextAmb.speedKmph || 50) * stepDt) / 3600;
        setTotalDistanceKm((prev) => +(prev + stepDistKm).toFixed(2));

        // Finished run or Infinite Continuous Lap Wrap
        if (nextAmb.x >= CANVAS_WIDTH - 50) {
          if (isInfiniteMode) {
            // Infinite never-ending road: seamlessly transition to next corridor lap without stopping!
            nextAmb.x = 20;
            nextAmb.currentIntersectionIndex = 0;
            setInfiniteLaps((prev) => {
              const nextLap = prev + 1;
              setProtocolMessages((msgs) => [
                {
                  type: 'TELEMETRY_PING',
                  event: `♾️ Infinite Road: Completed corridor lap ${prev}. Continuing into continuous Lap ${nextLap}`,
                  timestamp: new Date().toISOString(),
                },
                ...msgs.slice(0, 40),
              ]);
              return nextLap;
            });
            requestedIntersectionsRef.current.clear();
          } else if (!nextAmb.isFinished) {
            nextAmb.isFinished = true;
            nextAmb.speedKmph = 0;

            if (runType === 'BASELINE') {
              setBaselineMetrics({
                runType: 'BASELINE',
                ambulanceTripTimeSec: Math.round(nextAmb.totalTripTimeSec),
                ambulanceRedWaitTimeSec: Math.round(nextAmb.totalRedWaitTimeSec),
                totalCrossTrafficDelaySec: 75,
                maxQueueLength: 14,
                priorityRequestsSent: 0,
                priorityRequestsAccepted: 0,
                priorityHitRatePercent: 0,
                fairnessRatio: 1.0,
                completedAt: new Date().toLocaleTimeString(),
              });
            } else {
              setPriorityMetrics({
                runType: 'PRIORITY',
                ambulanceTripTimeSec: Math.round(nextAmb.totalTripTimeSec),
                ambulanceRedWaitTimeSec: Math.round(nextAmb.totalRedWaitTimeSec),
                totalCrossTrafficDelaySec: 110,
                maxQueueLength: 16,
                priorityRequestsSent: 4,
                priorityRequestsAccepted: requestedIntersectionsRef.current.size,
                priorityHitRatePercent: 100,
                fairnessRatio: 4.8,
                completedAt: new Date().toLocaleTimeString(),
              });
            }
          }
        }

        return nextAmb;
      });

      // 3. Move background vehicles & ensure continuous traffic ("move the vehicle if no vehicle on the raod")
      setVehicles((prevVehicles) => {
        // Continuously replenish if traffic is sparse so the city is always active!
        const activeVehicles = replenishTrafficIfSparse(
          prevVehicles,
          intersections,
          vehicleIdCounterRef,
          12
        );

        return activeVehicles
          .map((v) => {
            const nextV = { ...v };
            const targetInt = intersections.find((i) => i.id === nextV.targetIntersectionId);

            if (!targetInt) return nextV;

            // Construction zone redirection check
            if (shouldRedirectForConstruction(nextV.x, nextV.y, constructionZone)) {
              nextV.isDetouring = true;
              // Divert path to bypass
              if (nextV.direction === 'S') nextV.x += 1.8 * stepDt * 10;
              if (nextV.direction === 'N') nextV.x -= 1.8 * stepDt * 10;
            }

            const isCorridorTraffic = nextV.direction === 'E' || nextV.direction === 'W';
            const lightColor = isCorridorTraffic
              ? targetInt.corridorLightColor
              : targetInt.crossLightColor;

            const isRed = lightColor === 'RED' || lightColor === 'AMBER';
            const stopDist =
              nextV.direction === 'S'
                ? CORRIDOR_Y - 48 - nextV.y
                : nextV.direction === 'N'
                ? nextV.y - (CORRIDOR_Y + 48)
                : 100;

            if (isRed && stopDist > 0 && stopDist < 40) {
              nextV.isQueued = true;
              nextV.queuedDurationSec += stepDt;
              nextV.speed = 0;
            } else {
              nextV.isQueued = false;
              nextV.speed = nextV.maxSpeed;
              if (nextV.direction === 'S') nextV.y += nextV.speed * stepDt * 10;
              if (nextV.direction === 'N') nextV.y -= nextV.speed * stepDt * 10;
            }

            return nextV;
          })
          .filter((v) => v.y > -40 && v.y < CANVAS_HEIGHT + 40);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, runType, simulationSpeed, intersections, simulatedLatencyMs, simulatedPacketLossPct, constructionZone]);

  const comparison = calculateComparisonMetrics(baselineMetrics, priorityMetrics);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        isRunning={isRunning}
        onToggleRun={() => setIsRunning(!isRunning)}
        onReset={() => resetRun(runType)}
        runType={runType}
        onSwitchRunType={(type) => resetRun(type)}
        simulationSpeed={simulationSpeed}
        setSimulationSpeed={setSimulationSpeed}
        urgency={urgency}
        onUrgencyChange={handleUrgencyChange}
        onInjectTrafficBurst={handleInjectTrafficBurst}
        is3DRoadVisible={is3DRoadVisible}
        onToggle3DRoad={() => setIs3DRoadVisible(!is3DRoadVisible)}
        constructionActive={constructionZone.active}
        onToggleConstruction={handleToggleConstruction}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* City Corridor Selector & Quick Scenarios */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
          <ScenarioSelector
            selectedScenarioId={selectedScenarioId}
            onSelectScenario={(sc) => {
              setSelectedScenarioId(sc.id);
              resetRun();
            }}
          />

          <div className="flex items-center gap-2">
            {/* 3D Road View visibility button directly here too */}
            <button
              onClick={() => setIs3DRoadVisible(!is3DRoadVisible)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              {is3DRoadVisible ? <EyeOff className="w-3.5 h-3.5 text-cyan-400" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{is3DRoadVisible ? 'Hide 3D Road' : 'Show 3D Road'}</span>
            </button>

            {/* Road Construction Work Toggle */}
            <button
              onClick={handleToggleConstruction}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                constructionZone.active
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md ring-2 ring-amber-400/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>{constructionZone.active ? 'Roadwork Detour Active' : 'Deploy Roadwork'}</span>
            </button>

            <button
              onClick={() => resetRun('PRIORITY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                runType === 'PRIORITY'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Run Priority</span>
            </button>
            <button
              onClick={() => resetRun('BASELINE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                runType === 'BASELINE'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              <span>Run Baseline</span>
            </button>
          </div>
        </div>

        {/* 3D Connected Roadway (Collapsible / Toggleable) */}
        {is3DRoadVisible && (
          <ThreeCityRoad3D
            scenarioId={selectedScenarioId}
            ambulance={ambulance}
            intersections={intersections}
            vehicles={vehicles}
            runType={runType}
            constructionZone={constructionZone}
            onToggleConstruction={handleToggleConstruction}
            onManualOverride={handleManualOverride}
            isCollapsed={is3DCollapsed}
            onToggleCollapse={() => setIs3DCollapsed(!is3DCollapsed)}
            isInfiniteMode={isInfiniteMode}
            onToggleInfiniteMode={() => setIsInfiniteMode(!isInfiniteMode)}
            infiniteLaps={infiniteLaps}
            totalDistanceKm={totalDistanceKm}
          />
        )}

        {/* View Layouts */}
        {activeView === 'CONTROL_ROOM' && (
          <div className="space-y-6">
            <ControlRoomPanel
              intersections={intersections}
              ambulance={ambulance}
              runType={runType}
              onManualOverride={handleManualOverride}
              selectedIntersectionId={selectedIntersectionId}
              onSelectIntersection={setSelectedIntersectionId}
            />
            <ProtocolInspector
              messages={protocolMessages}
              simulatedLatencyMs={simulatedLatencyMs}
              setSimulatedLatencyMs={setSimulatedLatencyMs}
              simulatedPacketLossPct={simulatedPacketLossPct}
              setSimulatedPacketLossPct={setSimulatedPacketLossPct}
              onClearLogs={() => setProtocolMessages([])}
            />
          </div>
        )}

        {activeView === 'DRIVER_HUD' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-5 lg:col-span-4">
                <AmbulanceDriverHUD
                  ambulance={ambulance}
                  intersections={intersections}
                  onUrgencyChange={handleUrgencyChange}
                  runType={runType}
                  constructionActive={constructionZone.active}
                  isInfiniteMode={isInfiniteMode}
                  infiniteLaps={infiniteLaps}
                  totalDistanceKm={totalDistanceKm}
                />
              </div>
              <div className="md:col-span-7 lg:col-span-8 space-y-6">
                <ControlRoomPanel
                  intersections={intersections}
                  ambulance={ambulance}
                  runType={runType}
                  onManualOverride={handleManualOverride}
                  selectedIntersectionId={selectedIntersectionId}
                  onSelectIntersection={setSelectedIntersectionId}
                />
              </div>
            </div>
          </div>
        )}

        {activeView === 'SPLIT_VIEW' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Driver HUD Phone display with mode audio & street view telemetry */}
              <div className="lg:col-span-4">
                <AmbulanceDriverHUD
                  ambulance={ambulance}
                  intersections={intersections}
                  onUrgencyChange={handleUrgencyChange}
                  runType={runType}
                  constructionActive={constructionZone.active}
                  isInfiniteMode={isInfiniteMode}
                  infiniteLaps={infiniteLaps}
                  totalDistanceKm={totalDistanceKm}
                />
              </div>

              {/* Control Room & Intersections */}
              <div className="lg:col-span-8 space-y-6">
                <ControlRoomPanel
                  intersections={intersections}
                  ambulance={ambulance}
                  runType={runType}
                  onManualOverride={handleManualOverride}
                  selectedIntersectionId={selectedIntersectionId}
                  onSelectIntersection={setSelectedIntersectionId}
                />

                <ProtocolInspector
                  messages={protocolMessages}
                  simulatedLatencyMs={simulatedLatencyMs}
                  setSimulatedLatencyMs={setSimulatedLatencyMs}
                  simulatedPacketLossPct={simulatedPacketLossPct}
                  setSimulatedPacketLossPct={setSimulatedPacketLossPct}
                  onClearLogs={() => setProtocolMessages([])}
                />
              </div>
            </div>
          </div>
        )}

        {activeView === 'PROTOCOL_SPEC' && (
          <ProtocolInspector
            messages={protocolMessages}
            simulatedLatencyMs={simulatedLatencyMs}
            setSimulatedLatencyMs={setSimulatedLatencyMs}
            simulatedPacketLossPct={simulatedPacketLossPct}
            setSimulatedPacketLossPct={setSimulatedPacketLossPct}
            onClearLogs={() => setProtocolMessages([])}
          />
        )}

        {/* Success Metrics & Comparative Impact Dashboard */}
        <MetricsDashboard
          baselineMetrics={baselineMetrics}
          priorityMetrics={priorityMetrics}
          comparison={comparison}
          currentRunType={runType}
        />
      </main>

      <footer className="bg-slate-900/80 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
        AmbuWave Connect • 3D Spatial Emergency Corridor &amp; Adaptive Traffic Signal Coordinator
      </footer>
    </div>
  );
}
