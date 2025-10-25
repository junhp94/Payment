import { useEffect, useRef, useState } from "react";
import "./App.css";

const PRESETS = ["10", "25", "50", "100", "250", "Other"];

export default function App() {
  const [amount, setAmount] = useState("50");
  const [useOther, setUseOther] = useState(false);
  const [otherAmount, setOtherAmount] = useState("");

  const [program, setProgram] = useState("General");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("Canada");

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [orderId] = useState(() => `FD-${Date.now()}`);

  const [showPayment, setShowPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // ✅ For success/error message

  const hostedFormLoadedRef = useRef(false);

  function validate() {
    const e = {};
    const amtStr = useOther ? otherAmount : amount;
    const val = Number(amtStr);
    if (!amtStr || Number.isNaN(val) || val <= 0) e.amount = "Enter a valid amount.";
    if (!name.trim()) e.name = "Name is required.";
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) e.email = "Valid email is required.";
    return e;
  }

  async function onProceed(e) {
    e.preventDefault();
    const eMap = validate();
    setErrors(eMap);
    if (Object.keys(eMap).length > 0) return;

    setSubmitting(true);
    setShowPayment(true);
  }

  // ✅ Initialize Hosted Tokenization when payment section is shown
  useEffect(() => {
    if (!showPayment || hostedFormLoadedRef.current) return;
    hostedFormLoadedRef.current = true;

    const hf = window?.HostedForm;

    if (!hf) {
      setPaymentStatus({ error: true, message: "HostedForm script not found. Check index.html." });
      return;
    }

    window.HostedForm.init({
      profile_id: "ht16O7YEHBAAXMV",
      environment: "qa",
      target: "monerisCheckout",
      display: "iframe",
      callback: async function (response) {
        if (response?.data_key) {
          setPaymentStatus(null); // Clear previous state

          const requestBody = {
            data_key: response.data_key,
            amount: Number(useOther ? otherAmount : amount).toFixed(2),
            orderId,
          };

          try {
            const res = await fetch("/api/checkout/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody),
            });

            const result = await res.json();

            if (result.success) {
              setPaymentStatus({ success: true, message: "✅ Payment successful! Thank you!" });
            } else {
              throw new Error(result?.error || "Payment failed");
            }
          } catch (err) {
            setPaymentStatus({ error: true, message: "❌ Payment failed. Please try again." });
          }
        } else {
          setPaymentStatus({ error: true, message: "❌ Failed to retrieve payment token." });
        }
      },
    });
  }, [showPayment]);

  const disabled = submitting || showPayment;

  return (
    <div className="wrap">
      <header className="header">
        <h1 className="title">Donate to CJSF 90.1FM</h1>
      </header>

      <form className="card" onSubmit={onProceed} aria-labelledby="donationForm">
        <h2 id="donationForm" className="sectionTitle">Donation Amount</h2>

        <div className="presetRow" role="group" aria-label="Select donation amount">
          {PRESETS.map((p) => {
            const isOther = p === "Other";
            const selected = !useOther && amount === p;
            return (
              <button
                key={p}
                type="button"
                className={`pill ${selected ? "pill--active" : ""}`}
                disabled={disabled}
                onClick={() => {
                  if (isOther) {
                    setUseOther(true);
                    setAmount("Other");
                  } else {
                    setUseOther(false);
                    setAmount(p);
                    setOtherAmount("");
                  }
                }}
              >
                {isOther ? "Other" : `$${p}`}
              </button>
            );
          })}
        </div>

        {useOther && (
          <div className="fieldRow">
            <label className="label" htmlFor="otherAmount">Other amount (CAD)</label>
            <input
              id="otherAmount"
              type="number"
              step="0.01"
              min="1"
              inputMode="decimal"
              className={`input ${errors.amount ? "input--error" : ""}`}
              placeholder="e.g., 35.00"
              value={otherAmount}
              onChange={(e) => setOtherAmount(e.target.value)}
              disabled={disabled}
            />
            {errors.amount && <div className="error">{errors.amount}</div>}
          </div>
        )}

        {!useOther && errors.amount && <div className="error">{errors.amount}</div>}

        <div className="divider" />

        <h2 className="sectionTitle">Program Designation (optional)</h2>
        <div className="fieldRow">
          <label className="label" htmlFor="program">Program</label>
          <select
            id="program"
            className="select"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            disabled={disabled}
          >
            <option>General</option>
            <option>News & Public Affairs</option>
            <option>Music Programming</option>
            <option>Training & Workshops</option>
            <option>Special Projects</option>
          </select>
        </div>

        <div className="divider" />

        <h2 className="sectionTitle">Your Information</h2>

        {/* Your full form stays as-is here */}
        {/* I did not change any of your input fields */}

        <div className="grid2">
          <div className="fieldCol">
            <label className="label" htmlFor="name">Full Name</label>
            <input
              id="name"
              className={`input ${errors.name ? "input--error" : ""}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={disabled}
              placeholder="Jane Doe"
              autoComplete="name"
            />
            {errors.name && <div className="error">{errors.name}</div>}
          </div>

          <div className="fieldCol">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={`input ${errors.email ? "input--error" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={disabled}
              placeholder="jane@example.com"
              autoComplete="email"
            />
            {errors.email && <div className="error">{errors.email}</div>}
          </div>
        </div>

        <div className="grid2">
          <div className="fieldCol">
            <label className="label" htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={disabled}
              placeholder="(xxx) xxx-xxxx"
              autoComplete="tel"
            />
          </div>
        </div>

        <div className="grid2">
          <div className="fieldCol">
            <label className="label" htmlFor="addr1">Address Line 1</label>
            <input
              id="addr1"
              className="input"
              value={addr1}
              onChange={(e) => setAddr1(e.target.value)}
              disabled={disabled}
              placeholder="123 University Dr."
              autoComplete="address-line1"
            />
          </div>
          <div className="fieldCol">
            <label className="label" htmlFor="addr2">Address Line 2 (optional)</label>
            <input
              id="addr2"
              className="input"
              value={addr2}
              onChange={(e) => setAddr2(e.target.value)}
              disabled={disabled}
              placeholder="Apt / Suite"
              autoComplete="address-line2"
            />
          </div>
        </div>

        <div className="grid3">
          <div className="fieldCol">
            <label className="label" htmlFor="city">City</label>
            <input
              id="city"
              className="input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={disabled}
              autoComplete="address-level2"
            />
          </div>
          <div className="fieldCol">
            <label className="label" htmlFor="province">Province/State</label>
            <input
              id="province"
              className="input"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              disabled={disabled}
              autoComplete="address-level1"
            />
          </div>
          <div className="fieldCol">
            <label className="label" htmlFor="postal">Postal/ZIP</label>
            <input
              id="postal"
              className="input"
              value={postal}
              onChange={(e) => setPostal(e.target.value)}
              disabled={disabled}
              autoComplete="postal-code"
            />
          </div>
        </div>

        <div className="fieldRow">
          <label className="label" htmlFor="country">Country</label>
          <input
            id="country"
            className="input"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={disabled}
            autoComplete="country-name"
          />
        </div>

        <div className="ctaRow">
          <button
            type="submit"
            className="btnPrimary"
            disabled={disabled}
            aria-disabled={disabled}
          >
            {submitting || showPayment ? "Proceeding…" : "Proceed to Secure Payment"}
          </button>
          <div className="note">Card processing is handled securely by Moneris.</div>
        </div>
      </form>

      {/* ✅ Hosted Payment Section */}
      {showPayment && (
        <section className="card paymentCard" aria-live="polite">
          <h2 className="sectionTitle">Secure Payment</h2>
          <p className="muted">
            Order ID: <strong>{orderId}</strong> — Amount:{" "}
            <strong>${useOther ? Number(otherAmount).toFixed(2) : Number(amount).toFixed(2)} CAD</strong>
          </p>
          <div id="monerisCheckout" className="monerisBox" />

          {/* ✅ Success or Error Messages */}
          {paymentStatus?.success && (
            <p className="successMessage">{paymentStatus.message}</p>
          )}
          {paymentStatus?.error && (
            <p className="errorMessage">{paymentStatus.message}</p>
          )}
        </section>
      )}

      <footer className="footer">
        <p className="mutedSmall">© {new Date().getFullYear()} CJSF 90.1FM</p>
      </footer>
    </div>
  );
}
