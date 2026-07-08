# Node.js Ecommerce Backend API

A full-featured RESTful Ecommerce API built with **Node.js**, **Express**, and **MongoDB**.
Built as part of a 4-week hands-on backend training program (SEF Academy).

Covers the complete lifecycle of an online store — user authentication, user management,
product management, cart, orders, payments, and an admin dashboard.

---

## 🚧 Project Status

This project is being built section by section. Current progress:

| Section | Status |
|---|---|
| Authentication (`/auth`) | ✅ Completed & tested |
| Refresh Token flow | ✅ Completed & tested |
| Users (`/users`) | ✅ Completed & tested |
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
| JWT | Stateless authentication — short-lived access tokens + long-lived refresh tokens |
| bcryptjs | Secure password & OTP hashing |
| crypto (built-in) | Secure random token generation for password reset |
| Joi | Request data validation |
| Nodemailer | Email sending (OTP verification, password reset) |
| Cloudinary | Cloud image storage — used for user avatars |
| Multer | Handling `multipart/form-data` (image uploads) |
| dotenv | Environment variable management |
| cors | Cross-Origin Resource Sharing |
| cookie-parser | Parsing the refresh token cookie |
| morgan | HTTP request logging |

---

## 📁 Project Structure

```
nodejs-ecommerce-backend-api/
├── config/
│   └── cloudinary.js         → Cloudinary configuration
├── models/                    → Mongoose schemas and models
│   ├── User.model.js
│   ├── OTP.model.js
│   ├── Product.model.js
│   ├── Order.model.js
│   ├── Cart.model.js
│   └── Wishlist.model.js
├── controllers/                → Business logic for every resource
│   ├── authController.js
│   └── userController.js
├── DB/
│   └── connection.js            → Database connection
├── routes/                       → Express route definitions
│   ├── auth.routes.js
│   └── user.routes.js
├── middleware/                    → Auth guard, admin guard, validation, upload
│   ├── auth.js
│   ├── adminOnly.js
│   ├── validate.js
│   └── upload.js
├── utils/                          → Helper functions
│   ├── generateOTP.js
│   ├── generateToken.js
│   ├── generateRefreshToken.js
│   ├── generateResetToken.js
│   ├── sendEmail.js
│   └── uploadToCloudinary.js
├── validation/                      → Joi validation schemas
│   └── userValidation.js
├── postman/                          → Postman collection for API testing
│   └── Ecommerce-API.postman_collection.json
├── index.js                           → App entry point
├── .env.example                       → Environment variables template
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

# JWT — short-lived access token
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=15m

# JWT — long-lived refresh token (must be a DIFFERENT secret than JWT_SECRET)
REFRESH_TOKEN_SECRET=a_different_super_secret_key_here
REFRESH_TOKEN_EXPIRE=7d

# Email (Nodemailer) — used for OTP verification and password reset
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Cloudinary — used for user avatar uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note:** For Gmail, `EMAIL_PASS` must be a Google **App Password**, not your regular account password.
> Generate one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
> (requires 2-Step Verification to be enabled on your Google account).

> **Note:** `JWT_SECRET` and `REFRESH_TOKEN_SECRET` must be two different values. If they were the
> same, a stolen access token could be used to forge a refresh token, defeating the purpose of
> having two separate tokens.

---

## 📡 API Endpoints — Authentication (`/auth`)

Base URL: `http://localhost:5000`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register/send-otp` | Register a new user — sends a verification OTP by email | Public |
| POST | `/auth/verify-otp` | Verify the OTP and activate the account (no token returned — log in afterward) | Public |
| POST | `/auth/login` | Log in — returns an access token (body) + refresh token (httpOnly cookie) | Public |
| POST | `/auth/refresh-token` | Issue a new access token using the refresh token cookie | Public (cookie) |
| POST | `/auth/logout` | Log out — clears the refresh token cookie | Private |
| POST | `/auth/forgotpassword/send-otp` | Request a password reset — sends a crypto reset token by email | Public |
| POST | `/auth/forgotpassword/verify-otp` | Verify the reset token (`token` field), set a new password, and auto-log-in | Public |
| GET | `/auth/me` | Get the authenticated user's profile | Private |

---

## 📡 API Endpoints — Users (`/users`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/users/add` | Create a user directly (no OTP needed) | Admin |
| GET | `/users/all` | Get all users | Admin |
| GET | `/users/:id` | Get a single user by ID | Admin |
| PATCH | `/users/:id` | Update own profile — `username`, `phone`, `addresses`, `avatar` (multipart/form-data) | Owner only |
| DELETE | `/users/:id` | Delete a user | Admin |
| POST | `/users/change-password` | Change own password — requires `currentPassword` + `newPassword` | Owner only |

**Notes:**
- The `PATCH /users/:id` route must be sent as `multipart/form-data` (not raw JSON) since it accepts
  an optional avatar image file. Password and email cannot be changed through this route.
- `POST /users/change-password` always acts on the logged-in user (`req.user`) — there is no way to
  target another user's account, so an admin can never change another user's password through this route.
- Admin-only routes require the authenticated user's role to be `admin`. There is no public endpoint
  to self-promote to admin — this must be done directly in the database.

**Private routes** require an `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## 🔁 Refresh Token Flow

To avoid forcing users to log in every time their session expires, the API uses two tokens:

| Token | Lifespan | Where it lives | Purpose |
|---|---|---|---|
| Access Token | Short (15 min) | Returned in the JSON response body | Sent with every authenticated request |
| Refresh Token | Long (7 days) | `httpOnly` cookie (not readable by JavaScript) | Used only to request a new access token |

**Typical flow:**
1. User logs in → receives an access token + a refresh token cookie is set automatically.
2. Client uses the access token for authenticated requests.
3. When the access token expires, the client calls `POST /auth/refresh-token` (the cookie is sent
   automatically by the browser/Postman) to get a new access token — without re-entering credentials.
4. On logout, the refresh token cookie is cleared.

---

## 🧪 Testing with Postman

A ready-to-use Postman collection is included at:

```
postman/Ecommerce-API.postman_collection.json
```

It covers the full authentication flow (register, verify OTP, login, refresh token, logout,
password reset) and the full users flow (add, get all, get by id, update profile with avatar,
change password, delete), with saved example responses.

**To use it:**
1. Open Postman
2. Click **Import**
3. Select `postman/Ecommerce-API.postman_collection.json`
4. Make sure the server is running locally on `http://localhost:5000`
5. Log in first to get an access token, then use it in the `Authorization` header (as `Bearer <token>`)
   for any private route

> To test admin-only routes, manually set a user's `role` field to `"admin"` in MongoDB Atlas —
> there is no API endpoint that grants admin access.

---

## 🔒 Security Notes

- Passwords and registration OTP codes are hashed with `bcryptjs` before being stored — never stored in plain text.
- Password reset uses a **crypto-generated token** (via Node's built-in `crypto` module), stored as a SHA-256 hash directly on the `User` document (`resetPasswordToken`, `resetPasswordExpire`) — not the OTP collection.
- Changing your own password requires your **current password** — no email or OTP step is involved, since the user is already authenticated.
- Sensitive fields (`password`, `resetPasswordToken`) use Mongoose's `select: false` so they're never returned by default in queries.
- The `role` field is never included in any API response body — it's only ever embedded (encoded) inside the JWT itself, which the server decodes internally. Clients never see it directly.
- Registration OTP documents use a MongoDB **TTL index**, so expired codes are automatically deleted by the database.
- The access token is only ever issued at `/auth/login` (or after a successful password reset) — verifying the registration OTP does **not** return a token; the user must log in afterward.
- The refresh token is stored in an `httpOnly` cookie, signed with a secret separate from the access token's secret — this limits the damage if one secret is ever compromised.
- Uploaded avatar images are streamed directly to Cloudinary (never saved to local disk), and the previous avatar is deleted from Cloudinary when a new one is uploaded.
- `.env` is excluded from version control via `.gitignore` — never commit real credentials.

---

## 📄 License

This project was built for educational purposes as part of the SEF Academy backend training program.
