import React from 'react';
import {
  Intersection,
  Ambulance,
} from '../types';
import {
  ShieldAlert,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  AlertTriangle,
  Radio,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';

interface ControlRoomPanelProps {
  intersections: Intersection[];
  ambulance: Ambulance;
  runType: 'BASELINE' | 'PRIORITY';
  onManualOverride: (intersectionId: string) => void;
  selectedIntersectionId: string | null;
  onSelectIntersection: (id: string | null) => void;
}

export const ControlRoomPanel: React.FC<ControlRoomPanelProps> = ({
  intersections,
  ambulance,
  runType,
  onManualOverride,
  selectedIntersectionId,
  onSelectIntersection,
}) => {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              City Traffic Management Center (TMC)
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                SCATS / Coordinated Corridor
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Active Monitoring: 4 Intersections along Bangalore MG Road Arterial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-300">V2X Radio Link:</span>
            <span className="font-bold text-emerald-400">99.8% Online</span>
          </div>
        </div>
      </div>

      {/* Grid of Intersections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {intersections.map((int) => {
          const isSelected = selectedIntersectionId === int.id;
          const isPriorityActive = int.priorityStatus === 'ACTIVE';
          const isPriorityScheduled = int.priorityStatus === 'ACCEPTED';

          return (
            <div
              key={int.id}
              onClick={() => onSelectIntersection(isSelected ? null : int.id)}
              className={`rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden ${
                isPriorityActive
                  ? 'bg-gradient-to-b from-emerald-950/70 to-slate-900 border-emerald-500/80 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/40'
                  : isSelected
                  ? 'bg-slate-800 border-sky-500'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                    {int.id}
                  </span>
                  <h4 className="font-bold text-sm text-white">{int.name}</h4>
                </div>

                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                    isPriorityActive
                      ? 'bg-emerald-500 text-slate-950 animate-pulse'
                      : isPriorityScheduled
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {int.priorityStatus}
                </span>
              </div>

              {/* Signal Lights Visualizer */}
              <div className="my-3 flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-semibold">CORRIDOR</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        int.corridorLightColor === 'GREEN'
                          ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                          : int.corridorLightColor === 'AMBER'
                          ? 'bg-amber-400 shadow-sm shadow-amber-400'
                          : 'bg-rose-500/40'
                      }`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        int.corridorLightColor === 'GREEN'
                          ? 'text-emerald-400'
                          : int.corridorLightColor === 'AMBER'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {int.corridorLightColor}
                    </span>
                  </div>
                </div>

                <div className="h-6 w-px bg-slate-800" />

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">CROSS TRAFFIC</span>
                  <div className="flex items-center gap-1.5 mt-1 justify-end">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        int.crossLightColor === 'GREEN'
                          ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                          : int.crossLightColor === 'AMBER'
                          ? 'bg-amber-400 shadow-sm shadow-amber-400'
                          : 'bg-rose-500/40'
                      }`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        int.crossLightColor === 'GREEN'
                          ? 'text-emerald-400'
                          : int.crossLightColor === 'AMBER'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {int.crossLightColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Queue & Waiting Delay Metrics */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Car className="w-3.5 h-3.5" />
                    Cross Queue:
                  </span>
                  <span className="font-bold text-amber-400">{int.crossQueue} vehicles</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    Delay Added:
                  </span>
                  <span className="font-mono text-slate-200">
                    {Math.round(int.totalCrossWaitSeconds)} veh-sec
                  </span>
                </div>
              </div>

              {/* Manual Override Action */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {int.manualOverrideActive ? '⚠️ Override Active' : 'Auto Controlled'}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onManualOverride(int.id);
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                    int.manualOverrideActive
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Force toggle emergency priority"
                >
                  {int.manualOverrideActive ? 'Cancel Override' : 'Force Priority'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
