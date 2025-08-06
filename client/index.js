const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use(express.static("web"));

const configPath = path.join(__dirname, "database.json");
let config = {
  clientId: "",
  clientSecret: "",
  apiKey: "",
};

function loadConfig() {
  if (!fs.existsSync(configPath)) return;
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      config = { ...config, ...parsed };
    }
  } catch (err) {
    console.error("[Config] Failed to load config.dat:", err);
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config));
    return true;
  } catch (err) {
    console.error("[Config] Failed to save config.dat:", err);
    return false;
  }
}

loadConfig();

let memory = {};

app.get("/status", async (req, res) => {
  return res.status(200).json(config);
});

app.post("/config", async (req, res) => {
  const { clientId, clientSecret, apiKey } = req.body;
  if (!clientId || !clientSecret || !apiKey) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  config.clientId = clientId;
  config.clientSecret = clientSecret;
  config.apiKey = apiKey;
  if (!saveConfig()) {
    return res.status(500).json({ error: "Failed to save config" });
  }
  return res.status(200).json({
    message: "Configuration saved successfully",
  });
});

app.post("/verify", async (req, res) => {
  if (!config.clientId || !config.clientSecret || !config.apiKey) {
    return res.status(500).json({ error: "Configuration not set" });
  }
  const { lot_id } = req.body;
  if (!lot_id) {
    return res.status(400).json({ error: "Missing lot_id in body" });
  }
  try {
    const response = await verifyRequestToApi(lot_id);
    memory[lot_id] = {
      request_id: response.request_id,
      status: "pending",
    };
    res.status(200).json(response.url);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function verifyRequestToApi(lot_id) {
  const apiUrl = process.env.VERIFY_API_HOST;
  const clientId = config.clientId;
  const clientSecret = config.clientSecret;
  const response = await axios.post(
    `${apiUrl}/verify-request`,
    {
      max_try: 2,
      expired_duration: 10,
      content_id: "your_content_id_here",
      metadata: {
        lot_id,
      },
    },
    {
      headers: {
        client_id: clientId,
        client_secret: clientSecret,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

app.post("/check", (req, res) => {
  if (!config.clientId || !config.clientSecret || !config.apiKey) {
    return res.status(500).json({ error: "Configuration not set" });
  }
  const { lot_id } = req.body;
  if (lot_id) {
    if (memory[lot_id]) {
      return res.status(200).json({
        status: memory[lot_id].status,
      });
    } else {
      return res.status(404).json({ error: "Not found" });
    }
  } else {
    res.status(400).json({ error: "Missing value" });
  }
});

app.post("/webhook", (req, res) => {
  if (!config.clientId || !config.clientSecret || !config.apiKey) {
    return res.status(500).json({ error: "Configuration not set" });
  }
  const apiKey = req.headers["api_key"];
  const envApiKey = process.env.API_KEY;
  const {
    request_id,
    status,
    device_id,
    metadata: { lot_id },
  } = req.body;

  if (!apiKey) {
    return res.status(401).json({ error: "Missing api_key header" });
  }
  if (apiKey !== envApiKey) {
    return res.status(403).json({ error: "Invalid api_key" });
  }
  if (!request_id || !status || !device_id || !lot_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!memory[lot_id] || memory[lot_id].request_id != request_id) {
    return res.status(404).json({ error: "Invalid request_id or lot_id" });
  }
  memory[lot_id].status =
    status == "verified" ? "verified" : "need_verification";

  res.status(200).json({
    message: "Webhook received",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
