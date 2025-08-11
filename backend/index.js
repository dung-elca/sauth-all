import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import * as db from "./database.js";
import { AESUtil, Ed25519Util } from "./my-crypto.js";
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
  const { max_try, expired_duration, content_id, metadata } = req.body;

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
    typeof max_try !== "number" ||
    typeof expired_duration !== "number" ||
    typeof content_id !== "string"
  )
    return res.status(400).json({ error: "Invalid body" });

  const request = db.smartGetVerificationRequest(
    clientId,
    max_try,
    expired_duration,
    content_id,
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

  const status = db.getVerificationRequestStatus(request_id);
  if (!status) return res.status(404).json({ error: "Request not found" });

  res.json({
    session_id: status.session_id,
    expired_time: status.expired_time,
    nonce: status.nonce,
    status: status.status, // pending hoặc verified
    canRetry: status.canRetry,
  });
});

app.post("/qrcode/:request_id/refresh", (req, res) => {
  const { request_id } = req.params;

  const status = db.getVerificationRequestStatus(request_id);
  if (!status) return res.status(404).json({ error: "Request not found" });

  if (!status.canRetry) {
    return res.status(410).json({ error: "Cannot retry anymore" });
  }

  // Generate new session for retry
  const newSession = db.getNewVerificationRequestSession(request_id);
  if (!newSession) {
    return res.status(410).json({ error: "Cannot generate new session" });
  }

  res.json({
    session_id: newSession.session_id,
    expired_time: newSession.expired_time,
    nonce: newSession.nonce,
    status: newSession.status, // pending hoặc verified của request
    canRetry: newSession.canRetry,
  });
});

// --- SAuth Mobile APIs ---
app.post("/mobile/register-device", (req, res) => {
  const { data } = req.body;
  const decrypted = AESUtil.decrypt(data, "sauth-secret");
  const { public_key, signature, device_uuid, timestamp } =
    JSON.parse(decrypted);
  if (!public_key || !signature || !device_uuid || !timestamp)
    return res.status(400).json({ error: "Missing public_key or signature" });
  const message = `${device_uuid}:${timestamp}:${public_key}`;
  const isValidSignature = Ed25519Util.verify(message, signature, public_key);
  if (!isValidSignature)
    return res.status(400).json({ error: "Invalid signature" });
  const device = db.createDevice(public_key, device_uuid);
  res.json({ device_id: device.device_id });
});

app.post("/mobile/verify-qrcode", async (req, res) => {
  const { data } = req.body;
  const decrypted = AESUtil.decrypt(data, "sauth-secret");
  const { session_id, nonce, signature, device_id } = JSON.parse(decrypted);
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
  const expiredTime = foundRequest.request.expired_time;
  if (expiredTime < Date.now()) {
    return res.status(410).json({ error: "Session expired" });
  }
  // Verify signature
  const message = `${session_id}:${nonce}:${device_id}:${expiredTime}`;
  const isValidSignature = Ed25519Util.verify(
    message,
    signature,
    device.public_key
  );
  if (!isValidSignature)
    return res.status(400).json({ error: "Invalid signature" });
  // Update request with device_id and success status
  const request = db.updateVerificationRequest(
    foundRequest.request.request_id,
    {
      device_id,
      status: "verified",
    }
  );
  try {
    await sendResultToClient(foundRequest.client, request);
  } catch (error) {
    console.error("Error sending result to client:", error);
  }

  res.json({ status: "success", message: "QR code verified" });
});

async function sendResultToClient(client, request) {
  const apiUrl = client.webhook_url;
  const apiKey = client.api_key;
  const response = await axios.post(
    `${apiUrl}/webhook`,
    {
      request_id: request.request_id,
      status: request.status,
      device_id: request.device_id,
      metadata: request.metadata,
    },
    {
      headers: {
        api_key: apiKey,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

app.listen(PORT, () => {
  console.log(`SAuth Node backend running on port ${PORT}`);
});
