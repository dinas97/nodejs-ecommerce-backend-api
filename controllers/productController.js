const Product = require('../models/Product.model');
const uploadMultipleToCloudinary = require('../utils/uploadMultipleToCloudinary');
const deleteFromCloudinary = require('../utils/deleteFromCloudinary');

// ---------------------------------------------------------
// GET /products — Public
// Supports pagination, category/brand/price filters, and sorting
// ---------------------------------------------------------
exports.getAllProducts = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, sort, page, limit } =
      req.query;

    const filter = { isActive: true };
    if (category) filter.category = category.toLowerCase();
    if (brand) filter.brand = brand;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const sortOptions = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { averageRating: -1 },
      newest: { createdAt: -1 },
    };
    const sortBy = sortOptions[sort] || sortOptions.newest;

    const currentPage = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const skip = (currentPage - 1) * pageSize;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortBy).skip(skip).limit(pageSize),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageSize),
      products,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// GET /products/search — Public
// Text search + category/subcategory/brand/tags/price filters + sorting
// ---------------------------------------------------------
exports.searchProducts = async (req, res) => {
  try {
    const {
      q,
      category,
      subcategory,
      brand,
      tags,
      minPrice,
      maxPrice,
      sort,
      page,
      limit,
    } = req.query;

    const filter = { isActive: true };
    if (q) filter.$text = { $search: q };
    if (category) filter.category = category.toLowerCase();
    if (subcategory) filter.subcategory = subcategory.toLowerCase();
    if (brand) filter.brand = brand;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const sortOptions = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { averageRating: -1 },
      newest: { createdAt: -1 },
    };
    const sortBy = sortOptions[sort] || sortOptions.newest;

    const currentPage = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const skip = (currentPage - 1) * pageSize;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortBy).skip(skip).limit(pageSize),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / pageSize),
      products,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// GET /products/:id — Public
// ---------------------------------------------------------
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// POST /products — Admin only
// Sent as multipart/form-data with one or more image files
// ---------------------------------------------------------
exports.createProduct = async (req, res) => {
  try {
    // --- 1. Validate images exist ---
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required',
      });
    }

    const {
      name,
      shortDescription,
      description,
      price,
      discountPrice,
      stock,
      sku,
      category,
      subcategory,
      brand,
      tags,
      featured,
      isActive,
    } = req.body;

    const numericPrice = Number(price);
    const numericDiscountPrice = discountPrice ? Number(discountPrice) : 0;

    // --- 2. Validate discountPrice must be less than price ---
    if (numericDiscountPrice > 0 && numericDiscountPrice >= numericPrice) {
      return res.status(400).json({
        success: false,
        message: 'Discount price must be less than the original price',
      });
    }

    // --- 3. Validate sku is not already taken (only if provided) ---
    if (sku) {
      const existingSku = await Product.findOne({ sku });
      if (existingSku) {
        return res.status(409).json({
          success: false,
          message: 'A product with this SKU already exists',
        });
      }
    }

    // --- 4. Upload images — dedicated try/catch so an upload failure
    // stops everything here, before any product is created ---
    let uploadedImages;
    try {
      uploadedImages = await uploadMultipleToCloudinary(req.files);
    } catch (uploadError) {
      return res.status(502).json({
        success: false,
        message: `Image upload failed: ${uploadError.message}`,
      });
    }

    // --- 5. All checks passed — create the product ---
    const product = await Product.create({
      name,
      shortDescription,
      description,
      price: numericPrice,
      discountPrice: numericDiscountPrice,
      stock,
      sku: sku || undefined,
      category,
      subcategory,
      brand,
      tags: tags ? JSON.parse(tags) : [],
      featured,
      isActive,
      images: uploadedImages,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// PUT /products/update/:id — Admin only
// Can delete specific images (by public_id) and upload new ones
// in the same request.
// ---------------------------------------------------------
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }

    const {
      name,
      shortDescription,
      description,
      price,
      discountPrice,
      stock,
      sku,
      category,
      subcategory,
      brand,
      tags,
      featured,
      isActive,
      deleteImages,
    } = req.body;

    if (name) product.name = name;
    if (shortDescription) product.shortDescription = shortDescription;
    if (description) product.description = description;
    if (price !== undefined) product.price = price;
    if (discountPrice !== undefined) product.discountPrice = discountPrice;
    if (stock !== undefined) product.stock = stock;
    if (sku) product.sku = sku;
    if (category) product.category = category;
    if (subcategory) product.subcategory = subcategory;
    if (brand) product.brand = brand;
    if (tags) product.tags = JSON.parse(tags);
    if (featured !== undefined) product.featured = featured;
    if (isActive !== undefined) product.isActive = isActive;

    // Remove specific images requested for deletion
    if (deleteImages) {
      const idsToDelete = JSON.parse(deleteImages);
      await deleteFromCloudinary(idsToDelete);
      product.images = product.images.filter(
        (img) => !idsToDelete.includes(img.public_id),
      );
    }

    // Upload and append any newly provided images
    if (req.files && req.files.length > 0) {
      const uploadedImages = await uploadMultipleToCloudinary(req.files);
      product.images.push(...uploadedImages);
    }

    if (product.images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A product must have at least one image',
      });
    }

    await product.save(); // triggers the slug-regeneration hook if name changed

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// DELETE /products/:id — Admin only
// Removes all images from Cloudinary before deleting the document
// ---------------------------------------------------------
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }

    const publicIds = product.images.map((img) => img.public_id);
    if (publicIds.length > 0) {
      await deleteFromCloudinary(publicIds);
    }

    await product.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// POST /products/:id/reviews — Logged-in user
// One review per user per product
// ---------------------------------------------------------
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }

    const alreadyReviewed = product.reviews.some(
      (review) => review.user.toString() === req.user._id.toString(),
    );
    if (alreadyReviewed) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    product.reviews.push({
      user: req.user._id,
      rating,
      comment,
    });

    product.calcAverageRating();
    await product.save();

    return res.status(201).json({
      success: true,
      message: 'Review added successfully',
      averageRating: product.averageRating,
      numReviews: product.numReviews,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// DELETE /products/:id/reviews/:rid — Review owner or Admin
// ---------------------------------------------------------
exports.deleteReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }

    const review = product.reviews.id(req.params.rid);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: 'Review not found' });
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own review',
      });
    }

    review.deleteOne();
    product.calcAverageRating();
    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      averageRating: product.averageRating,
      numReviews: product.numReviews,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// GET /products/:id/reviews — Public
// ---------------------------------------------------------
exports.getReviews = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select('reviews')
      .populate('reviews.user', 'username avatar');

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({
      success: true,
      count: product.reviews.length,
      reviews: product.reviews,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
