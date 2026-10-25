const mongoose = require("mongoose");

const TravelSchema = new mongoose.Schema({
  mode: { type: String },
  distanceKm: { type: Number }
});

const FoodSchema = new mongoose.Schema({
  category: { type: String }, // vegetarian, nonVegetarian, vegan, unknown
  text: { type: String }
});

const ApplianceSchema = new mongoose.Schema({
  appliance: { type: String },
  hours: { type: Number }
});

const ElectricitySchema = new mongoose.Schema({
  kwh: { type: Number },
  breakdown: [ApplianceSchema]
});

const WaterSchema = new mongoose.Schema({
  showerMinutes: { type: Number },
  washingCycles: { type: Number },
  roWasteLiters: { type: Number },
  tapLiters: { type: Number }
});

const ShoppingSchema = new mongoose.Schema({
  category: { type: String },
  quantity: { type: Number },
  co2: { type: Number }
});

const GasSchema = new mongoose.Schema({
  type: { type: String, enum: ["cylinder", "pipeline"], required: true }, // Type of gas
  minutes: { type: Number, required: true }, // Cooking time in minutes
});

const FootprintLogSchema = new mongoose.Schema(
  {
    firebaseUID: { type: String, required: true },
    name: { type: String, required: true }, // added user name

    // Inputs
    travel: [TravelSchema],
    food: [FoodSchema],
    electricity: ElectricitySchema,
    water: WaterSchema,
    shopping: [ShoppingSchema],
    gas: [GasSchema],

    // Calculated totals
    totals: {
      travel: Number,
      food: Number,
      electricity: Number,
      water: Number,
      shopping: Number,
      gas: Number,
      total: Number
    },

    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.models.FootprintLog ||
  mongoose.model("FootprintLog", FootprintLogSchema);
