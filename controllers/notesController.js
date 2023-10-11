// controllers/notesController.js
const Notes = require("../models/Notes");

async function deleteNote(req, res) {
  if (req.user.role === "admin") {
    const noteId = req.params.id;
    try {
      const deletednoteId = await Notes.destroy({ where: { id: noteId } });
      if (deletednoteId > 0) {
        res.json({ message: `Note with ID ${noteId} has been deleted` });
      } else {
        res.json({ message: `Note with ID ${noteId} Not Found` });
      }
    } catch (err) {
      res.json({ message: "Internal server error", err });
    }
  }
}

module.exports = {
  deleteNote,
};
