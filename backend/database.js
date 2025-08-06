// Simple file-based database for SAuth
import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "database.json");

// Initialize database structure
const initDB = {
  clients: [],
  devices: [],
  verification_requests: [],
};

// Load database from file
export function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      saveDB(initDB);
      return initDB;
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading database:", error);
    return initDB;
  }
}

// Save database to file
export function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving database:", error);
  }
}

// Generate random string
export function randomString(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// Client operations
export function createClient(
  name,
  webhook_url,
  enable_datadome,
  enable_recaptcha
) {
  const db = loadDB();
  const client = {
    client_id: randomString(64),
    client_secret: randomString(64),
    api_key: randomString(32),
    name,
    webhook_url,
    enable_datadome,
    enable_recaptcha,
    created_at: new Date().toISOString(),
  };
  db.clients.push(client);
  saveDB(db);
  return client;
}

export function findClientById(client_id) {
  const db = loadDB();
  return db.clients.find((c) => c.client_id === client_id);
}

export function updateClient(
  client_id,
  { name, webhook_url, enable_datadome, enable_recaptcha }
) {
  const db = loadDB();
  const clientIndex = db.clients.findIndex((c) => c.client_id === client_id);
  if (clientIndex !== -1) {
    db.clients[clientIndex].name = name || db.clients[clientIndex].name;
    db.clients[clientIndex].webhook_url =
      webhook_url || db.clients[clientIndex].webhook_url;
    db.clients[clientIndex].enable_datadome =
      enable_datadome != undefined
        ? enable_datadome
        : db.clients[clientIndex].enable_datadome;
    db.clients[clientIndex].enable_recaptcha =
      enable_recaptcha != undefined
        ? enable_recaptcha
        : db.clients[clientIndex].enable_recaptcha;
    db.clients[clientIndex].updated_at = new Date().toISOString();
    saveDB(db);
    return true;
  }
  return false;
}

export function getAllClients() {
  const db = loadDB();
  return db.clients;
}

export function deleteClient(client_id) {
  const db = loadDB();
  const clientIndex = db.clients.findIndex((c) => c.client_id === client_id);
  if (clientIndex !== -1) {
    db.clients.splice(clientIndex, 1);
    saveDB(db);
    return true;
  }
  return false;
}

// Verification request operations
export function getVerificationRequest(
  client_id,
  allow_refresh,
  max_try,
  expired_duration,
  content_id,
  metadata
) {
  const db = loadDB();
  const client = db.clients.find((c) => c.client_id === client_id);
  if (!client) return null;
  const existedRequest = db.verification_requests.find(
    (r) => r.content_id === content_id
  );
  if (existedRequest) {
    existedRequest.request_id = "req_" + randomString(32);
    existedRequest.allow_refresh = allow_refresh;
    existedRequest.max_try = max_try;
    existedRequest.expired_duration = expired_duration;
    existedRequest.metadata = metadata;
    existedRequest.updated_at = new Date().toISOString();
    saveDB(db);
    return existedRequest;
  } else {
    const request = {
      request_id: "req_" + randomString(32),
      client_id,
      device_id: null,
      status: "pending",
      created_at: new Date().toISOString(),
      allow_refresh,
      max_try,
      expired_duration,
      content_id,
      metadata,
    };

    db.verification_requests.push(request);
    saveDB(db);
    return request;
  }
}

export function getVerificationRequestSession(request_id) {
  const db = loadDB();
  const requestIndex = db.verification_requests.findIndex(
    (r) => r.request_id === request_id
  );
  if (requestIndex === -1) return null;

  const request = db.verification_requests[requestIndex];
  if (
    (!request.allow_refresh && request.session_id != null) ||
    request.status == "verified"
  ) {
    return request;
  }

  request.session_id = "sess_" + randomString(32);
  request.nonce = randomString(16);
  request.expired_time = new Date(
    Date.now() + (request.expired_duration || 300) * 1000
  ).toISOString();

  db.verification_requests[requestIndex] = request;
  saveDB(db);
  return request;
}

export function updateVerificationRequest(request_id, { device_id, status }) {
  const db = loadDB();
  const requestIndex = db.verification_requests.findIndex(
    (r) => r.request_id === request_id
  );
  if (requestIndex !== -1) {
    db.verification_requests[requestIndex].device_id =
      device_id || db.verification_requests[requestIndex].device_id;
    db.verification_requests[requestIndex].status =
      status || db.verification_requests[requestIndex].status;
    db.verification_requests[requestIndex].updated_at =
      new Date().toISOString();
    saveDB(db);
    return true;
  }
  return false;
}

export function findVerificationRequestBySession(session_id, nonce) {
  const db = loadDB();
  const request = db.verification_requests.find(
    (r) => r.session_id === session_id && r.nonce === nonce
  );
  if (!request) return null;

  const client = db.clients.find((c) => c.client_id === request.client_id);
  return { client, request };
}

export function getClientVerificationRequests(client_id) {
  const db = loadDB();
  return db.verification_requests.filter((r) => r.client_id === client_id);
}

// Device operations
export function createDevice(public_key, signature, device_info) {
  const db = loadDB();
  const device = {
    device_id: "dev_" + randomString(32),
    public_key,
    signature,
    device_info,
    uuid: randomString(36),
    created_at: new Date().toISOString(),
  };
  db.devices.push(device);
  saveDB(db);
  return device;
}

export function findDeviceById(device_id) {
  const db = loadDB();
  return db.devices.find((d) => d.device_id === device_id);
}

export function validateApiKey(api_key) {
  const db = loadDB();
  return db.clients.find((c) => c.api_key === api_key);
}
