const socket = io();
const { useEffect, useState, useMemo } = React;
const h = React.createElement;

function Gauge({ temperature }) {
  const angle = useMemo(() => {
    const safeTemp = Number.isFinite(temperature) ? temperature : 0;
    return -120 + Math.min(240, Math.max(0, (safeTemp / 120) * 240));
  }, [temperature]);

  return h(
    "section",
    { className: "card gauge" },
    h(
      "div",
      { className: "gauge-circle" },
      h("div", { className: "needle", style: { transform: `translateX(-50%) rotate(${angle}deg)` } }),
      h("div", { className: "center" })
    ),
    h(
      "div",
      { className: "gauge-label" },
      h("span", null, Number.isFinite(temperature) ? temperature.toFixed(1) : "--"),
      h("small", null, "Temperature (°C)")
    )
  );
}

function StatusLight({ label, state, onLabel = "ON", offLabel = "OFF", alarmLabel = "ALARM" }) {
  let cls = "neutral";
  let text = offLabel;
  if (state === true) {
    cls = "on";
    text = onLabel;
  } else if (state === "alarm") {
    cls = "alarm";
    text = alarmLabel;
  }

  return h(
    "div",
    { className: "status-item" },
    h("span", null, label),
    h("div", { className: `light ${cls}` }, text)
  );
}

function App() {
  const [telemetry, setTelemetry] = useState({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const onData = (data) => setTelemetry(data);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("telemetry", onData);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("error-message", (msg) => alert(msg));
    return () => {
      socket.off("telemetry", onData);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const start = () => socket.emit("setPumpStatus", true);
  const stop = () => socket.emit("setPumpStatus", false);
  const lastUpdate = telemetry.lastUpdate ? new Date(telemetry.lastUpdate) : null;

  return h(
    "div",
    { className: "page" },
    h(
      "header",
      null,
      h("h1", null, "Modern HMI"),
      h("p", null, "OPC-UA driven Parts Cleaner dashboard"),
      h(
        "div",
        { className: "status-bar" },
        h("span", { className: connected ? "pill success" : "pill" }, connected ? "Connected" : "Connecting"),
        lastUpdate && h("small", null, `Last update: ${lastUpdate.toLocaleTimeString()}`)
      )
    ),
    h(
      "main",
      { className: "grid" },
      h(Gauge, { temperature: telemetry.temperature }),
      h(
        "section",
        { className: "card controls" },
        h("h2", null, "Control"),
        h(
          "div",
          { className: "button-row" },
          h("button", { className: "primary", onClick: start }, "Start Cleaning"),
          h("button", { onClick: stop }, "Stop")
        ),
        h("p", { className: "hint" }, "Writes PumpStatus to the simulated PLC.")
      ),
      h(
        "section",
        { className: "card status" },
        h("h2", null, "Status"),
        h(
          "div",
          { className: "status-item" },
          h("span", null, "Cleaning Cycle"),
          h("strong", null, Number.isFinite(telemetry.cleaningCycleId) ? telemetry.cleaningCycleId : "--")
        ),
        h(StatusLight, {
          label: "Pump",
          state: telemetry.pumpStatus === undefined ? null : telemetry.pumpStatus,
          onLabel: "ON",
          offLabel: "OFF"
        }),
        h(StatusLight, {
          label: "Overheat",
          state: telemetry.overheatAlarm ? "alarm" : false,
          onLabel: "OK",
          alarmLabel: "ALARM",
          offLabel: "OK"
        })
      )
    ),
    h("footer", null, h("small", null, "Real-time feed via Socket.io & OPC-UA"))
  );
}

const root = document.getElementById("root");
ReactDOM.createRoot(root).render(h(App));
