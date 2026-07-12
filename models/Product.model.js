const mongoose = require('mongoose');
const slugify = require('slugify');

// Sub-schema for images stored on Cloudinary
const imageSchema = new mongoose.Schema(
  {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

// Sub-schema for embedded product reviews
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      unique: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      maxlength: 500,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true, // allows multiple documents with no sku at all
    },
    images: {
      type: [imageSchema],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: 'At least one product image is required',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      lowercase: true,
      trim: true,
    },
    subcategory: {
      type: String,
      lowercase: true,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    tags: [String],
    reviews: [reviewSchema],
    averageRating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

// --- Indexes ---

// Full-text search across name, description, and brand
productSchema.index({ name: 'text', description: 'text', brand: 'text' });

// Faster filtering and sorting on these common query fields
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: 1 });
productSchema.index({ createdAt: 1 });

// --- Hooks ---

// Auto-generate a unique, URL-friendly slug whenever the name changes
productSchema.pre('save', async function () {
  if (!this.isModified('name')) return;

  const baseSlug = slugify(this.name, { lower: true, strict: true });
  let candidateSlug = baseSlug;
  let counter = 1;

  // Keep trying suffixed slugs (e.g. "red-shoes-2") until we find one
  // that isn't already taken by a different product.
  while (
    await mongoose.models.Product.exists({
      slug: candidateSlug,
      _id: { $ne: this._id },
    })
  ) {
    candidateSlug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  this.slug = candidateSlug;
});

// --- Methods ---

// Recalculates averageRating and numReviews from the current reviews array
productSchema.methods.calcAverageRating = function () {
  const totalReviews = this.reviews.length;

  if (totalReviews === 0) {
    this.averageRating = 0;
    this.numReviews = 0;
    return;
  }

  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.averageRating = Math.round((sum / totalReviews) * 10) / 10; // 1 decimal
  this.numReviews = totalReviews;
};

module.exports = mongoose.model('Product', productSchema);
