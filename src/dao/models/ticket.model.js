import { Schema, model } from "mongoose";


const ticketSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    purchaseDateTime: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    purchaser: {
      type: String,
      required: true,
    },
});

const ticketModel = model("ticket", ticketSchema);

export { ticketModel };