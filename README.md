# Node.js Ecommerce Backend API

A full-featured RESTful Ecommerce API built with **Node.js**, **Express**, and **MongoDB**.
Built as part of a 4-week hands-on backend training program (SEF Academy).

Covers the complete lifecycle of an online store — user authentication, user management,
product management, cart, wishlist, orders, and an admin dashboard.

---

## 🚧 Project Status

| Section                                                      | Status                |
| ------------------------------------------------------------ | --------------------- |
| Authentication (`/auth`)                                     | ✅ Completed & tested |
| Refresh Token flow                                           | ✅ Completed & tested |
| Users (`/users`)                                             | ✅ Completed & tested |
| Products (`/products`)                                       | ✅ Completed & tested |
| Cart (`/carts`)                                              | ✅ Completed & tested |
| Wishlist (`/wishlists`)                                      | ✅ Completed & tested |
| Orders (`/orders`)                                           | ✅ Completed & tested |
| Admin Dashboard (under `/orders/admin` & `/wishlists/admin`) | ✅ Completed & tested |

---

## 🛠️ Tech Stack

| Technology        | Purpose                                                                          |
| ----------------- | -------------------------------------------------------------------------------- |
| Node.js           | Server-side JavaScript runtime                                                   |
| Express.js        | Web framework — routing, middleware, error handling                              |
| MongoDB           | NoSQL document database                                                          |
| Mongoose          | ODM — schemas, models, validation, hooks, transactions                           |
| JWT               | Stateless authentication — short-lived access tokens + long-lived refresh tokens |
| bcryptjs          | Secure password & OTP hashing                                                    |
| crypto (built-in) | Secure random token generation for password reset                                |
| Joi               | Request data validation                                                          |
| Nodemailer        | Email sending (OTP verification, password reset, order status updates)           |
| Cloudinary        | Cloud image storage — used for user avatars and product images                   |
| Multer            | Handling `multipart/form-data` (image uploads)                                   |
| dotenv            | Environment variable management                                                  |
| cors              | Cross-Origin Resource Sharing                                                    |
| cookie-parser     | Parsing the refresh token cookie                                                 |
| morgan            | HTTP request logging                                                             |
| slugify           | Auto-generating URL-friendly product slugs                                       |

---

## 📁 Project Structure

```
nodejs-ecommerce-backend-api/
├── config/
│   └── cloudinary.js           → Cloudinary configuration
├── constants/
│   └── coupons.js               → Static coupon codes for the cart
├── models/                       → Mongoose schemas and models
│   ├── User.model.js
│   ├── OTP.model.js
│   ├── Product.model.js
│   ├── Order.model.js
│   ├── Cart.model.js
│   └── Wishlist.model.js
├── controllers/                   → Business logic for every resource
│   ├── authController.js
│   ├── userController.js
│   ├── productController.js
│   ├── cartController.js
│   ├── wishlistController.js
│   ├── orderController.js
│   └── adminController.js         → Dashboard stats, admin carts/wishlists overview
├── DB/
│   └── connection.js               → Database connection
├── routes/                          → Express route definitions
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── product.routes.js
│   ├── cart.routes.js
│   ├── wishlist.routes.js
│   └── order.routes.js
├── middleware/                       → Auth guard, admin guard, validation, upload
│   ├── auth.js
│   ├── adminOnly.js
│   ├── validate.js
│   └── upload.js
├── utils/                             → Helper functions
│   ├── generateOTP.js
│   ├── generateToken.js
│   ├── generateRefreshToken.js
│   ├── generateResetToken.js
│   ├── sendEmail.js
│   ├── uploadToCloudinary.js
│   ├── uploadMultipleToCloudinary.js
│   └── deleteFromCloudinary.js
├── validation/                         → Joi validation schemas
│   ├── userValidation.js
│   ├── productValidation.js
│   ├── cartValidation.js
│   └── orderValidation.js
├── postman/                             → Postman collection for API testing
│   └── Ecommerce-API.postman_collection.json
├── index.js                              → App entry point
├── .env.example                          → Environment variables template
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

```bash
cp .env.example .env
```

See the [Environment Variables](#-environment-variables) section below.

### 4. Run the server

```bash
npm run dev
```

Expected output:

```
Server running on port 5000
MongoDB Connected: <your-cluster-host>
```

---

## 🔑 Environment Variables

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

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note:** For Gmail, `EMAIL_PASS` must be a Google **App Password**, not your regular account password.
> **Note:** `JWT_SECRET` and `REFRESH_TOKEN_SECRET` must be two different values.

---

## 📡 API Endpoints — Authentication (`/auth`)

| Method | Endpoint                            | Description                                                    | Auth            |
| ------ | ----------------------------------- | -------------------------------------------------------------- | --------------- |
| POST   | `/auth/register/send-otp`           | Register — sends a verification OTP by email                   | Public          |
| POST   | `/auth/verify-otp`                  | Verify the OTP and activate the account (no token returned)    | Public          |
| POST   | `/auth/login`                       | Log in — returns access token (body) + refresh token (cookie)  | Public          |
| POST   | `/auth/refresh-token`               | Issue a new access token using the refresh token cookie        | Public (cookie) |
| POST   | `/auth/logout`                      | Log out — clears the refresh token cookie                      | Private         |
| POST   | `/auth/forgotpassword/send-token`   | Request a password reset — sends a crypto reset token by email | Public          |
| POST   | `/auth/forgotpassword/verify-token` | Verify the reset token, set a new password, and auto-log-in    | Public          |
| GET    | `/auth/me`                          | Get the authenticated user's profile                           | Private         |

---

## 📡 API Endpoints — Users (`/users`)

| Method | Endpoint                 | Description                                                                   | Auth       |
| ------ | ------------------------ | ----------------------------------------------------------------------------- | ---------- |
| POST   | `/users/add`             | Create a user directly (no OTP needed)                                        | Admin      |
| GET    | `/users/all`             | Get all users (paginated)                                                     | Admin      |
| GET    | `/users/:id`             | Get a single user by ID                                                       | Admin      |
| PATCH  | `/users/:id`             | Update own profile — username, phone, addresses, avatar (multipart/form-data) | Owner only |
| DELETE | `/users/:id`             | Delete a user (also removes their avatar from Cloudinary)                     | Admin      |
| POST   | `/users/change-password` | Change own password — requires currentPassword + newPassword                  | Owner only |

**Notes:**

- `PATCH /users/:id` must be sent as `multipart/form-data`; requires at least one field to update
  (an empty request returns `400`). Password and email cannot be changed through this route.
- `GET /users/all` supports pagination via `?page=` and `?limit=` (defaults: page 1, limit 10).
- `POST /users/change-password` always acts on the logged-in user (`req.user`) — there is no way to
  target another user's account, so **an admin can never change another user's password** through
  this route.
- There is no public endpoint to self-promote to admin — this must be done directly in the database.

---

## 📡 API Endpoints — Products (`/products`)

| Method | Endpoint                     | Description                                            | Auth                  |
| ------ | ---------------------------- | ------------------------------------------------------ | --------------------- |
| GET    | `/products`                  | Get all active products — pagination, filters, sorting | Public                |
| GET    | `/products/search`           | Advanced text search with filters and sorting          | Public                |
| GET    | `/products/:id`              | Get a single product (404 if inactive)                 | Public                |
| POST   | `/products`                  | Create a product with images (multipart/form-data)     | Admin                 |
| PUT    | `/products/update/:id`       | Update a product — delete/add images                   | Admin                 |
| DELETE | `/products/:id`              | Delete a product and its images from Cloudinary        | Admin                 |
| POST   | `/products/:id/reviews`      | Add a review (one per user per product)                | Logged-in user        |
| DELETE | `/products/:id/reviews/:rid` | Delete a review                                        | Review owner or Admin |
| GET    | `/products/:id/reviews`      | Get all reviews for a product                          | Public                |

**Notes:**

- `GET /products/:id` returns `404` for inactive products, consistent with `GET /products`.
- `POST /products` validates before creating anything: at least one image, `discountPrice` <
  `price`, and `sku` uniqueness. Image upload failures roll back any images that did succeed.
- The product `slug` is generated automatically from `name`, with a numeric suffix (e.g.
  `red-shoes-2`) added if the base slug is already taken.
- `averageRating` and `numReviews` are recalculated automatically whenever a review is added or removed.

---

## 📡 API Endpoints — Cart (`/carts`)

| Method | Endpoint                  | Description                                                       | Auth |
| ------ | ------------------------- | ----------------------------------------------------------------- | ---- |
| GET    | `/carts`                  | Get the user's cart — created automatically if it doesn't exist   | User |
| POST   | `/carts/items`            | Add an item — only **validates** stock, does not deduct it        | User |
| PATCH  | `/carts/items`            | Set a new quantity — only **validates** stock, does not modify it | User |
| DELETE | `/carts/items/:productId` | Remove an item — stock is untouched                               | User |
| POST   | `/carts/coupon`           | Apply a discount coupon                                           | User |
| DELETE | `/carts/coupon`           | Remove the applied coupon                                         | User |
| DELETE | `/carts/clear`            | Clear all items and the coupon                                    | User |

**Notes:**

- Coupons live in `constants/coupons.js` as a static object (`SAVE10`, `SAVE20`, `SAVE50`, `SAVE80`,
  `OFF50`).
- `subtotal`, `discountAmount`, `total`, `itemCount` are Mongoose **virtuals** — computed live, never stored.
- **The cart never modifies `Product.stock`.** It only checks that enough stock exists. Actual stock
  is only deducted when a real order is placed (see Orders below).

---

## 📡 API Endpoints — Wishlist (`/wishlists`)

| Method | Endpoint                       | Description                                       | Auth  |
| ------ | ------------------------------ | ------------------------------------------------- | ----- |
| GET    | `/wishlists/my`                | Get the user's wishlist with full product details | User  |
| POST   | `/wishlists/add/:productId`    | Add a product to the wishlist                     | User  |
| DELETE | `/wishlists/remove/:productId` | Remove a product from the wishlist                | User  |
| DELETE | `/wishlists/clear`             | Clear the entire wishlist                         | User  |
| GET    | `/wishlists/admin/all`         | View all user wishlists (paginated)               | Admin |
| GET    | `/wishlists/admin/stats`       | Top 10 most wishlisted products                   | Admin |

**Notes:**

- A `pre('find')` hook auto-populates full product details on every query.
- Adding a duplicate product returns `409 Conflict`.
- Admin routes for orders and wishlists live under their own resource (`/orders/admin/...` and
  `/wishlists/admin/...`) rather than a separate `/admin` module, to keep each resource's admin
  actions grouped with the resource itself.

---

## 📡 API Endpoints — Orders (`/orders`)

| Method | Endpoint                   | Description                                                                                                   | Auth  |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------------------------- | ----- |
| POST   | `/orders`                  | Create an order from the cart — wrapped in a Mongoose Transaction                                             | User  |
| GET    | `/orders/my`               | Get the user's own orders (pagination + status filter)                                                        | User  |
| GET    | `/orders/my/:id`           | Get a specific order (owner only)                                                                             | User  |
| PATCH  | `/orders/my/:id/cancel`    | Cancel an order — only if pending/confirmed. Restores stock                                                   | User  |
| GET    | `/orders/admin/dashboard`  | Revenue stats, order counts by status, top 5 products, daily revenue (7 days), recent orders, total customers | Admin |
| GET    | `/orders/admin/carts`      | View all active (non-empty) carts with user info                                                              | Admin |
| GET    | `/orders/admin`            | Get all orders — filters by status/payment/date, sorting                                                      | Admin |
| GET    | `/orders/admin/:id`        | Get full details of any order                                                                                 | Admin |
| PATCH  | `/orders/admin/:id/status` | Update order status — emails the customer automatically                                                       | Admin |

**Notes:**

- `POST /orders` is wrapped in a **Mongoose Transaction**: stock is validated and deducted
  atomically for every item (using `findOneAndUpdate` with a `stock >= quantity` guard to prevent
  race conditions), the order is created, and the cart is cleared — all together, or none at all
  if any step fails.
- Cart items only ever check stock (never touch it); **the order is the first point where stock is
  actually deducted.**
- `shippingFee` is `0` if `subtotal >= 1000`, otherwise `50`. `tax` is `14%` of the subtotal.
  `totalPrice = subtotal + shippingFee + tax - discount`.
- Cancelling an order (while still pending/confirmed) restores stock for every item.
- **Payment methods:** only `cash` is currently supported. The `Order` model reserves `stripe`,
  `paypal`, and `paymob` as future values, but they are intentionally rejected by validation until
  their actual payment processing is implemented — this avoids silently creating orders that claim
  an online payment was made when none actually occurred.
- The dashboard runs multiple MongoDB **aggregation pipelines in parallel** via `Promise.all`.
- Admin-specific static routes (`dashboard`, `carts`) are registered before the dynamic `/admin/:id`
  route, so Express doesn't mistake "dashboard" or "carts" for an order ID.

---

## 🔁 Refresh Token Flow

| Token         | Lifespan | Where it lives                     |
| ------------- | -------- | ---------------------------------- |
| Access Token  | 15 min   | Returned in the JSON response body |
| Refresh Token | 7 days   | `httpOnly` cookie                  |

The client uses the access token for requests, and calls `POST /auth/refresh-token` (cookie sent
automatically) to get a new one once it expires — no need to log in again.

---

## 🧪 Testing with Postman

A ready-to-use Postman collection is included at:

```
postman/Ecommerce-API.postman_collection.json
```

It's organized into folders matching each module — Authentication, Users, Products, Cart,
Wishlist, Orders, and Admin Dashboard — with 46 requests total, automated status-code tests, and
variable chaining (the token, product id, order id, etc. are captured automatically as you go
through the requests in order).

**To use it:**

1. Open Postman → click **Import** → select `postman/Ecommerce-API.postman_collection.json`
2. Make sure the server is running locally on `http://localhost:5000`
3. Open the collection's **Variables** tab and set `test_email` to a real email you can access
4. Run the **Authentication** folder first (in order) to get a token, then proceed folder by folder

> To test admin-only routes, manually set a user's `role` field to `"admin"` in MongoDB Atlas —
> there is no API endpoint that grants admin access.

---

## 🔒 Security Notes

- Passwords and registration OTP codes are hashed with `bcryptjs`; never stored in plain text.
- Password reset uses a crypto-generated token (Node's `crypto` module), stored as a SHA-256 hash
  directly on the `User` document.
- Changing your own password requires your current password — no OTP/email step needed.
- Sensitive fields (`password`, `resetPasswordToken`, OTP's `otp`) use `select: false`.
- The `role` field is never included in API response bodies — only embedded inside the JWT.
- Registration OTPs use a MongoDB **TTL index** for automatic cleanup.
- The refresh token cookie is `httpOnly`, signed with a secret separate from the access token's.
- Product images are streamed directly to Cloudinary (never saved to disk); failed uploads roll
  back any images that did succeed.
- Order creation uses a Mongoose Transaction with atomic stock checks to prevent race conditions
  and partial/inconsistent order states.
- `.env` is excluded from version control via `.gitignore`.

---

## 📄 License

Built for educational purposes as part of the SEF Academy backend training program.
