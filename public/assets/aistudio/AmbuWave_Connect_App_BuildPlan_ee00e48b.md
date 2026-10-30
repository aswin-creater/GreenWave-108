# AmbuWave Connect App – Build Plan (Hackathon Prototype)

---

## 1. Problem Statement

Emergency vehicles in Indian cities (and many others) are frequently delayed at intersections because:

- Traffic signals are not aware that an ambulance is approaching.
- Ambulance routing apps and traffic signal systems are designed separately, by different vendors and departments.
- There is no simple, shared, **real-time protocol** for ambulances to request temporary priority (green lights) from signals along their route.
- Existing traffic systems are optimized for average traffic flow, not for **life-critical outliers** like ambulances.
- Upgrading hardware citywide is expensive and slow, so pilots that require new signal controllers rarely get deployed.

As a result, ambulances waste precious minutes at intersections, and city governments lack tools to **trade off ambulance delay vs. extra waiting time for other vehicles** in a transparent, measurable way.

The root cause: **governance, standards, and procurement don’t require an integrated ambulance–signal system**, so technology, protocols, and budgets for real-time ambulance priority were never built into most cities’ traffic infrastructure.

---

## 2. Solution Overview

**AmbuWave Connect** is a mobile+web simulation platform that demonstrates how a simple, open protocol between ambulances and traffic signals can create “green waves” along emergency routes using **existing signal infrastructure**.

The hackathon prototype focuses on a **virtual city**:

- A **smartphone app** (or browser-based mobile UI) acts as the **ambulance client**:
  - Continuously shares **ambulance GPS Tracking** and status (idle / on-call / critical).
  - Sends **Priority Request Messages** for upcoming intersections along its **Emergency Route Optimization** path.
- A **Virtual Signal Simulator** emulates a city control room:
  - Multiple junctions with mixed Indian traffic patterns (cars, bikes, autos, buses).
  - Each simulated traffic signal responds to priority requests by adjusting its phases to create a green wave.
- A **Traffic Signal Control Interface** (web dashboard) for operators:
  - Visualizes ambulance positions and their active priority zones.
  - Shows signal states (normal vs priority), delays to general traffic, and time saved for ambulances.
  - Allows manual override (e.g., cancel or force priority).
- A **Communication Protocol Emulator**:
  - Models the message exchanges between the ambulance app and traffic signals.
  - Uses a clear, JSON-based open format that could be adopted as a future standard, even with real hardware later.

The simulation compares:

- An ambulance run with **no priority** (baseline).
- An ambulance run with **AmbuWave green-wave priority**.

The dashboard shows:

- **Minutes saved** for the ambulance.
- **Extra waiting time** imposed on other vehicles.
- Basic fairness metrics (e.g., max wait per direction).

---

## 3. Target Users

1. **Ambulance Drivers & Fire Crews**
   - Need:
     - Faster, more predictable travel times.
     - Less confusion at intersections.
   - How AmbuWave helps:
     - App automatically requests priority along their route and shows which signals are “prepared” (green in their favor).

2. **Traffic Control Room Operators & Traffic Engineers**
   - Need:
     - Oversight over when and where emergency priority is granted.
     - Ability to monitor system impact on overall traffic.
   - How AmbuWave helps:
     - **Traffic Signal Control Interface** to see incoming priority requests, signal adjustments, and traffic impacts.
     - A **Virtual Signal Simulator** to test policies before any real deployment.

3. **City Decision-Makers / Transport Dept / Smart City Cells** (secondary for demo)
   - Need:
     - Low-risk, low-cost proof that ambulance–signal coordination is feasible.
     - Clear metrics on life-saving benefit vs. traffic disruption.
   - How AmbuWave helps:
     - Simulation-based metrics and visualizations.
     - Open **Communication Protocol Emulator** and request formats that could scale to real deployments.

---

## 4. Key Features

All of the following must be built and referenced in the prototype:

1. **Ambulance GPS Tracking**
   - Real-time location updates for each simulated (or real) ambulance.
   - State model: `idle`, `on-call`, `critical`.
   - Feeds into route prediction and intersection priority decisions.

2. **Priority Request Messaging**
   - A simple, open protocol (e.g. JSON over WebSocket/HTTP) where:
     - Ambulance app sends route, ETA to intersections, and urgency (`on-call` vs `critical`).
     - Signals (simulator) respond with `ACCEPTED`, `QUEUED`, or `REJECTED` and timing details.
   - Drives creation of “green waves” along the emergency route.

3. **Virtual Signal Simulator**
   - Simulated map with multiple intersections, each with:
     - Lanes and movements appropriate for Indian roads.
     - Phase-timing logic that can be altered by priority requests.
   - Visualizes:
     - Per-signal phase (Red/Amber/Green).
     - Queues of vehicles at each approach.
   - Runs two modes: **Normal** vs **AmbuWave-enabled**.

4. **Traffic Signal Control Interface**
   - Web dashboard acting as a city control room:
     - Map with ambulances and signal states.
     - Status of each priority request (pending / active / completed).
     - Manual controls:
       - Approve / deny priority.
       - Force return to normal cycle.
     - Analytics: time saved, added delay for others, etc.

5. **Emergency Route Optimization**
   - Given ambulance origin and destination:
     - Compute the route that minimizes ETA.
     - Consider current simulated congestion and **priority-enabled** intersections.
   - Dynamically re-optimize if:
     - Traffic conditions change.
     - An intersection cannot grant requested priority.

6. **Communication Protocol Emulator**
   - Service (or module) that:
     - Encodes/decodes messages between ambulance client and signals.
     - Simulates latency, message loss, or conflicting priority.
   - Provides:
     - A mock API spec (OpenAPI/Swagger or simple JSON schema).
     - Endpoints for:
       - Posting/streaming priority requests.
       - Subscribing to signal state updates.

---

## 5. User Flow

### 5.1 Setup (Hackathon Demo Prep)

1. Organizer loads a **predefined map**:
   - E.g., a linear corridor with 4–6 intersections.
   - Mixed traffic volumes configured per junction (higher at certain crossroads).
2. Traffic simulation starts:
   - Cars, bikes, buses spawn and move based on simple rules-of-the-road.
   - All signals operate under a standard fixed-time or semi-actuated scheme.

### 5.2 Ambulance Journey – Baseline Run (No Priority)

1. In the **Traffic Signal Control Interface**, operator clicks:
   - “Run baseline scenario”.
2. An ambulance is “dispatched”:
   - Origin and destination chosen on the map.
3. **Ambulance GPS Tracking**:
   - Simulated location updates are sent to the backend at regular intervals.
4. No **Priority Request Messaging** is sent:
   - Signals stay in “normal” mode.
5. The system records:
   - Trip time from start to finish.
   - Total red-light waiting time at intersections.
   - Average delay and max delay for general traffic.
6. Baseline metrics are saved and visible on dashboard.

### 5.3 Ambulance Journey – Priority Run (AmbuWave Enabled)

1. Operator triggers:
   - “Run with priority” on the dashboard.
2. Ambulance driver UI (mobile view) shows:
   - Start button: driver presses “Start critical run”.
   - Status set to `critical`.
3. **Ambulance GPS Tracking**:
   - App sends current GPS and status every X seconds via WebSocket/HTTP.
4. **Emergency Route Optimization**:
   - Backend computes best route based on:
     - Road graph.
     - Simulated current congestion.
     - Expected gains from granting signal priority.
   - Route and upcoming intersections displayed to the driver.
5. For each upcoming intersection within a threshold distance or time (e.g., 60–90 seconds away):

   a. **Priority Request Messaging**:
   - App sends:
     ```json
     {
       "type": "PRIORITY_REQUEST",
       "ambulanceId": "AMB-001",
       "urgency": "CRITICAL",
       "currentLocation": {"lat": 12.97, "lng": 77.59},
       "routeId": "ROUTE-1",
       "targetIntersectionId": "INT-3",
       "estimatedArrivalTimeSec": 45
     }
     ```

   b. **Communication Protocol Emulator**:
   - Receives the message.
   - Validates and forwards to the **Virtual Signal Simulator**.
   - Simulates network delay or potential conflicts if multiple requests exist.

   c. **Virtual Signal Simulator** decides:
   - If feasible, it modifies the timing plan to provide a green window aligned with the ETA.
   - Responds:
     ```json
     {
       "type": "PRIORITY_RESPONSE",
       "requestId": "REQ-123",
       "intersectionId": "INT-3",
       "status": "ACCEPTED",
       "greenWindow": {
         "startInSec": 30,
         "durationSec": 25
       }
     }
     ```

6. Driver experience:
   - App indicates upcoming intersections with:
     - “Green wave ready” (time window).
     - Simple countdown and lane guidance, if needed.
   - In the simulation, ambulance passes these intersections without stopping (or with reduced delay).

7. **Traffic Signal Control Interface** during run:
   - Shows:
     - Ambulance’s real-time path and ETA.
     - Each intersection’s mode:
       - Normal, Priority Scheduled, Priority Active, Recovery.
     - Visual overlays for green waves and affected traffic queues.
   - Operator can:
     - Manually override a specific priority (e.g., cancel).

8. Post-run metrics (comparison with baseline):
   - Total ambulance travel time.
   - Time saved relative to baseline.
   - Total extra vehicle delay due to priority:
     - Sum of additional waiting time for other vehicles.
   - Visual breakdown:
     - Bar chart: baseline vs priority trip times.
     - Histogram: wait times for general traffic with/without priority.

9. Additional scenarios:
   - Switch ambulance status to `on-call` (non-critical):
     - Lower priority; system might grant smaller or fewer green windows.
   - Multiple ambulances:
     - **Communication Protocol Emulator** manages conflicts; e.g., only one intersection gets priority at a time.

---

## 6. Technical Approach

### 6.1 Overall Architecture

- **Frontends**
  - **Ambulance Client UI**:
    - Web (mobile-first, PWA) or simple Android app.
    - Tech: React/Next.js (PWA) or React Native/Flutter (if time/resources allow).
  - **Traffic Signal Control Interface (Dashboard)**:
    - Web app for desktops/laptops.
    - Tech: React/Next.js or Vue.js.
- **Backend & Simulation Engine**
  - Node.js (Express or NestJS) or Python (FastAPI) for:
    - REST + WebSocket APIs.
    - Running the **Virtual Signal Simulator** and **Communication Protocol Emulator**.
  - In-memory database (Redis) or simple Postgres for:
    - Storing runs, signals, vehicle states, and metrics.

### 6.2 Ambulance GPS Tracking Implementation

- For hackathon:
  - Use simulated ambulances moving along predefined routes on the road graph.
  - Still expose same API shape so real GPS could be plugged in later.
- API:
  - `POST /api/ambulances/:id/telemetry` or WebSocket channel:
    ```json
    {
      "latitude": 12.9716,
      "longitude": 77.5946,
      "speedKmph": 40,
      "headingDeg": 90,
      "status": "CRITICAL" // IDLE | ON_CALL | CRITICAL
    }
    ```
- Backend:
  - Updates position and status in memory.
  - Triggers checks for upcoming intersections to generate or update priority requests.

### 6.3 Priority Request Messaging

- Design a simple JSON schema for messages:
  - `PRIORITY_REQUEST`, `PRIORITY_UPDATE`, `PRIORITY_CANCEL`, `PRIORITY_RESPONSE`.
- Transport:
  - WebSockets for real-time (preferable).
  - Fallback: REST endpoints (`/priority-requests`).
- Logic:
  - When ambulance is within configurable threshold (distance/ETA), system generates a `PRIORITY_REQUEST`.
  - Multiple outstanding requests can exist for consecutive intersections.
  - Signals return `ACCEPTED`, `QUEUED`, or `REJECTED` with reason.

### 6.4 Virtual Signal Simulator

- Map Representation:
  - Static JSON describing:
    - Nodes = intersections.
    - Edges = road segments (distance, allowed directions, speed).
- Signal Model:
  - Each intersection has:
    - Phase plan: e.g., `N-S`, `E-W`, `Right-Turn`, etc.
    - Cycle duration and phase durations.
  - In priority mode:
    - Adjust cycle by:
      - Shortening non-conflicting phases.
      - Holding or inserting special phase to allow ambulance movement.
- Traffic Model:
  - Simple discrete-time simulation loop (e.g., tick every 0.5–1 second).
  - Vehicles:
    - Spawn with Poisson or fixed rate per lane direction.
    - Basic car-following: move if light is green and front gap is adequate.
  - Measurement:
    - Track time each vehicle spends queued at red.
    - Provide aggregated stats to the dashboard.

### 6.5 Traffic Signal Control Interface

- Views:
  - **Map View**:
    - Intersections as nodes, roads as edges.
    - Ambulances as icons with trails.
    - Signals color-coded (red/amber/green; highlight when priority mode).
  - **Timeline / Event Feed**:
    - Priority requests and responses.
    - Route updates.
  - **Metrics Panel**:
    - Baseline vs priority run metrics.
    - Time saved, extra vehicle delay, max queue lengths.
- Tech:
  - React with a mapping library:
    - For simplicity in simulation, use a canvas/SVG-based map (no need for real GIS).
  - Data feed:
    - WebSockets to get live updates about:
      - Ambulance location.
      - Signal states.
      - Queue lengths and metrics.

### 6.6 Emergency Route Optimization

- Use a simple weighted shortest path algorithm:
  - Graph: intersections and road segments.
  - Weights:
    - Base travel time = distance / speed limit.
    - Real-time congestion: increase weight where queues are long.
    - If priority is available:
      - Reduce weight for segments including priority intersections (since red-light delay is reduced).
- Algorithm:
  - Dijkstra or A* (heuristic: straight-line distance).
  - Recalculate when:
    - Ambulance status changes (e.g., from ON_CALL to CRITICAL).
    - Simulated traffic conditions change significantly.
- For hackathon:
  - Predefine a few routes and still run the optimizer to demonstrate capability.

### 6.7 Communication Protocol Emulator

- Abstraction layer between ambulance and signals:
  - In code, define an interface like:
    ```ts
    interface PriorityChannel {
      sendRequest(req: PriorityRequest): Promise<PriorityResponse>;
      subscribeToSignalUpdates(handler: (update: SignalUpdate) => void): void;
    }
    ```
- Implementation:
  - In memory (no external broker) for hackathon:
    - Use WebSocket rooms or simple in-process pub/sub.
  - Simulated imperfections:
    - Add random delays (e.g., 0–300 ms).
    - Optionally drop a small percentage of messages (configurable).
- API Documentation:
  - Provide at least a basic OpenAPI or markdown spec:
    - `/api/priority-requests`:
      - `POST` to create.
      - `GET` to list active ones.

---

## 7. Success Metrics

To determine whether AmbuWave Connect (even as a simulation) “works”, track:

### 7.1 Ambulance Performance

- **Average Trip Time Reduction**
  - `baselineTripTime - priorityTripTime` (in seconds).
  - % reduction across multiple runs.
- **Red-Light Delay Reduction**
  - Total time ambulances spent waiting at red lights (baseline vs priority).
- **On-Time Arrival Rate (Simulated)**
  - Percentage of critical runs reaching destination under a target time threshold (e.g., 8 minutes).

### 7.2 Impact on General Traffic

- **Total Extra Waiting Time**
  - Sum of additional delay experienced by all non-emergency vehicles vs baseline.
- **Max Queue Length at Any Approach**
  - Highest number of queued vehicles at any approach due to priority.
- **Fairness Indicators**
  - Ratio of ambulance time saved to total extra time imposed on others.
    - Example metric: “1 minute of ambulance time saves costs X minutes of extra wait for others.”

### 7.3 System-Level & UX Metrics

- **Priority Request Hit Rate**
  - % of intersections where the ambulance actually passes during the requested green window.
- **Priority Request Success Rate**
  - % of `PRIORITY_REQUEST`s that are `ACCEPTED` vs `REJECTED`.
- **Operator & Driver Clarity**
  - For hackathon jury or user tests:
    - Can participants understand from the UI when and why a signal changed?
    - Can they easily see the tradeoffs made?

### 7.4 Technical & Integration Readiness

- **Protocol Completeness**
  - Existence of a clear JSON schema or OpenAPI spec for:
    - `Ambulance GPS Tracking` updates.
    - `Priority Request Messaging` and responses.
    - Signal state updates.
- **Modularity**
  - Ability to replace:
    - The **Virtual Signal Simulator** with a real hardware bridge later.
    - The simulated GPS with actual GPS from a mobile device.
- **Performance**
  - Real-time visual updates (< 1–2 seconds latency).
  - Stable simulation with multiple ambulances and 5–10 intersections.

---

This plan is designed so an AI prototyping tool (e.g., Lovable/Bolt) can:

- Scaffold a React-based ambulance client and dashboard.
- Generate Node.js/FastAPI backend services.
- Implement the **Virtual Signal Simulator**, **Communication Protocol Emulator**, and basic traffic/route logic.
- Wire everything into a working, visual **AmbuWave Connect** simulation that demonstrates “green waves” and quantifies their impact.