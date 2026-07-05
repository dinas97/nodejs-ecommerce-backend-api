# Node.js Ecommerce Backend API

A full-featured RESTful Ecommerce API built with **Node.js**, **Express**, and **MongoDB**.
Built as part of a 4-week hands-on backend training program (SEF Academy).

Covers the complete lifecycle of an online store — user authentication, product management,
cart, orders, payments, and an admin dashboard.

---

## 🚧 Project Status

This project is being built section by section. Current progress:

| Section | Status |
|---|---|
| Authentication (`/auth`) | ✅ Completed & tested |
| Users (`/users`) | ⏳ In progress |
| Products (`/products`) | ⏳ Planned |
| Cart (`/carts`) | ⏳ Planned |
| Orders (`/orders`) | ⏳ Planned |
| Wishlist (`/wishlists`) | ⏳ Planned |
| Admin Dashboard (`/admin`) | ⏳ Planned |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Server-side JavaScript runtime |
| Express.js | Web framework — routing, middleware, error handling |
| MongoDB | NoSQL document database |
| Mongoose | ODM — schemas, models, validation, hooks |
| JWT | Stateless authentication tokens |
| bcryptjs | Secure password & OTP hashing |
| Joi | Request data validation |
| Nodemailer | Email sending (OTP verification, password reset) |
| dotenv | Environment variable management |
| cors | Cross-Origin Resource Sharing |
| cookie-parser | Cookie parsing |
| morgan | HTTP request logging |

---

## 📁 Project Structure

```
nodejs-ecommerce-backend-api/
├── config/            → Cloudinary setup (upcoming)
├── models/             → Mongoose schemas and models
│   ├── User.model.js
│   ├── OTP.model.js
│   ├── Product.model.js
│   ├── Order.model.js
│   ├── Cart.model.js
│   └── Wishlist.model.js
├── controllers/        → Business logic for every resource
├── DB/                  → Database connection
│   └── connection.js
├── routes/              → Express route definitions
│   └── auth.routes.js
├── middleware/          → Auth guard, validation, error handling
│   ├── auth.js
│   └── validate.js
├── utils/               → Helper functions
│   ├── generateOTP.js
│   ├── generateToken.js
│   └── sendEmail.js
├── validation/          → Joi validation schemas
│   └── userValidation.js
├── postman/             → Postman collection for API testing
│   └── Ecommerce-API.postman_collection.json
├── index.js             → App entry point
├── .env.example         → Environment variables template
└── package.json
```

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/nodejs-ecommerce-backend-api.git
cd nodejs-ecommerce-backend-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

See the [Environment Variables](#-environment-variables) section below for details on each value.

### 4. Run the server

```bash
npm run dev
```

If everything is configured correctly, you should see:

```
Server running on port 5000
MongoDB Connected: <your-cluster-host>
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root with the following:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/ecommerce

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

# Email (Nodemailer) — used for OTP verification and password reset
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

> **Note:** For Gmail, `EMAIL_PASS` must be a Google **App Password**, not your regular account password.
> Generate one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
> (requires 2-Step Verification to be enabled on your Google account).

---

## 📡 API Endpoints — Authentication (`/auth`)

Base URL: `http://localhost:5000`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register/send-otp` | Register a new user — sends a verification OTP by email | Public |
| POST | `/auth/verify-otp` | Verify the OTP and activate the account (no token returned — log in afterward) | Public |
| POST | `/auth/login` | Log in — returns a signed JWT | Public |
| POST | `/auth/logout` | Log out the current user | Private |
| POST | `/auth/forgotpassword/send-otp` | Request a password reset — sends a crypto reset token by email | Public |
| POST | `/auth/forgotpassword/verify-otp` | Verify the reset token (`token` field) and set a new password | Public |
| GET | `/auth/me` | Get the authenticated user's profile | Private |

**Private routes** require an `Authorization` header:
```
Authorization: Bearer <token>
```

---

## 🧪 Testing with Postman

A ready-to-use Postman collection is included at:

```
postman/Ecommerce-API.postman_collection.json
```

It contains 8 requests covering the full authentication flow (health check, register,
verify OTP, login, get profile, logout, and password reset), with saved example responses.

**To use it:**
1. Open Postman
2. Click **Import**
3. Select `postman/Ecommerce-API.postman_collection.json`
4. Make sure the server is running locally on `http://localhost:5000`
5. Run the requests in order (Register → Verify OTP → Login → ...)

---

## 🔒 Security Notes

- Passwords and registration OTP codes are hashed with `bcryptjs` before being stored — never stored in plain text.
- Password reset uses a **crypto-generated token** (via Node's built-in `crypto` module), stored as a SHA-256 hash directly on the `User` document (`resetPasswordToken`, `resetPasswordExpire`) — not the OTP collection.
- Sensitive fields (`password`, `resetPasswordToken`) use Mongoose's `select: false` so they're
  never returned by default in queries.
- Registration OTP documents use a MongoDB **TTL index**, so expired codes are automatically deleted by the database.
- The JWT is only ever issued at `/auth/login` — verifying the registration OTP does **not** return a token; the user must log in afterward.
- `.env` is excluded from version control via `.gitignore` — never commit real credentials.

---

## 📄 License

This project was built for educational purposes as part of the SEF Academy backend training program.
