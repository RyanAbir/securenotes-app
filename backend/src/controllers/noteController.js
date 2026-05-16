const Note = require("../models/Note");

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return undefined;
  return tags.filter((tag) => typeof tag === "string");
};

const normalizeTodos = (todos) => {
  if (!Array.isArray(todos)) return undefined;
  return todos
    .filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.text === "string"
    )
    .map((item) => ({
      id: item.id,
      text: item.text,
      completed: typeof item.completed === "boolean" ? item.completed : false,
    }));
};

// Accept a data URI (base64) or a plain https URL; reject anything else
const normalizeImageUrl = (value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  ) {
    return trimmed;
  }
  return undefined; // reject suspicious values
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
    const { title, content, type, todos, tags, pinned, favorite, color, imageUrl } =
      req.body;

    if (!title) {
      return res.status(400).json({ message: "Please provide a title" });
    }

    const noteData = {
      user: req.user,
      title,
      type: type === "todo" ? "todo" : "text",
      content: typeof content === "string" ? content : "",
    };

    const normalizedTodos = normalizeTodos(todos);
    if (normalizedTodos !== undefined) noteData.todos = normalizedTodos;

    const normalizedTags = normalizeTags(tags);
    if (normalizedTags !== undefined) noteData.tags = normalizedTags;

    if (typeof pinned === "boolean") noteData.pinned = pinned;
    if (typeof favorite === "boolean") noteData.favorite = favorite;
    if (typeof color === "string" && color.length > 0) noteData.color = color;

    const normalizedImage = normalizeImageUrl(imageUrl);
    if (normalizedImage !== undefined) noteData.imageUrl = normalizedImage;

    const note = await Note.create(noteData);
    return res.status(201).json({ success: true, data: note });
  } catch (error) {
    return next(error);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, type, todos, tags, pinned, favorite, color, imageUrl } =
      req.body;

    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (note.user.toString() !== req.user)
      return res.status(401).json({ message: "Not authorized" });

    if (title !== undefined) note.title = title;
    if (typeof content === "string") note.content = content;
    if (type === "todo" || type === "text") note.type = type;

    const normalizedTodos = normalizeTodos(todos);
    if (normalizedTodos !== undefined) note.todos = normalizedTodos;

    const normalizedTags = normalizeTags(tags);
    if (normalizedTags !== undefined) note.tags = normalizedTags;

    if (typeof pinned === "boolean") note.pinned = pinned;
    if (typeof favorite === "boolean") note.favorite = favorite;
    if (typeof color === "string" && color.length > 0) note.color = color;

    const normalizedImage = normalizeImageUrl(imageUrl);
    if (normalizedImage !== undefined) note.imageUrl = normalizedImage;

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
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (note.user.toString() !== req.user)
      return res.status(401).json({ message: "Not authorized" });

    await note.deleteOne();
    return res.json({ success: true, message: "Note deleted" });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getNotes, createNote, updateNote, deleteNote };
