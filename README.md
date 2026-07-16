# Node.js Ecommerce Backend API

A full-featured RESTful Ecommerce API built with **Node.js**, **Express**, and **MongoDB**.
Built as part of a 4-week hands-on backend training program (SEF Academy).

Covers the complete lifecycle of an online store — user authentication, user management,
product management, cart, orders, payments, and an admin dashboard.

---

## 🚧 Project Status

This project is being built section by section. Current progress:

| Section                    | Status                |
| -------------------------- | --------------------- |
| Authentication (`/auth`)   | ✅ Completed & tested |
| Refresh Token flow         | ✅ Completed & tested |
| Users (`/users`)           | ✅ Completed & tested |
| Products (`/products`)     | ✅ Completed & tested |
| Cart (`/carts`)            | ✅ Completed & tested |
| Wishlist (`/wishlists`)    | ✅ Completed & tested |
| Orders (`/orders`)         | ⏳ Planned            |
| Admin Dashboard (`/admin`) | ⏳ Planned            |

---

## 🛠️ Tech Stack

| Technology        | Purpose                                                                          |
| ----------------- | -------------------------------------------------------------------------------- |
| Node.js           | Server-side JavaScript runtime                                                   |
| Express.js        | Web framework — routing, middleware, error handling                              |
| MongoDB           | NoSQL document database                                                          |
| Mongoose          | ODM — schemas, models, validation, hooks                                         |
| JWT               | Stateless authentication — short-lived access tokens + long-lived refresh tokens |
| bcryptjs          | Secure password & OTP hashing                                                    |
| crypto (built-in) | Secure random token generation for password reset                                |
| Joi               | Request data validation                                                          |
| Nodemailer        | Email sending (OTP verification, password reset)                                 |
| Cloudinary        | Cloud image storage — used for user avatars                                      |
| Multer            | Handling `multipart/form-data` (image uploads)                                   |
| dotenv            | Environment variable management                                                  |
| cors              | Cross-Origin Resource Sharing                                                    |
| cookie-parser     | Parsing the refresh token cookie                                                 |
| morgan            | HTTP request logging                                                             |

---

## 📁 Project Structure

```
nodejs-ecommerce-backend-api/
├── config/
│   └── cloudinary.js         → Cloudinary configuration
├── constants/
│   └── coupons.js             → Static coupon codes for the cart
├── models/                    → Mongoose schemas and models
│   ├── User.model.js
│   ├── OTP.model.js
│   ├── Product.model.js
│   ├── Order.model.js
│   ├── Cart.model.js
│   └── Wishlist.model.js
├── controllers/                → Business logic for every resource
│   ├── authController.js
│   ├── userController.js
│   ├── productController.js
│   ├── cartController.js
│   └── wishlistController.js
├── DB/
│   └── connection.js            → Database connection
├── routes/                       → Express route definitions
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── product.routes.js
│   ├── cart.routes.js
│   └── wishlist.routes.js
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
│   ├── uploadToCloudinary.js
│   ├── uploadMultipleToCloudinary.js
│   └── deleteFromCloudinary.js
├── validation/                      → Joi validation schemas
│   ├── userValidation.js
│   └── productValidation.js
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

| Method | Endpoint                            | Description                                                                    | Auth            |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------ | --------------- |
| POST   | `/auth/register/send-otp`           | Register a new user — sends a verification OTP by email                        | Public          |
| POST   | `/auth/verify-otp`                  | Verify the OTP and activate the account (no token returned — log in afterward) | Public          |
| POST   | `/auth/login`                       | Log in — returns an access token (body) + refresh token (httpOnly cookie)      | Public          |
| POST   | `/auth/refresh-token`               | Issue a new access token using the refresh token cookie                        | Public (cookie) |
| POST   | `/auth/logout`                      | Log out — clears the refresh token cookie                                      | Private         |
| POST   | `/auth/forgotpassword/send-token`   | Request a password reset — sends a crypto reset token by email                 | Public          |
| POST   | `/auth/forgotpassword/verify-token` | Verify the reset token (`token` field), set a new password, and auto-log-in    | Public          |
| GET    | `/auth/me`                          | Get the authenticated user's profile                                           | Private         |

---

## 📡 API Endpoints — Users (`/users`)

| Method | Endpoint                 | Description                                                                           | Auth       |
| ------ | ------------------------ | ------------------------------------------------------------------------------------- | ---------- |
| POST   | `/users/add`             | Create a user directly (no OTP needed)                                                | Admin      |
| GET    | `/users/all`             | Get all users                                                                         | Admin      |
| GET    | `/users/:id`             | Get a single user by ID                                                               | Admin      |
| PATCH  | `/users/:id`             | Update own profile — `username`, `phone`, `addresses`, `avatar` (multipart/form-data) | Owner only |
| DELETE | `/users/:id`             | Delete a user                                                                         | Admin      |
| POST   | `/users/change-password` | Change own password — requires `currentPassword` + `newPassword`                      | Owner only |

**Notes:**

- The `PATCH /users/:id` route must be sent as `multipart/form-data` (not raw JSON) since it accepts
  an optional avatar image file. Password and email cannot be changed through this route.
- `PATCH /users/:id` requires at least one field to update — an empty request returns a `400` error.
- `GET /users/all` supports pagination via `?page=` and `?limit=` query parameters (defaults: page 1, limit 10).
- `DELETE /users/:id` also removes the user's avatar from Cloudinary (if one was uploaded).
- `POST /users/change-password` always acts on the logged-in user (`req.user`) — there is no way to
  target another user's account, so an admin can never change another user's password through this route.
- Admin-only routes require the authenticated user's role to be `admin`. There is no public endpoint
  to self-promote to admin — this must be done directly in the database.

**Private routes** require an `Authorization` header:

```
Authorization: Bearer <access_token>
```

---

## 📡 API Endpoints — Products (`/products`)

| Method | Endpoint                     | Description                                                                 | Auth                  |
| ------ | ---------------------------- | --------------------------------------------------------------------------- | --------------------- |
| GET    | `/products`                  | Get all active products — pagination, category/brand/price filters, sorting | Public                |
| GET    | `/products/search`           | Advanced text search with filters and sorting                               | Public                |
| GET    | `/products/:id`              | Get a single product by ID                                                  | Public                |
| POST   | `/products`                  | Create a product with one or more images (multipart/form-data)              | Admin                 |
| PUT    | `/products/update/:id`       | Update a product — delete specific images and/or upload new ones            | Admin                 |
| DELETE | `/products/:id`              | Delete a product and remove all its images from Cloudinary                  | Admin                 |
| POST   | `/products/:id/reviews`      | Add a review (one per user per product)                                     | Logged-in user        |
| DELETE | `/products/:id/reviews/:rid` | Delete a review                                                             | Review owner or Admin |
| GET    | `/products/:id/reviews`      | Get all reviews for a product                                               | Public                |

**Notes:**

- `GET /products/:id` returns `404` for inactive products, consistent with `GET /products` (which
  already excludes them from the list) — an inactive product is treated as not found by regular users.
- `POST /products` validates, before creating anything: at least one image is provided, `discountPrice`
  (if given) is strictly less than `price`, and the `sku` (if given) isn't already used by another product.
- If any image fails to upload during product creation, the request fails immediately with no product
  created — there's no risk of ending up with a "half-created" product.
- `POST /products` and `PUT /products/update/:id` must be sent as `multipart/form-data`, with images
  under the field name `images` (supports multiple files).
- The product `slug` is generated automatically from the `name` field, with a numeric suffix
  (e.g. `red-shoes-2`) added automatically if the base slug is already taken.
- `averageRating` and `numReviews` are recalculated automatically whenever a review is added or removed.

---

## 📡 API Endpoints — Cart (`/carts`)

| Method | Endpoint                  | Description                                                            | Auth |
| ------ | ------------------------- | ---------------------------------------------------------------------- | ---- |
| GET    | `/carts`                  | Get the user's cart — creates one automatically if it doesn't exist    | User |
| POST   | `/carts/items`            | Add an item to the cart — deducts stock immediately                    | User |
| PATCH  | `/carts/items`            | Set a new quantity for an item — adjusts stock by the exact difference | User |
| DELETE | `/carts/items/:productId` | Remove an item — restores its stock                                    | User |
| POST   | `/carts/coupon`           | Apply a discount coupon to the cart                                    | User |
| DELETE | `/carts/coupon`           | Remove the currently applied coupon                                    | User |
| DELETE | `/carts/clear`            | Clear all items and the coupon, restoring stock for every item         | User |

**Notes:**

- Coupon codes are defined as a static object in `constants/coupons.js` (`SAVE10`, `SAVE20`, `SAVE50`,
  `SAVE80` as percentage discounts, `OFF50` as a fixed discount) — add new codes there without touching
  any other file.
- `subtotal`, `discountAmount`, `total`, and `itemCount` are Mongoose **virtuals** — computed live from
  the cart's items and coupon on every read, never stored in the database, so they can never go out of sync.
- Adding an item snapshots the product's current name, image, and price into the cart line — so the
  cart stays accurate even if the product is later renamed or repriced.

---

## 📡 API Endpoints — Wishlist (`/wishlists`)

| Method | Endpoint                       | Description                                       | Auth |
| ------ | ------------------------------ | ------------------------------------------------- | ---- |
| GET    | `/wishlists/my`                | Get the user's wishlist with full product details | User |
| POST   | `/wishlists/add/:productId`    | Add a product to the wishlist                     | User |
| DELETE | `/wishlists/remove/:productId` | Remove a product from the wishlist                | User |
| DELETE | `/wishlists/clear`             | Clear the entire wishlist                         | User |

**Notes:**

- A `pre('find')` hook automatically populates full product details on every query — the client never
  needs a second request to get product info for wishlist items.
- Adding the same product twice returns a `409 Conflict` instead of creating a duplicate entry.

---

## 🔁 Refresh Token Flow

To avoid forcing users to log in every time their session expires, the API uses two tokens:

| Token         | Lifespan       | Where it lives                                 | Purpose                                 |
| ------------- | -------------- | ---------------------------------------------- | --------------------------------------- |
| Access Token  | Short (15 min) | Returned in the JSON response body             | Sent with every authenticated request   |
| Refresh Token | Long (7 days)  | `httpOnly` cookie (not readable by JavaScript) | Used only to request a new access token |

**Typical flow:**

1. User logs in → receives an access token + a refresh token cookie is set automatically.
2. Client uses the access token for authenticated requests.
3. When the access token expires, the client calls `POST /auth/refresh-token` (the cookie is sent
   automatically by the browser/Postman) to get a new access token — without re-entering credentials.
4. On logout, the refresh token cookie is cleared.

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
- When uploading multiple product images, if any single image fails to upload, the images that DID succeed are automatically deleted from Cloudinary (rollback) — preventing orphaned files from accumulating.
- `.env` is excluded from version control via `.gitignore` — never commit real credentials.

---

## 📄 License

This project was built for educational purposes as part of the SEF Academy backend training program.
