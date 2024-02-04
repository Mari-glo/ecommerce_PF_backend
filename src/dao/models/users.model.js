import { Schema, model } from "mongoose";


const userSchema = new Schema(
  {
    first_name: {
      type: String,
      Required: true,
    },
    last_name: {
      type: String,
    },

    age: Number,

    email: {
      type: String,
      Required: true,
      Unique: true,
    },
    password: {
      type: String,
    },
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
      enum: ["user", "premium", "admin"],
      default: "user",
    },
    documents: [
      {
        name: {
          type: String,
          default: "",
        },
        reference: {
          type: String,
          default: "",
        },
      },
    ],
    last_connection: Date,
});
  

const userModel = model("user", userSchema);

export { userModel };