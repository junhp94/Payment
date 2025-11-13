# Donation Payment System 
React Frontend + Express Backend + Moneris Checkout (QA Test Mode)

This repository contains the payment system being developed for fun.  
It includes a **secure donation page** powered by **Moneris Checkout (MCO)** in QA mode, built with a modern React UI and an Express backend.

## Tech Stack

### Frontend
- React (Vite)
- Moneris Checkout v2.00 iframe
- Custom modern UI styling

### Backend
- Node.js + Express
- dotenv for environment management
- node-fetch for server-side Moneris calls
- Mock ticket support (safe for testing)

---

#### How the Donation Flow Works

1. User enters donation amount + optional program
2. Clicks Start Secure Payment
3. Frontend sends /api/checkout/preload
4. Backend returns a mock ticket (safe testing)
5. Moneris Checkout iframe loads (monerisCheckout div)
6. User enters test credit card info
7. Success / error handled through callbacks

## Moneris QA Test Cards

Use the following test card numbers while the application is running in Moneris QA mode (`qa`).  
**Do not use real credit cards.**

| Card Type | Card Number | Expiry | CVV |
|-----------|-------------|--------|-----|
| **Visa** | `4242 4242 4242 4242` | `12/49` | `111` |
| **Mastercard** | `5454 5454 5454 5454` | `12/49` | `111` |
| **Mastercard (BIN2 CAN)** | `2222 4000 4124 0011` | `12/49` | `123` |
| **Amex** | `3735 9900 5095 005` | `12/49` | `1111` |
| **JCB** | `3566 0077 7001 5365` | `12/49` | `111` |
| **Diners** | `3646 2462 7420 08` | `12/49` | `111` |
| **Discover** | `6011 0009 9292 7602` | `12/49` | `111` |
| **UnionPay** | `6250 9440 0000 0771` | `12/49` | `371` |
