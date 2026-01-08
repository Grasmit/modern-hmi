# Modern Web HMI (OPC-UA + React)

A compact demo showing a browser HMI that connects to a simulated PLC via OPC-UA, streams data over WebSockets, and lets you start/stop the machine. UI is implemented in React (UMD, no build step) for a familiar component model while staying lightweight.

## Stack
- OPC-UA simulator powered by `node-opcua`
- Node.js (Express + Socket.io) gateway
- React + Socket.io frontend served by the gateway (no bundler required)
- Docker (single image, two services via compose)

## Quick start (Docker)
```bash
cd modern-hmi
docker compose up --build
```
- HMI UI: http://localhost:3000
- OPC-UA endpoint: opc.tcp://localhost:4840 (inside compose use `opc-sim:4840`)

## Local development (without Docker)
```bash
cd modern-hmi
npm install
npm run dev  # runs simulator + backend together
# open http://localhost:3000
```

## What to demo
- Real-time gauge updates come from OPC-UA subscription -> Socket.io push (<50 ms path).
- Start/Stop writes `PumpStatus` back to the simulated PLC; cycle counter increments on start.
- Overheat alarm trips automatically when temperature exceeds 90°C and forces pump off.

## Files
- `src/plc-simulator.js` – OPC-UA server exposing Temperature, PumpStatus, CleaningCycleID, Overheat_Alarm.
- `src/server.js` – Express + Socket.io gateway bridging OPC-UA to the web UI.
- `public/` – React UI (UMD) dashboard (gauge, controls, status lights) plus CSS.
- `docs/portfolio-report.md` – Ready-to-send project summary with image placeholder.
- `docker-compose.yml` – Runs simulator and HMI as separate services from the same image.

## Resume snippet
> Designed a browser-based HMI to monitor and control a simulated industrial cleaning system via OPC-UA. Replaced refresh loops with WebSockets for real-time (<50 ms) visualization and implemented bi-directional control to trigger pump start/stop and alarm handling.
