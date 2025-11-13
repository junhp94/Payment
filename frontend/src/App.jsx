// App.jsx - Simple Frontend React Application
import React, { useState, useEffect } from 'react';

function App() {
  const [orderId] = useState(`DON-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
  const [amount, setAmount] = useState('5.00');
  const [program, setProgram] = useState('');
  const [loading, setLoading] = useState(false);

  const preload = async () => {
    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid donation amount');
      return;
    }

    if (parsedAmount > 11) {
      alert('Test amounts must be $11.00 or less');
      return;
    }

    setLoading(true);

    try {
      // Call backend to get Moneris ticket
      const response = await fetch('http://localhost:4000/api/moneris/preload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount).toFixed(2),
          orderNo: orderId,
          contactDetails: {
            first_name: 'Test',
            last_name: 'Donor',
            email: 'test@example.com',
            phone: '4165551234'
          }
        })
      });

      const data = await response.json();

      if (data.success && data.ticket) {
        console.log('Ticket received:', data.ticket);
        
        // Initialize Moneris Checkout
        setTimeout(() => {
          initializeMonerisCheckout(data.ticket);
        }, 100);
      } else {
        alert(data.error || 'Failed to initialize payment. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      alert('Failed to connect to payment server. Please try again.');
      setLoading(false);
    }
  };

  const initializeMonerisCheckout = (ticketNumber) => {
    // Load Moneris script if not already loaded
    if (!window.monerisCheckout) {
      const script = document.createElement('script');
      script.src = 'https://gatewayt.moneris.com/chktv2/js/chkt_v2.00.js';
      script.async = true;
      script.onload = () => {
        startCheckout(ticketNumber);
      };
      document.head.appendChild(script);
    } else {
      startCheckout(ticketNumber);
    }
  };

  const startCheckout = (ticketNumber) => {
    const myCheckout = new window.monerisCheckout();
    
    myCheckout.setMode("qa"); // Test mode
    myCheckout.setCheckoutDiv("monerisCheckout");
    
    // Callback when payment is complete
    myCheckout.setCallback("payment_receipt", function(response) {
      console.log("Payment complete:", response);
      
      // Send receipt to backend
      fetch('http://localhost:4000/api/moneris/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket: ticketNumber,
          response: response
        })
      })
      .then(res => res.json())
      .then(data => {
        alert('Payment successful! Thank you for your donation.');
        window.location.reload();
      })
      .catch(err => {
        console.error('Receipt verification error:', err);
        alert('Payment successful! Thank you for your donation.');
        window.location.reload();
      });
    });
    
    // Callback when payment is cancelled
    myCheckout.setCallback("cancel_transaction", function() {
      console.log("Payment cancelled");
      alert('Payment was cancelled');
      setLoading(false);
      window.location.reload();
    });
    
    // Callback for errors
    myCheckout.setCallback("error_event", function(error) {
      console.error("Checkout error:", error);
      alert('An error occurred during checkout');
      setLoading(false);
    });
    
    // Start the checkout
    myCheckout.startCheckout(ticketNumber);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Donate to CJSF</h1>
      <p>Order ID: <strong>{orderId}</strong></p>

      <label>
        Donation Amount (max $11.00 for testing)
        <br />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          min="0.01"
          max="11.00"
          disabled={loading}
          style={{ width: "100%", marginTop: 6, marginBottom: 16, padding: 8 }}
        />
      </label>

      <label>
        Program (optional)
        <br />
        <input
          type="text"
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          disabled={loading}
          style={{ width: "100%", marginTop: 6, marginBottom: 16, padding: 8 }}
        />
      </label>

      <button 
        onClick={preload} 
        disabled={loading}
        style={{ 
          padding: 12, 
          background: loading ? "#666" : "black", 
          color: "white",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 16,
          width: "100%"
        }}
      >
        {loading ? 'Loading...' : 'Start Secure Payment'}
      </button>

      <div id="monerisCheckout" style={{ marginTop: 20, minHeight: 420 }} />
      
      <div style={{ 
        marginTop: 20, 
        padding: 12, 
        background: "#f0f0f0", 
        borderRadius: 4,
        fontSize: 14
      }}>
        <strong>Test Info:</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>Use amounts ending in .00 for approval (e.g., $5.00, $9.00)</li>
          <li>Test Visa: 4242424242424242</li>
          <li>Test Mastercard: 5454545454545454</li>
          <li>Expiry: Any future date (e.g., 12/25)</li>
          <li>CVV: Any 3 digits (e.g., 123)</li>
        </ul>
      </div>
    </div>
  );
}

export default App;