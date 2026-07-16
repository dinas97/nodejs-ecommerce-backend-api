// Static coupon codes available across the store.
// To add a new coupon later, just add an entry here — no other files
// need to change.
const COUPONS = {
  SAVE10: { discountType: 'percentage', discountValue: 10 },
  SAVE20: { discountType: 'percentage', discountValue: 20 },
  SAVE50: { discountType: 'percentage', discountValue: 50 },
  SAVE80: { discountType: 'percentage', discountValue: 80 },
  OFF50: { discountType: 'fixed', discountValue: 50 },
};

module.exports = COUPONS;
