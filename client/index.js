const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use(express.static("web"));

let memory = {};

app.post("/verify", async (req, res) => {
  const { lot_id } = req.body;
  if (!lot_id) {
    return res.status(400).json({ error: "Missing lot_id in body" });
  }
  try {
    const apiUrl = process.env.VERIFY_API_HOST;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const response = await axios.post(
      `${apiUrl}/verification-request`,
      {
        allow_refresh: true,
        max_try: 5,
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
    memory[lot_id] = {
      request_id: response.data.request_id,
      status: "need_verification",
    };
    res.status(200).json(response.data.url);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/check", (req, res) => {
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
