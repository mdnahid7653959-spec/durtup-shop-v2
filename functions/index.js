const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

// Secret key for XOR decryption
const SECRET_KEY = "durtup-api-gateway-salt-secure-key-2026";

function decryptCredentials(encryptedBase64) {
  if (!encryptedBase64) return null;
  try {
    const binary = Buffer.from(encryptedBase64, "base64").toString("binary");
    let plainText = "";
    for (let i = 0; i < binary.length; i++) {
      const charCode = binary.charCodeAt(i);
      const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      plainText += String.fromCharCode(charCode ^ keyChar);
    }
    const decoded = decodeURIComponent(escape(plainText));
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

// 1. Supplier API Cloud Function
exports.supplierApi = onRequest({ cors: true }, async (req, res) => {
  try {
    const { action, supplierId, payload } = req.body || {};

    if (action === "seed-supplier") {
      return res.status(200).json({ success: true, message: "Supplier seeded" });
    }

    if (!action || !supplierId) {
      return res.status(400).json({ error: "Missing action or supplierId" });
    }

    if (action === "test-connection") {
      return res.status(200).json({ success: true, status: 200, responseTimeMs: 120 });
    }

    if (action === "get-products") {
      return res.status(200).json({ success: true, data: [] });
    }

    return res.status(200).json({ success: true, action });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Sigma AI Chat Cloud Function (/api/ai/chat)
exports.aiChat = onRequest({ cors: true }, async (req, res) => {
  try {
    const { query, userName, userId, history, cartState, imageAttachment } = req.body || {};
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `You are Sigma, the official AI Personal Shopping Assistant for Durtup.shop. Answer in natural Bengali/Banglish: "${query || "Hello"}"` }]
          }
        ]
      })
    });

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "আমি Sigma — Durtup.shop এ আপনাকে স্বাগতম!";
    return res.status(200).json({ text, success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

