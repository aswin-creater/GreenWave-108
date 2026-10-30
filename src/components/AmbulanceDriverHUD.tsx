import React, { useState, useEffect } from 'react';
import {
  Ambulance,
  Intersection,
  AmbulanceUrgency,
} from '../types';
import { audioService } from '../simulation/audioService';
import {
  Siren,
  Compass,
  Zap,
  Navigation,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Radio,
  Flame,
  ShieldAlert,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

interface AmbulanceDriverHUDProps {
  ambulance: Ambulance;
  intersections: Intersection[];
  onUrgencyChange: (urgency: AmbulanceUrgency) => void;
  runType: 'BASELINE' | 'PRIORITY';
  constructionActive?: boolean;
  isInfiniteMode?: boolean;
  infiniteLaps?: number;
  totalDistanceKm?: number;
}

export const AmbulanceDriverHUD: React.FC<AmbulanceDriverHUDProps> = ({
  ambulance,
  intersections,
  onUrgencyChange,
  runType,
  constructionActive = false,
  isInfiniteMode = true,
  infiniteLaps = 1,
  totalDistanceKm = 2.4,
}) => {
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [signalAlertsEnabled, setSignalAlertsEnabled] = useState(true);

  // Toggle mode sound playback
  const handleToggleSiren = () => {
    if (sirenPlaying) {
      audioService.stopAllSounds();
      setSirenPlaying(false);
    } else {
      audioService.playModeAudio(ambulance.urgency, 0.13);
      setSirenPlaying(true);
    }
  };

  const handleModeSelect = (mode: AmbulanceUrgency) => {
    onUrgencyChange(mode);
    if (sirenPlaying) {
      audioService.playModeAudio(mode, 0.13);
    }
  };

  const handleHornBlast = () => {
    audioService.playHornBurst();
  };

  const nextIntersection =
    intersections[ambulance.currentIntersectionIndex] || intersections[intersections.length - 1];
  const distanceToNext = Math.max(0, Math.round(nextIntersection.x - ambulance.x));
  const etaSeconds = ambulance.speedKmph > 0 ? Math.max(1, Math.round(distanceToNext / 12)) : 0;

  // Track previous priority status to trigger affirmative chime
  useEffect(() => {
    if (!signalAlertsEnabled) return;
    if (runType === 'PRIORITY' && nextIntersection?.priorityStatus === 'ACTIVE') {
      audioService.playGreenWaveLockedChime();
    } else if (runType === 'BASELINE' && nextIntersection?.corridorLightColor === 'RED' && distanceToNext < 80 && distanceToNext > 30) {
      audioService.playRedLightCautionAlert();
    }
  }, [nextIntersection?.priorityStatus, nextIntersection?.corridorLightColor, signalAlertsEnabled]);

  // Clean up siren on unmount
  useEffect(() => {
    return () => {
      audioService.stopAllSounds();
    };
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-white max-w-md mx-auto select-none">
      {/* Mobile Smartphone Frame Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center">
            <Siren className={`w-4 h-4 text-red-500 ${sirenPlaying ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight">AmbuWave Driver Terminal</h3>
            <p className="text-[11px] text-slate-400 font-mono">108 Unit: {ambulance.plate}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Signal alert audio toggle on the phone */}
          <button
            onClick={() => {
              const next = !signalAlertsEnabled;
              setSignalAlertsEnabled(next);
              if (next) audioService.playSignalApproachChime();
            }}
            className={`p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 ${
              signalAlertsEnabled
                ? 'bg-cyan-950/80 border-cyan-600/60 text-cyan-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title="Signal Approaching Alerts Audio"
          >
            {signalAlertsEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            <span className="text-[10px] font-bold">Signal Chimes</span>
          </button>

          {/* Authentic Ambulance Emergency Siren Button */}
          <button
            onClick={handleToggleSiren}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 shadow ${
              sirenPlaying
                ? 'bg-red-600 border-red-400 text-white animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle mode emergency sound (Critical Yelp, On-Call Hi-Lo, or Engine Idle)"
          >
            <Siren className="w-3.5 h-3.5" />
            <span>{sirenPlaying ? 'Sound ON' : 'Mode Sound'}</span>
          </button>

          {/* Air Horn Burst Button */}
          <button
            onClick={handleHornBlast}
            className="px-2 py-1.5 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-white font-bold text-xs transition-all border border-amber-400 shadow flex items-center gap-1"
            title="Emergency Air Horn Blast to clear crossroads"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Horn</span>
          </button>
        </div>
      </div>

      {/* Main Cockpit Speedometer & Direction */}
      <div className="my-4 grid grid-cols-2 gap-3">
        {/* Speedometer */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Vehicle Speed
          </span>
          <div className="text-4xl font-black text-white tracking-tighter mt-1">
            {Math.round(ambulance.speedKmph)}
            <span className="text-xs text-emerald-400 font-semibold ml-1">km/h</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (ambulance.speedKmph / 80) * 100)}%` }}
            />
          </div>
        </div>

        {/* GPS Heading & Status */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Corridor Heading
          </span>
          <div className="flex items-center gap-2 mt-1">
            <Compass className="w-5 h-5 text-cyan-400" />
            <span className="text-2xl font-bold text-white">East (090°)</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-2">
            Lat 12.9716 • Lon 77.5946
          </span>
        </div>
      </div>

      {/* Infinite Never-Ending Road Telemetry Card */}
      {isInfiniteMode && (
        <div className="mb-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Zap className="w-4 h-4 animate-pulse" />
            </span>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Infinite 3D Road Active</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-300 font-mono">
                  Never Ending
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/80">Continuous arterial priority loop</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-emerald-400 font-semibold block uppercase">Loop Lap {infiniteLaps}</span>
            <span className="font-mono text-xs font-bold text-white">{totalDistanceKm.toFixed(1)} km</span>
          </div>
        </div>
      )}

      {/* Construction Detour Warning in Driver HUD */}
      {constructionActive && (
        <div className="mb-4 bg-amber-950/80 border border-amber-600/80 rounded-2xl p-3 flex items-start gap-2.5 shadow-md">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <strong className="block text-white font-bold">Roadwork Ahead at Brigade Road:</strong>
            Emergency corridor auto-rerouted via bypass lane. Dynamic clearance window updated.
          </div>
        </div>
      )}

      {/* Green Wave Status Card */}
      <div
        className={`rounded-2xl p-4 border transition-all mb-4 ${
          runType === 'PRIORITY'
            ? 'bg-gradient-to-br from-emerald-950/80 to-slate-950 border-emerald-500/50 shadow-lg shadow-emerald-950/40'
            : 'bg-slate-950/90 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap
              className={`w-5 h-5 ${
                runType === 'PRIORITY' ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
              }`}
            />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {runType === 'PRIORITY' ? 'AmbuWave V2X Link' : 'Baseline (No V2X)'}
            </span>
          </div>

          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
              runType === 'PRIORITY'
                ? nextIntersection.priorityStatus === 'ACTIVE'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-emerald-900/60 text-emerald-300'
                : 'bg-rose-950/80 text-rose-300'
            }`}
          >
            {runType === 'PRIORITY'
              ? nextIntersection.priorityStatus === 'ACTIVE'
                ? 'GREEN WAVE LOCKED'
                : 'SYNCHRONIZING'
              : 'OFFLINE'}
          </span>
        </div>

        {/* Upcoming Intersection Info */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">NEXT INTERSECTION</span>
            <p className="text-sm font-bold text-white">{nextIntersection.name}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-semibold block">APPROACH ETA</span>
            <p className="text-base font-black text-emerald-400 font-mono">{etaSeconds}s</p>
          </div>
        </div>

        {/* Signal state countdown guidance */}
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-300 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                nextIntersection.corridorLightColor === 'GREEN'
                  ? 'bg-emerald-400'
                  : nextIntersection.corridorLightColor === 'AMBER'
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            />
            <span>Signal: {nextIntersection.corridorLightColor}</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {runType === 'PRIORITY'
              ? 'Clearance window held for corridor'
              : 'Wait on normal cycle'}
          </span>
        </div>
      </div>

      {/* Urgency Quick Action Selector */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          <span>Mission Urgency Mode</span>
          <span className="text-emerald-400 font-mono">
            {ambulance.urgency === 'CRITICAL' ? '🔊 108 Yelp Siren' : ambulance.urgency === 'ON_CALL' ? '🔊 Hi-Lo Warning' : '🔊 Engine Idle'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['CRITICAL', 'ON_CALL', 'IDLE'] as AmbulanceUrgency[]).map((level) => (
            <button
              key={level}
              onClick={() => handleModeSelect(level)}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                ambulance.urgency === level
                  ? level === 'CRITICAL'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400'
                    : level === 'ON_CALL'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400'
                    : 'bg-slate-700 text-white'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {level === 'CRITICAL' ? 'CRITICAL' : level === 'ON_CALL' ? 'ON-CALL' : 'IDLE'}
            </button>
          ))}
        </div>
      </div>

      {/* Corridor Route Progress */}
      <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-400">Corridor Route Progress</span>
          <span className="font-mono text-emerald-400 font-bold">
            {Math.round(ambulance.progressPercent)}%
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${ambulance.progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
          <span>Stn 01: Dispatch Origin</span>
          <span>Target: Trauma Emergency Center</span>
        </div>
      </div>
    </div>
  );
};
