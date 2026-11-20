const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth");
const {
  addMedicalRecord,
  deleteMedicalRecord,
  updateRecord,
} = require("../controllers/medicalRecordController");

// Rutas protegidas por JWT
router.post("/", verifyToken, addMedicalRecord);
router.put("/:id", verifyToken, updateRecord);
router.delete("/:id", verifyToken, deleteMedicalRecord);

module.exports = router;
