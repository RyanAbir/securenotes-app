const Note = require("../models/Note");

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) {
    return undefined;
  }

  return tags.filter((tag) => typeof tag === "string");
};

const getNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ user: req.user }).sort({
      pinned: -1,
      createdAt: -1,
    });
    return res.json({ success: true, data: notes });
  } catch (error) {
    return next(error);
  }
};

const createNote = async (req, res, next) => {
  try {
    const { title, content, tags, pinned, favorite } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Please provide title and content" });
    }

    const noteData = {
      user: req.user,
      title,
      content,
    };

    const normalizedTags = normalizeTags(tags);

    if (normalizedTags !== undefined) {
      noteData.tags = normalizedTags;
    }

    if (typeof pinned === "boolean") {
      noteData.pinned = pinned;
    }

    if (typeof favorite === "boolean") {
      noteData.favorite = favorite;
    }

    const note = await Note.create(noteData);

    return res.status(201).json({ success: true, data: note });
  } catch (error) {
    return next(error);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, tags, pinned, favorite } = req.body;

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.user.toString() !== req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (title !== undefined) {
      note.title = title;
    }

    if (content !== undefined) {
      note.content = content;
    }

    const normalizedTags = normalizeTags(tags);

    if (normalizedTags !== undefined) {
      note.tags = normalizedTags;
    }

    if (typeof pinned === "boolean") {
      note.pinned = pinned;
    }

    if (typeof favorite === "boolean") {
      note.favorite = favorite;
    }

    const updatedNote = await note.save();

    return res.json({ success: true, data: updatedNote });
  } catch (error) {
    return next(error);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.user.toString() !== req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await note.deleteOne();

    return res.json({ success: true, message: "Note deleted" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
};
