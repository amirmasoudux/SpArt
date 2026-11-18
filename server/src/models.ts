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
    chain: { type: String, enum: ['rewe', 'lidl', 'aldi', 'kaufland', 'penny', 'netto'], required: true },
    name: { type: String, required: true },
    takesGlassBottles: { type: Boolean, default: false },
  }),
);

export const ProspektOfferModel = model(
  'ProspektOffer',
  new Schema({
    _id: String,
    chain: { type: String, enum: ['rewe', 'lidl', 'aldi', 'kaufland', 'penny', 'netto'], required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    regularPrice: { type: Number, default: null },
    unitInfo: { type: String, default: null },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    source: { type: String, required: true },
  }).index({ validFrom: 1, validTo: 1 }),
);

// Normal prices (see schemas.ts NormalPrice). Replaced from data/prices.json on every start.
export const NormalPriceModel = model(
  'NormalPrice',
  new Schema({
    wordId: { type: String, required: true },
    chain: { type: String, enum: ['rewe', 'lidl', 'aldi', 'kaufland', 'penny', 'netto'], required: true },
    price: { type: Number, required: true },
    size: { type: String, required: true },
    title: { type: String, required: true },
    source: { type: String, required: true },
    date: { type: String, required: true },
  }).index({ wordId: 1, chain: 1 }, { unique: true }),
  'normal_prices',
);

export const ReportModel = model(
  'Report',
  new Schema(
    {
      _id: String,
      offerTitle: { type: String, required: true },
      storeId: { type: String, ref: 'Store', required: true },
      kind: { type: String, required: true },
      correctPrice: Number,
      note: String,
    },
    { timestamps: true },
  ),
);
