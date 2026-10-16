const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth");
const {
  addMedicalRecord,
  deleteMedicalRecord,
} = require("../controllers/medicalRecordController");

// Rutas protegidas por JWT
router.post("/pet/:petId", verifyToken, addMedicalRecord);
router.delete("/:id", verifyToken, deleteMedicalRecord);

module.exports = router;
