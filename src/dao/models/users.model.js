import { Schema, model } from "mongoose";

const userSchema = new Schema({
  first_name: String,
  last_name: String,
  email: {
    type: String,
    unique: true, // El mail debe ser único
  },
  age: Number,
  password: String,
  cartId: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "carts",
      },
    ],
    default: [],
  },
  role: {
    type: String,
    enum: ["user", "admin", "premium"],
    default: "user",
  },
  documents: [
    {
      name: String,
      reference: String,
    }
  ],
  last_connection: Date,
});

const userModel = model("user", userSchema);

export { userModel };