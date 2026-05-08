const bcrypt = require("bcryptjs");

const Note = require("../models/Note");
const User = require("../models/User");

const getAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user).select("_id name email createdAt updatedAt");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
};

const updateAccount = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const normalizedEmail = typeof email === "string" ? email.toLowerCase() : email;

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email is already in use" });
    }

    user.name = name;
    user.email = normalizedEmail;

    await user.save();

    return res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error) {
    return next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    return next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await Note.deleteMany({ user: req.user });
    await user.deleteOne();

    return res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAccount,
  updateAccount,
  changePassword,
  deleteAccount,
};
