// routes/petRoutes.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth");
const {
  createPet,
  getMyPets,
  getPetByPublicId,
  getPetQRCode,
} = require("../controllers/petController");

// Rutas protegidas por JWT
router.post("/", verifyToken, createPet);
router.get("/my-pets", verifyToken, getMyPets);

// Rutas públicas (Escaneo y vista del QR)
router.get("/public/:publicId", getPetByPublicId);
router.get("/public/:publicId/qr", getPetQRCode);

module.exports = router;
