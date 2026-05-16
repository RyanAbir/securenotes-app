const mongoose = require("mongoose");

const todoItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "todo"],
      default: "text",
    },
    content: {
      type: String,
      default: "",
    },
    todos: {
      type: [todoItemSchema],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: "default",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Note", noteSchema);
