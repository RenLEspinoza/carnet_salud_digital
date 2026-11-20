const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const {
  createPet,
  getMyPets,
  getPetByPublicId,
  getPetQRCode,
  updatePet,
  deletePet,
} = require("../controllers/petController");

// Rutas protegidas por JWT
router.post("/", verifyToken, upload.single("photo"), createPet);
router.get("/my-pets", verifyToken, getMyPets);
router.put("/:id", verifyToken, upload.single("photo"), updatePet);
router.delete("/:id", verifyToken, deletePet);

// Rutas públicas (Escaneo y vista del QR)
router.get("/public/:publicId", getPetByPublicId);
router.get("/public/:publicId/qr", getPetQRCode);

module.exports = router;
