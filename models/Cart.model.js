const mongoose = require('mongoose');

// Snapshot of a product at the moment it was added to the cart —
// name/image/price are copied here so the cart stays accurate even if
// the product itself changes later (price update, renamed, etc).
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    coupon: {
      code: { type: String, uppercase: true, default: null },
      discountType: {
        type: String,
        enum: ['percentage', 'fixed', null],
        default: null,
      },
      discountValue: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    // Virtuals only show up in the JSON response if we explicitly enable this
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// --- Virtuals: computed on the fly, never stored in the database ---

cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

cartSchema.virtual('discountAmount').get(function () {
  const subtotal = this.subtotal;
  if (!this.coupon || !this.coupon.discountType) return 0;

  if (this.coupon.discountType === 'percentage') {
    return (
      Math.round(((subtotal * this.coupon.discountValue) / 100) * 100) / 100
    );
  }
  if (this.coupon.discountType === 'fixed') {
    // Never discount more than the subtotal itself
    return Math.min(this.coupon.discountValue, subtotal);
  }
  return 0;
});

cartSchema.virtual('total').get(function () {
  return Math.max(this.subtotal - this.discountAmount, 0);
});

cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

module.exports = mongoose.model('Cart', cartSchema);
