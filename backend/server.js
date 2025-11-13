// server.js - Backend Node.js/Express Server with ES6 Modules
// Jun Hyeok Park
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

// Moneris Configuration - TEST ENVIRONMENT
const MONERIS_CONFIG = {
  store_id: process.env.MONERIS_STORE_ID || "store3",
  api_token: process.env.MONERIS_API_TOKEN || "yesguy",
  checkout_id: process.env.MONERIS_CHECKOUT_ID || "chktY786Gtore3",
  gateway_url: "https://gatewayt.moneris.com/chktv2/request/request.php",
  environment: "qa" // Test mode
};

/**
 * STEP 1: REAL CALL to Moneris QA
 * POST /api/moneris/preload
 * Creates a Moneris Checkout preload request and returns a ticket
 */
app.post("/api/moneris/preload", async (req, res) => {
  try {
    const { amount, orderNo, contactDetails } = req.body;

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 11) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount. Must be between $0.01 and $11.00 for testing."
      });
    }

    // Preload request
    const preloadRequest = {
      store_id: MONERIS_CONFIG.store_id,
      api_token: MONERIS_CONFIG.api_token,
      checkout_id: MONERIS_CONFIG.checkout_id,
      txn_total: amount,
      environment: MONERIS_CONFIG.environment,
      action: "preload",
      order_no: orderNo || `DON-${Date.now()}`,
      cust_id: `CUST-${Date.now()}`,
      dynamic_descriptor: "Donation",
      language: "en",
      
      // Contact details
      contact_details: {
        first_name: contactDetails?.first_name || "",
        last_name: contactDetails?.last_name || "",
        email: contactDetails?.email || "",
        phone: contactDetails?.phone || ""
      },

      // Billing details (need it for payment)
      billing_details: {
        first_name: contactDetails?.first_name || "",
        last_name: contactDetails?.last_name || "",
        address_1: "123 Main Street",
        city: "Toronto",
        province: "ON",
        country: "CA",
        postal_code: "M1M1M1"
      },

      // Ask for CVV
      ask_cvv: "Y"
    };

    console.log("Sending preload request to Moneris:", {
      ...preloadRequest,
      api_token: "***" // Hide token in logs
    });

    // Make request to Moneris Gateway
    const monerisResponse = await fetch(MONERIS_CONFIG.gateway_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preloadRequest)
    });

    const data = await monerisResponse.json();

    console.log("Moneris preload response:", data);

    // Check if preload was successful
    if (data && data.response) {
      const response = data.response;
      
      if (response.success === "true" && response.ticket) {
        console.log("Ticket generated successfully:", response.ticket);
        return res.json({
          success: true,
          ticket: response.ticket,
          order_no: preloadRequest.order_no,
          amount: amount
        });
      } else {
        console.error("Preload failed:", response.error || response);
        return res.status(400).json({
          success: false,
          error: response.error || "Failed to create payment ticket",
          details: response
        });
      }
    } else {
      console.error("Invalid response structure from gateway");
      return res.status(500).json({
        success: false,
        error: "Invalid response from payment gateway"
      });
    }

  } catch (error) {
    console.error("Preload error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to initialize payment",
      details: error.message
    });
  }
});

/**
 * POST /api/moneris/receipt
 * Receives and validates the payment receipt from Moneris
 */
app.post("/api/moneris/receipt", async (req, res) => {
  try {
    const { ticket, response } = req.body;

    console.log("Received payment receipt:", {
      ticket,
      success: response?.success,
      order_no: response?.request?.order_no
    });

    // Production Instruction
    // 1. Verify the response signature
    // 2. Check the transaction status
    // 3. Store the transaction in your database
    // 4. Send confirmation email
    // 5. Update any related records

    // Basic validation
    if (response && response.success === "true") {
      // Extract important details
      const receiptData = {
        success: true,
        order_no: response.request?.order_no,
        transaction_no: response.receipt?.cc?.transaction_no,
        reference_no: response.receipt?.cc?.reference_no,
        amount: response.request?.cc_total,
        card_type: response.receipt?.cc?.card_type,
        auth_code: response.receipt?.cc?.approval_code,
        response_code: response.receipt?.cc?.response_code,
        transaction_date: response.receipt?.cc?.transaction_date_time
      };

      console.log("Payment successful:", receiptData);

      // TODO: Store in database
      // await storeTransaction(receiptData);

      // TODO: Send confirmation email
      // await sendConfirmationEmail(receiptData);

      return res.json({
        success: true,
        message: "Payment processed successfully",
        receipt: receiptData
      });
    } else {
      console.error("Payment was not successful:", response);
      return res.status(400).json({
        success: false,
        error: "Payment was not successful",
        details: response
      });
    }

  } catch (error) {
    console.error("Receipt processing error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to process payment receipt"
    });
  }
});

/**
 * STEP 2: Final transaction handler
 * POST /api/checkout/complete
 * Alternative endpoint for payment completion
 */
app.post("/api/checkout/complete", async (req, res) => {
  console.log("Payment completion payload (from frontend event):", req.body);
  
  // You can process the payment data here
  // Similar to /api/moneris/receipt endpoint
  
  return res.json({ 
    ok: true,
    message: "Payment completion received"
  });
});

/**
 * GET /api/moneris/config
 * Returns public configuration (for debugging)
 */
app.get("/api/moneris/config", (req, res) => {
  res.json({
    environment: MONERIS_CONFIG.environment,
    store_id: MONERIS_CONFIG.store_id,
    gateway_url: MONERIS_CONFIG.gateway_url,
    checkout_id_configured: MONERIS_CONFIG.checkout_id !== "chktY786Gtore3"
  });
});

/**
 * GET /health
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: MONERIS_CONFIG.environment
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 Moneris QA Payments API                                ║
║  Port: ${PORT}                                             ║
║  Environment: TEST (QA)                                    ║
║  Store ID: ${MONERIS_CONFIG.store_id}                      ║
║                                                            ║
║  📍 Endpoints:                                             ║
║  POST /api/moneris/preload - Get payment ticket           ║
║  POST /api/moneris/receipt - Process payment receipt      ║
║  POST /api/checkout/complete - Alternative completion     ║
║  GET  /api/moneris/config - View configuration            ║
║  GET  /health - Health check                              ║
║                                                            ║
║  ⚠️  IMPORTANT: Update CHECKOUT_ID in .env or code        ║
║  Get it from: https://esqa.moneris.com/mpg/               ║
║  Admin → Moneris Checkout Config → Create Profile         ║
╚════════════════════════════════════════════════════════════╝
  `);
  
  // Check if checkout_id is still default
  if (MONERIS_CONFIG.checkout_id === "chktAABBCC12345") {
    console.log(`
⚠️  WARNING: Using default checkout_id!
Please update with your actual Checkout ID.

Option 1: Set environment variable
  MONERIS_CHECKOUT_ID=your_actual_checkout_id

Option 2: Update .env file
  MONERIS_CHECKOUT_ID=your_actual_checkout_id

Option 3: Update code directly in server.js
    `);
  } else {
    console.log("Checkout ID configured");
  }
  
  console.log("\nServer ready at http://localhost:" + PORT);
});