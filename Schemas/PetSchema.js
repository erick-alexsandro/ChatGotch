const mongoose = require('mongoose');

const PetSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  father: { type: String },
  mother: { type: String, required: true },
  birthDate: { type: String, default: "(Undead)" },
  lifeCount: { type: Number, default: 3 },
  dead: { type: Boolean, default: false },
  image: { type: String, default: "https://cataas.com/cat" },
  devoured: { type: Boolean, default: false },
  secured: { type: Boolean, default: false },
});

module.exports = mongoose.model("Pet", PetSchema, "Pets");
