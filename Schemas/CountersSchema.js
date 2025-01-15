const mongoose = require('mongoose');

const countersSchema = new mongoose.Schema({
  dailyRunCount: { type: Number, default: 0 },
  lastReset: { type: Date },
  eventTimes: [{ type: Date }],
  invasionDay: {type: Boolean},
  invasionTime: {type: Date},
});

module.exports = mongoose.model("Counters", countersSchema, "Counters");
