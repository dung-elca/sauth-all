import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import * as db from "./database.js";
dotenv.config();

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

app.use(express.static("web"));

// --- Client APIs ---
app.post("/client", (req, res) => {
  const { name, webhook_url, enable_datadome, enable_recaptcha } = req.body;
  if (!name) return res.status(400).json({ error: "Missing name" });
  if (!webhook_url)
    return res.status(400).json({ error: "Missing webhook_url" });

  const client = db.createClient(
    name,
    webhook_url,
    enable_datadome,
    enable_recaptcha
  );
  res.json({
    client_id: client.client_id,
    client_secret: client.client_secret,
    api_key: client.api_key,
  });
});

app.put("/client", (req, res) => {
  const clientId = req.header("client_id");
  const { name, webhook_url, enable_datadome, enable_recaptcha } = req.body;

  if (!clientId)
    return res.status(401).json({ error: "Missing client_id in header" });

  if (!db.findClientById(clientId))
    return res.status(401).json({ error: "Invalid client credentials" });

  const success = db.updateClient(clientId, {
    name,
    enable_datadome,
    enable_recaptcha,
    webhook_url,
  });
  if (!success) return res.status(404).json({ error: "Client not found" });

  res.json({ success: true });
});

app.get("/client", (req, res) => {
  res.json(db.getAllClients());
});

app.delete("/client/:clientId", (req, res) => {
  const { clientId } = req.params;

  if (!clientId) {
    return res.status(400).json({ error: "Missing client_id" });
  }

  const client = db.findClientById(clientId);
  if (!client) {
    return res.status(404).json({ error: "Client not found" });
  }

  const success = db.deleteClient(clientId);
  if (success) {
    res.json({ success: true, message: "Client deleted successfully" });
  } else {
    res.status(500).json({ error: "Failed to delete client" });
  }
});

app.post("/verify-request", (req, res) => {
  const clientId = req.header("client_id");
  const clientSecret = req.header("client_secret");
  const { allow_refresh, max_try, expired_duration, metadata } = req.body;

  if (!clientId || !clientSecret)
    return res
      .status(401)
      .json({ error: "Missing client_id or client_secret in header" });
  const client = db.findClientById(clientId, clientSecret);
  if (!client)
    return res.status(401).json({ error: "Invalid client credentials" });

  if (client.webhook_url === undefined) {
    return res.status(403).json({ error: "Webhook URL is not set" });
  }

  if (
    typeof allow_refresh !== "boolean" ||
    typeof max_try !== "number" ||
    typeof expired_duration !== "number"
  )
    return res.status(400).json({ error: "Invalid body" });

  const request = db.createVerificationRequest(
    clientId,
    allow_refresh,
    max_try,
    expired_duration,
    metadata
  );
  if (!request) return res.status(404).json({ error: "Client not found" });

  res.json({
    url: `http://localhost:${PORT}/verify/${request.request_id}`,
    request_id: request.request_id,
  });
});

// Serve verification page
app.get("/verify/:request_id", (req, res) => {
  res.sendFile(path.join(process.cwd(), "web", "qrcode.html"));
});

// --- SAuth Web APIs ---
app.get("/qrcode/:request_id", (req, res) => {
  const { request_id } = req.params;

  const request = db.genSessionAndGetVerificationRequest(request_id);
  if (!request) return res.status(404).json({ error: "Request not found" });

  // Check if expired
  if (new Date(request.expired_time) < new Date()) {
    return res.status(410).json({ error: "Request expired" });
  }

  res.json({
    session_id: request.session_id,
    expired_time: request.expired_time,
    nonce: request.nonce,
    allow_retry: request.allow_refresh,
  });
});

// --- SAuth Mobile APIs ---
app.post("/mobile/register-device", (req, res) => {
  const { public_key, signature, device_info } = req.body;
  if (!public_key || !signature)
    return res.status(400).json({ error: "Missing public_key or signature" });

  const device = db.createDevice(public_key, signature, device_info);
  res.json({ device_id: device.device_id });
});

app.post("/mobile/verify-qrcode", async (req, res) => {
  const { session_id, nonce, signature, device_id } = req.body;
  if (!session_id || !nonce || !signature || !device_id)
    return res.status(400).json({ error: "Missing fields" });

  // Find device
  const device = db.findDeviceById(device_id);
  if (!device) return res.status(404).json({ error: "Device not found" });

  // Find verification request by session_id and nonce
  const foundRequest = db.findVerificationRequestBySession(session_id, nonce);
  if (!foundRequest)
    return res.status(404).json({ error: "Session not found" });

  if (foundRequest.client.webhook_url === undefined) {
    return res.status(403).json({ error: "Webhook URL is not set" });
  }
  // Check if expired
  if (new Date(foundRequest.request.expired_time) < new Date()) {
    return res.status(410).json({ error: "Session expired" });
  }

  // Update request with device_id and success status
  db.updateVerificationRequest(foundRequest.request.request_id, {
    device_id,
    status: "verified",
  });
  await sendResultToClient(foundRequest.client, foundRequest.request, device);

  res.json({ status: "success", message: "QR code verified" });
});

async function sendResultToClient(client, request, device) {
  const apiUrl = client.webhook_url;
  const apiKey = client.api_key;
  const response = await axios.post(
    `${apiUrl}/webhook`,
    {
      request_id: request.request_id,
      status: request.status,
      device_id: device.device_id,
      metadata: request.metadata,
    },
    {
      headers: {
        api_key: api_key,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

app.listen(PORT, () => {
  console.log(`SAuth Node backend running on port ${PORT}`);
});
