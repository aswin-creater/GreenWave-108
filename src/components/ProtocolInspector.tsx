import React, { useState } from 'react';
import { ProtocolMessage } from '../types';
import {
  Code2,
  Terminal,
  FileJson,
  Wifi,
  Sliders,
  Copy,
  Check,
  Send,
  Radio,
  Filter,
} from 'lucide-react';

interface ProtocolInspectorProps {
  messages: ProtocolMessage[];
  simulatedLatencyMs: number;
  setSimulatedLatencyMs: (ms: number) => void;
  simulatedPacketLossPct: number;
  setSimulatedPacketLossPct: (pct: number) => void;
  onClearLogs: () => void;
}

export const ProtocolInspector: React.FC<ProtocolInspectorProps> = ({
  messages,
  simulatedLatencyMs,
  setSimulatedLatencyMs,
  simulatedPacketLossPct,
  setSimulatedPacketLossPct,
  onClearLogs,
}) => {
  const [selectedMessage, setSelectedMessage] = useState<ProtocolMessage | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'LOGS' | 'SCHEMA'>('LOGS');

  const filtered = messages.filter((m) => {
    if (filterType === 'ALL') return true;
    return m.type === filterType;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openApiSpec = `openapi: 3.0.3
info:
  title: AmbuWave Connect V2X Emergency Priority Protocol
  version: 1.0.0
  description: Open standard protocol for real-time priority requests between emergency vehicles and traffic signal controllers (SCATS/Coordinated/Actuated).
paths:
  /api/v1/priority/request:
    post:
      summary: Send emergency green wave priority request
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PriorityRequest'
      responses:
        '200':
          description: Signal controller decision
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PriorityResponse'
components:
  schemas:
    PriorityRequest:
      type: object
      required:
        - ambulanceId
        - urgency
        - currentLocation
        - targetIntersectionId
        - estimatedArrivalTimeSec
      properties:
        type:
          type: string
          example: PRIORITY_REQUEST
        requestId:
          type: string
          example: REQ-9921-MG01
        ambulanceId:
          type: string
          example: KA-01-EA-9921
        urgency:
          type: string
          enum: [IDLE, ON_CALL, CRITICAL]
          example: CRITICAL
        currentLocation:
          type: object
          properties:
            lat: { type: number, example: 12.9716 }
            lng: { type: number, example: 77.5946 }
            speedKmph: { type: number, example: 48.5 }
        targetIntersectionId:
          type: string
          example: INT-1
        estimatedArrivalTimeSec:
          type: number
          example: 28.5
    PriorityResponse:
      type: object
      properties:
        type:
          type: string
          example: PRIORITY_RESPONSE
        requestId:
          type: string
        status:
          type: string
          enum: [ACCEPTED, QUEUED, REJECTED]
        greenWindow:
          type: object
          properties:
            startInSec: { type: number, example: 22 }
            durationSec: { type: number, example: 25 }`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-white select-none">
      {/* Top Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              Communication Protocol Emulator
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                JSON-RPC / WebSockets
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Live bi-directional message exchange between in-vehicle client &amp; signal controllers
            </p>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'LOGS'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live Stream ({messages.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SCHEMA')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'SCHEMA'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>OpenAPI Standard Spec</span>
          </button>
        </div>
      </div>

      {activeTab === 'LOGS' ? (
        <div className="mt-4 space-y-4">
          {/* Network Channel Simulation Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                  Simulated Latency:
                </span>
                <span className="font-mono text-cyan-400 font-bold">{simulatedLatencyMs} ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="25"
                value={simulatedLatencyMs}
                onChange={(e) => setSimulatedLatencyMs(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Simulated Packet Loss:
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {simulatedPacketLossPct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={simulatedPacketLossPct}
                onChange={(e) => setSimulatedPacketLossPct(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Filters & Clear */}
            <div className="flex items-end justify-between gap-2">
              <div className="w-full">
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                  FILTER MESSAGE TYPE
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="ALL">All Types ({messages.length})</option>
                  <option value="PRIORITY_REQUEST">PRIORITY_REQUEST</option>
                  <option value="PRIORITY_RESPONSE">PRIORITY_RESPONSE</option>
                  <option value="CLEARANCE_NOTICE">CLEARANCE_NOTICE</option>
                  <option value="TELEMETRY_PING">TELEMETRY_PING</option>
                </select>
              </div>
              <button
                onClick={onClearLogs}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold whitespace-nowrap"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Messages Feed & Inspector Split View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[280px]">
            {/* Live Feed List */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-2 overflow-y-auto max-h-[340px] space-y-1.5">
              {filtered.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  No messages captured yet. Run simulation to stream V2X traffic.
                </div>
              ) : (
                filtered.map((msg, idx) => {
                  const isReq = msg.type === 'PRIORITY_REQUEST';
                  const isResp = msg.type === 'PRIORITY_RESPONSE';
                  const isClear = msg.type === 'CLEARANCE_NOTICE';
                  const isSelected = selectedMessage === msg;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedMessage(msg)}
                      className={`p-2 rounded-lg text-xs font-mono cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-slate-800 border-cyan-400'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded ${
                            isReq
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : isResp
                              ? 'bg-sky-950 text-sky-400 border border-sky-800'
                              : isClear
                              ? 'bg-purple-950 text-purple-400 border border-purple-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {msg.type}
                        </span>
                        <span className="text-slate-500">
                          {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-300 truncate text-[11px]">
                        {isReq && `To: ${msg.targetIntersectionName || msg.targetIntersectionId} • ETA: ${msg.estimatedArrivalTimeSec}s`}
                        {isResp && `Status: ${msg.status} • Window: ${msg.greenWindow?.durationSec}s`}
                        {isClear && `Intersection cleared: ${msg.intersectionId}`}
                        {!isReq && !isResp && !isClear && JSON.stringify(msg)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* JSON Payload Inspector */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 flex flex-col justify-between max-h-[340px]">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                    Payload Details
                  </span>
                  {selectedMessage && (
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedMessage, null, 2))}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  )}
                </div>

                {selectedMessage ? (
                  <pre className="text-[11px] font-mono text-emerald-300 bg-slate-900/90 p-2.5 rounded-lg overflow-x-auto max-h-[240px]">
                    {JSON.stringify(selectedMessage, null, 2)}
                  </pre>
                ) : (
                  <div className="text-center py-14 text-xs text-slate-500">
                    Click any message on the left to inspect raw JSON payload.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* OpenAPI Specification Tab */
        <div className="mt-4">
          <div className="flex items-center justify-between pb-2 mb-2 text-xs text-slate-400">
            <span>Standardized V2X Protocol Schema for Indian Smart City Tenders</span>
            <button
              onClick={() => handleCopy(openApiSpec)}
              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied YAML' : 'Copy OpenAPI YAML'}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-[380px] leading-relaxed">
            {openApiSpec}
          </pre>
        </div>
      )}
    </div>
  );
};
