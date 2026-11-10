// Mongoose models: how the data is stored in MongoDB.
// Each one matches a Zod schema in schemas.ts.
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const CategoryModel = model(
  'Category',
  new Schema({
    _id: String,
    label: { type: String, required: true },
    order: { type: Number, required: true },
  }),
);

export const StoreModel = model(
  'Store',
  new Schema({
    _id: String,
    chain: { type: String, enum: ['rewe', 'lidl', 'aldi'], required: true },
    name: { type: String, required: true },
    takesGlassBottles: { type: Boolean, default: false },
  }),
);

export const ProductModel = model(
  'Product',
  new Schema({
    _id: String,
    name: { type: String, required: true },
    unit: { type: String, required: true },
    category: { type: String, ref: 'Category', required: true },
    prices: { type: Map, of: Number, required: true }, // regular price per chain
  }),
);

export const OfferModel = model(
  'Offer',
  new Schema(
    {
      _id: String,
      chain: { type: String, enum: ['rewe', 'lidl', 'aldi'], required: true },
      productId: { type: String, ref: 'Product', required: true },
      price: { type: Number, required: true },
      validFrom: { type: Date, required: true },
      validTo: { type: Date, required: true },
      source: String,
    },
    { timestamps: true },
  ).index({ chain: 1, validFrom: 1, validTo: 1 }),
);
