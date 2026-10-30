import React from 'react';
import {
  Siren,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Smartphone,
  LayoutDashboard,
  Columns,
  Code2,
  Zap,
  Activity,
  Flame,
  Box,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { AmbulanceUrgency } from '../types';

interface NavbarProps {
  activeView: 'CONTROL_ROOM' | 'DRIVER_HUD' | 'SPLIT_VIEW' | 'PROTOCOL_SPEC';
  setActiveView: (view: 'CONTROL_ROOM' | 'DRIVER_HUD' | 'SPLIT_VIEW' | 'PROTOCOL_SPEC') => void;
  isRunning: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  runType: 'BASELINE' | 'PRIORITY';
  onSwitchRunType: (type: 'BASELINE' | 'PRIORITY') => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  urgency: AmbulanceUrgency;
  onUrgencyChange: (urgency: AmbulanceUrgency) => void;
  onInjectTrafficBurst: () => void;
  is3DRoadVisible: boolean;
  onToggle3DRoad: () => void;
  constructionActive: boolean;
  onToggleConstruction: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  isRunning,
  onToggleRun,
  onReset,
  runType,
  onSwitchRunType,
  simulationSpeed,
  setSimulationSpeed,
  urgency,
  onUrgencyChange,
  onInjectTrafficBurst,
  is3DRoadVisible,
  onToggle3DRoad,
  constructionActive,
  onToggleConstruction,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 select-none">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & App Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
            <Siren className="w-5 h-5 text-white animate-pulse" />
            {runType === 'PRIORITY' && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                AmbuWave<span className="text-emerald-400 font-extrabold">Connect</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 uppercase tracking-wider">
                3D V2X Priority
              </span>
            </div>
            <p className="text-xs text-slate-400">
              3D Spatial Emergency Corridor, Adaptive Signals &amp; Multi-City Routing
            </p>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveView('CONTROL_ROOM')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'CONTROL_ROOM'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="City Traffic Management Center Control View"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Control Room</span>
          </button>

          <button
            onClick={() => setActiveView('DRIVER_HUD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'DRIVER_HUD'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Ambulance In-Cab Driver Tablet Display"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Driver HUD</span>
          </button>

          <button
            onClick={() => setActiveView('SPLIT_VIEW')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'SPLIT_VIEW'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Side-by-Side Dual View"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Dual View</span>
          </button>

          <button
            onClick={() => setActiveView('PROTOCOL_SPEC')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'PROTOCOL_SPEC'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Open Protocol JSON & API Spec"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Protocol API</span>
          </button>
        </div>

        {/* Feature Toggles & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Button to show/hide 3D road as explicitly asked */}
          <button
            onClick={onToggle3DRoad}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              is3DRoadVisible
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Show or hide the 3D road view as needed"
          >
            {is3DRoadVisible ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{is3DRoadVisible ? '3D Road Shown' : 'Show 3D Road'}</span>
          </button>

          {/* Construction Roadwork Toggle */}
          <button
            onClick={onToggleConstruction}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              constructionActive
                ? 'bg-amber-600/90 border-amber-400 text-white shadow-md'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Deploy road construction zone and redirect vehicle traffic"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">{constructionActive ? 'Roadwork Active' : 'Roadwork'}</span>
          </button>

          {/* Mode Toggle: Priority vs Baseline */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSwitchRunType('PRIORITY')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                runType === 'PRIORITY'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Priority Wave</span>
            </button>
            <button
              onClick={() => onSwitchRunType('BASELINE')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                runType === 'BASELINE'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Activity className="w-3 h-3 text-rose-400" />
              <span>Baseline</span>
            </button>
          </div>

          {/* Play / Pause */}
          <button
            onClick={onToggleRun}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Sim</span>
              </>
            )}
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
            title="Reset Simulation Corridor"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed multiplier */}
          <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 px-1.5 py-1 text-xs">
            <Gauge className="w-3 h-3 text-slate-400 mr-1" />
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimulationSpeed(spd)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  simulationSpeed === spd
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Inject Traffic Spike */}
          <button
            onClick={onInjectTrafficBurst}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 transition-all"
            title="Inject incoming traffic when road is empty"
          >
            <Flame className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Add Vehicles</span>
          </button>
        </div>
      </div>
    </header>
  );
};
