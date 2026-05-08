const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const User = require("../models/User");
const Note = require("../models/Note");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();

    await Note.deleteMany();
    await User.deleteMany();

    const hashedPassword = await bcrypt.hash("Password123!", 10);
    const createdUsers = await User.insertMany([
      {
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
      },
      {
        name: "Jane Doe",
        email: "jane@example.com",
        password: hashedPassword,
      }
    ]);

    const testUser = createdUsers[0]._id;

    await Note.insertMany([
      {
        user: testUser,
        title: "Welcome to SecureNotes",
        content: "<p>This is your first note. You can edit or delete it.</p>",
        tags: ["welcome", "onboarding"],
        pinned: true,
        favorite: true,
      },
      {
        user: testUser,
        title: "Project Ideas",
        content: "<ul><li>Build a task manager</li><li>Learn React Native</li><li>Upgrade to Next.js</li></ul>",
        tags: ["ideas"],
        pinned: false,
        favorite: false,
      }
    ]);

    console.log("Data Imported successfully!");
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error.message}`);
    process.exit(1);
  }
};

importData();
