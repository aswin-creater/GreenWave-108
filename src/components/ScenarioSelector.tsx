import React from 'react';
import { CorridorScenario } from '../types';
import { MapPin, Navigation, Compass } from 'lucide-react';

export const PRESET_SCENARIOS: CorridorScenario[] = [
  {
    id: 'BLR_MG_ROAD',
    name: 'Bengaluru MG Road Corridor',
    city: 'Bengaluru',
    description: 'High-density commercial corridor with mixed traffic (autos, bikes, BMTC buses) connecting Mayo Hall to Bowring Trauma Center.',
    totalLengthMeters: 2800,
    intersections: [
      { id: 'INT-1', name: 'MG Road Junction', crossStreet: 'Kamraj Road', distanceMeters: 450, baseTrafficDensity: 'HIGH' },
      { id: 'INT-2', name: 'Brigade Cross', crossStreet: 'Brigade Road', distanceMeters: 1050, baseTrafficDensity: 'CRITICAL' },
      { id: 'INT-3', name: 'Residency Roundabout', crossStreet: 'Residency Road', distanceMeters: 1800, baseTrafficDensity: 'HIGH' },
      { id: 'INT-4', name: 'Hosur Link Junction', crossStreet: 'Hosur Main Road', distanceMeters: 2600, baseTrafficDensity: 'MEDIUM' },
    ],
  },
  {
    id: 'MUM_WEH',
    name: 'Mumbai Western Express Highway',
    city: 'Mumbai',
    description: 'Arterial North-South high-speed corridor connecting suburban hubs to Lilavati Emergency Center.',
    totalLengthMeters: 3400,
    intersections: [
      { id: 'INT-1', name: 'Andheri Metro Cross', crossStreet: 'Andheri-Kurla Rd', distanceMeters: 600, baseTrafficDensity: 'CRITICAL' },
      { id: 'INT-2', name: 'Airport Flyover Base', crossStreet: 'Domestic Terminal Rd', distanceMeters: 1400, baseTrafficDensity: 'HIGH' },
      { id: 'INT-3', name: 'Bandra Reclamation', crossStreet: 'SV Road Junction', distanceMeters: 2300, baseTrafficDensity: 'HIGH' },
      { id: 'INT-4', name: 'Kalanagar Junction', crossStreet: 'BKC Connector', distanceMeters: 3100, baseTrafficDensity: 'CRITICAL' },
    ],
  },
  {
    id: 'DEL_RING_ROAD',
    name: 'Delhi AIIMS Emergency Link',
    city: 'New Delhi',
    description: 'Dedicated emergency medical route leading directly into AIIMS Apex Trauma Centre.',
    totalLengthMeters: 2900,
    intersections: [
      { id: 'INT-1', name: 'Safdarjung Crossing', crossStreet: 'Aurobindo Marg', distanceMeters: 500, baseTrafficDensity: 'HIGH' },
      { id: 'INT-2', name: 'Ring Road Intersection', crossStreet: 'Africa Avenue', distanceMeters: 1200, baseTrafficDensity: 'CRITICAL' },
      { id: 'INT-3', name: 'Moolchand Flyover Underpass', crossStreet: 'Lajpat Nagar Link', distanceMeters: 1950, baseTrafficDensity: 'HIGH' },
      { id: 'INT-4', name: 'AIIMS Trauma Gate', crossStreet: 'Mahatma Gandhi Marg', distanceMeters: 2750, baseTrafficDensity: 'HIGH' },
    ],
  },
];

interface ScenarioSelectorProps {
  selectedScenarioId: string;
  onSelectScenario: (scenario: CorridorScenario) => void;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  selectedScenarioId,
  onSelectScenario,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
        City Corridor:
      </span>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_SCENARIOS.map((sc) => {
          const isSelected = selectedScenarioId === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {sc.city}: {sc.name.split(' ')[1] || sc.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
