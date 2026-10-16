// controllers/petController.js
const crypto = require("crypto");
const QRCode = require("qrcode");
const { Pet, MedicalRecord } = require("../models");

// Función auxiliar para generar un publicId único de 8 caracteres hexadecimales
const generatePublicId = () => {
  return crypto.randomBytes(4).toString("hex");
};

// Crear Mascota (Ruta Privada)
const createPet = async (req, res) => {
  try {
    const {
      name,
      species,
      breed,
      birthDate,
      microchip,
      ownerName,
      ownerPhone,
      photoUrl,
    } = req.body;

    if (!name || !species || !ownerName || !ownerPhone) {
      return res.status(400).json({
        message:
          "Faltan campos obligatorios (nombre, especie, dueño, teléfono).",
      });
    }

    const publicId = generatePublicId();

    const newPet = await Pet.create({
      publicId,
      name,
      species,
      breed,
      birthDate,
      microchip,
      ownerName,
      ownerPhone,
      photoUrl,
      userId: req.user.id, // Obtenido desde el token JWT
    });

    res.status(201).json({
      message: "Mascota registrada con éxito.",
      pet: newPet,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar la mascota." });
  }
};

// Obtener las mascotas registradas por el veterinario (Ruta Privada)
const getMyPets = async (req, res) => {
  try {
    const pets = await Pet.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    res.json(pets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener la lista de mascotas." });
  }
};

// Consultar Ficha Pública por publicId (Ruta Pública)
const getPetByPublicId = async (req, res) => {
  try {
    const { publicId } = req.params;

    const pet = await Pet.findOne({
      where: { publicId },
      include: [
        {
          model: MedicalRecord,
          attributes: [
            "id",
            "type",
            "title",
            "dateApplied",
            "nextDueDate",
            "notes",
          ],
        },
      ],
      order: [[MedicalRecord, "dateApplied", "DESC"]],
    });

    if (!pet) {
      return res
        .status(404)
        .json({ message: "Carnet digital no encontrado o inválido." });
    }

    res.json(pet);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al consultar la ficha de la mascota." });
  }
};

// Generar código QR en formato DataURL Base64
const getPetQRCode = async (req, res) => {
  try {
    const { publicId } = req.params;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const qrTargetUrl = `${clientUrl}/p/${publicId}`;

    // Genera la imagen Base64 para incrustar directo en etiquetas <img src="...">
    const qrDataUrl = await QRCode.toDataURL(qrTargetUrl);

    res.json({
      publicId,
      qrTargetUrl,
      qrCodeImage: qrDataUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al generar el código QR." });
  }
};

module.exports = {
  createPet,
  getMyPets,
  getPetByPublicId,
  getPetQRCode,
};
