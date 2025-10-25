import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fetch from "node-fetch"; // Make sure this is installed: npm install node-fetch@2

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

// Replace your old mock route with this:
app.post("/api/checkout/preload", async (req, res) => {
  const { amount, orderId } = req.body;

  try {
    const response = await fetch("https://esqa.moneris.com/chktv2/request/request.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store_id: "store3",
        api_token: "yesguy",
        checkout_id: "chktGYYG4tore3", // Ensure this matches exactly
        txn_total: Number(amount).toFixed(2),
        order_no: orderId,
        environment: "qa",
      }),
    });

    const rawText = await response.text(); // Read as text first
    console.log("🚀 Raw Moneris Response:", rawText); // We'll inspect this

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      return res.status(400).json({
        error: "Moneris did not return JSON (likely a bad checkout_id or store credentials)",
        raw: rawText, // send back raw response so we can review
      });
    }

    const ticket = data?.response?.ticket || data?.ticket;
    if (!ticket) {
      return res.status(400).json({
        error: "No ticket received from Moneris",
        raw: data,
      });
    }

    res.json({ ticket }); // success
  } catch (err) {
    console.error("Moneris preload error:", err);
    res.status(500).json({ error: "Failed to preload checkout" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
