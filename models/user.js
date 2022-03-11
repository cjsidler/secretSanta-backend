const mongoose = require("mongoose");
require("mongoose-type-email");

const reqString = { type: String, required: true };
const reqNumber = { type: Number, required: true };

const participantSchema = new mongoose.Schema({
    name: reqString,
    email: { type: mongoose.SchemaTypes.Email, allowBlank: true },
    secretDraw: { type: String, default: "" },
    restrictions: [String],
});

const drawSchema = new mongoose.Schema({
    year: reqNumber,
    participants: [participantSchema],
});

const giftExchangeSchema = new mongoose.Schema({
    name: reqString,
    draws: [drawSchema],
});

const userSchema = new mongoose.Schema({
    email: reqString,
    giftExchanges: [giftExchangeSchema],
});

module.exports = mongoose.model("User", userSchema);
