import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fetch from "node-fetch"; // ensure node-fetch is installed: npm install node-fetch@2

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

// This endpoint will now complete a payment using the data_key from Hosted Tokenization
app.post("/api/checkout/complete", async (req, res) => {
  const { amount, orderId, data_key, custId = "CJSF_Donor" } = req.body;

  if (!amount || !orderId || !data_key) {
    return res.status(400).json({ error: "Missing amount, orderId, or data_key" });
  }

  // Create XML request for Moneris res_purchase_cc
  const xmlRequest = `
    <request>
      <store_id>${process.env.MONERIS_STORE_ID}</store_id>
      <api_token>${process.env.MONERIS_API_TOKEN}</api_token>
      <res_purchase_cc>
        <order_id>${orderId}</order_id>
        <cust_id>${custId}</cust_id>
        <data_key>${data_key}</data_key>
        <amount>${Number(amount).toFixed(2)}</amount>
        <crypt_type>7</crypt_type>
      </res_purchase_cc>
    </request>
  `;

  try {
    const monerisResponse = await fetch(process.env.MONERIS_PURCHASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xmlRequest,
    });

    const responseText = await monerisResponse.text();
    console.log("Moneris response:", responseText);

    // You can parse this XML, but for now we'll just send it back
    res.json({ success: true, moneris: responseText });

  } catch (error) {
    console.error("Error completing payment:", error);
    res.status(500).json({ error: "Payment failed", details: error.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Ready for Hosted Tokenization (res_purchase_cc flow)`);
});
