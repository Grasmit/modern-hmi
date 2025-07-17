const path = require("path");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const {
  OPCUAClient,
  AttributeIds,
  TimestampsToReturn,
  MonitoringParametersOptions,
  ReadValueIdOptions
} = require("node-opcua");

const OPC_ENDPOINT = process.env.OPC_ENDPOINT || "opc.tcp://localhost:4840";
const PORT = Number(process.env.PORT || 3000);

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "../public")));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const nodeIds = {
  temperature: "ns=1;s=Temperature",
  pumpStatus: "ns=1;s=PumpStatus",
  cleaningCycleId: "ns=1;s=CleaningCycleID",
  overheatAlarm: "ns=1;s=Overheat_Alarm"
};

const state = {
  temperature: null,
  pumpStatus: null,
  cleaningCycleId: null,
  overheatAlarm: null,
  lastUpdate: null
};

async function connectOpc() {
  const client = OPCUAClient.create({ endpointMustExist: false });
  await client.connect(OPC_ENDPOINT);
  console.log(`Connected to OPC-UA at ${OPC_ENDPOINT}`);
  const session = await client.createSession();

  const subscription = await session.createSubscription2({
    requestedPublishingInterval: 200,
    requestedLifetimeCount: 100,
    requestedMaxKeepAliveCount: 10,
    maxNotificationsPerPublish: 20,
    publishingEnabled: true,
    priority: 1
  });

  const monitorDefs = [
    { name: "temperature", nodeId: nodeIds.temperature },
    { name: "pumpStatus", nodeId: nodeIds.pumpStatus },
    { name: "cleaningCycleId", nodeId: nodeIds.cleaningCycleId },
    { name: "overheatAlarm", nodeId: nodeIds.overheatAlarm }
  ];

  monitorDefs.forEach(({ name, nodeId }) => {
    const itemToMonitor = { nodeId, attributeId: AttributeIds.Value };
    const parameters = { samplingInterval: 250, queueSize: 10, discardOldest: true };
    const monitoredItem = subscription.monitor(itemToMonitor, parameters, TimestampsToReturn.Both);

    monitoredItem.on("changed", (dataValue) => {
      state[name] = dataValue.value.value;
      state.lastUpdate = dataValue.sourceTimestamp || new Date();
      io.emit("telemetry", { ...state });
    });
  });

  io.on("connection", (socket) => {
    if (state.lastUpdate) {
      socket.emit("telemetry", { ...state });
    }

    socket.on("setPumpStatus", async (desired) => {
      try {
        await session.writeSingleNode(nodeIds.pumpStatus, {
          dataType: "Boolean",
          value: !!desired
        });
        console.log(`PumpStatus written: ${desired}`);
      } catch (err) {
        console.error("Failed to write PumpStatus", err.message);
        socket.emit("error-message", "Write failed: " + err.message);
      }
    });
  });

  client.on("close", () => {
    console.warn("OPC-UA connection closed");
  });
}

connectOpc().catch((err) => {
  console.error("Failed to connect to OPC-UA server", err);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Web HMI available at http://localhost:${PORT}`);
});
