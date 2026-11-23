// controllers/petController.js
const crypto = require("crypto");
const QRCode = require("qrcode");
const { User, Pet, MedicalRecord } = require("../models");
// const fs = require("fs");
// const path = require("path");
const { cloudinary } = require("../middlewares/upload");

// // Función auxiliar para eliminar la foto antigua de la mascota si existe
// const deleteLocalPhoto = (photoUrl) => {
//   if (!photoUrl || !photoUrl.startsWith("/uploads/")) return;
//   const fullPath = path.join(__dirname, "..", photoUrl);
//   fs.unlink(fullPath, (err) => {
//     if (err && err.code !== "ENOENT") {
//       console.error("Error al eliminar imagen antigua:", err);
//     }
//   });
// };

// Función auxiliar para eliminar la foto antigua de la mascota si existe en la nube (Cloudinary)
const deleteCloudPhoto = async (photoUrl) => {
  if (!photoUrl || !photoUrl.includes("res.cloudinary.com")) return;
  try {
    const parts = photoUrl.split("/upload/")[1];
    if (!parts) return;
    const publicIdWithExt = parts.replace(/^v\d+\//, "");
    const publicId = publicIdWithExt.substring(
      0,
      publicIdWithExt.lastIndexOf("."),
    );
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Error al eliminar imagen en Cloudinary:", err);
  }
};

// Función auxiliar para generar un publicId único de 8 caracteres hexadecimales
const generatePublicId = () => {
  return crypto.randomBytes(4).toString("hex");
};

// Helper interno para construir la URL del carnet digital y generar el código QR
const buildPetQRCode = async (publicId) => {
  const baseUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(
    /\/$/,
    "",
  );
  const carnetUrl = `${baseUrl}/?p=${publicId}`;

  const qrCodeImage = await QRCode.toDataURL(carnetUrl, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  return { carnetUrl, qrCodeImage };
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
    } = req.body;

    if (!name || !species || !ownerName || !ownerPhone) {
      return res.status(400).json({
        message:
          "Faltan campos obligatorios (nombre, especie, dueño, teléfono).",
      });
    }

    const publicId = generatePublicId();
    // const photoUrl = req.file
    //   ? `/uploads/pets/${req.file.filename}`
    //   : req.body.photoUrl || null;
    const photoUrl = req.file ? req.file.path : req.body.photoUrl || null;

    const newPet = await Pet.create({
      publicId,
      name,
      species,
      breed: breed || null,
      birthDate: birthDate || null,
      microchip: microchip || null,
      ownerName,
      ownerPhone,
      photoUrl,
      userId: req.user.id,
    });

    const { qrCodeImage } = await buildPetQRCode(publicId);

    res.status(201).json({
      message: "Mascota registrada con éxito.",
      pet: newPet,
      qrCodeImage,
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
      order: [
        ["createdAt", "DESC"],
        [MedicalRecord, "dateApplied", "DESC"],
      ],
    });
    res.json(pets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener mascotas." });
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
        {
          model: User,
          attributes: ["vetName"],
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
    const { carnetUrl, qrCodeImage } = await buildPetQRCode(publicId);

    res.json({
      publicId,
      qrTargetUrl: carnetUrl,
      qrCodeImage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al generar el código QR." });
  }
};

// Actualizar datos de una mascota (Ruta Privada)
const updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      species,
      breed,
      birthDate,
      microchip,
      ownerName,
      ownerPhone,
    } = req.body;

    if (!name || !species || !ownerName || !ownerPhone) {
      return res.status(400).json({
        message:
          "Faltan campos obligatorios (nombre, especie, dueño, teléfono).",
      });
    }

    const pet = await Pet.findOne({
      where: { id, userId: req.user.id },
    });

    if (!pet) {
      return res
        .status(404)
        .json({ message: "Mascota no encontrada o sin permisos." });
    }

    const oldPhotoUrl = pet.photoUrl;
    const photoUrl = req.file ? req.file.path : pet.photoUrl;

    await pet.update({
      name,
      species,
      breed: breed || null,
      birthDate: birthDate || null,
      microchip: microchip || null,
      ownerName,
      ownerPhone,
      photoUrl,
    });

    if (req.file && oldPhotoUrl && oldPhotoUrl !== photoUrl) {
      await deleteCloudPhoto(oldPhotoUrl);
    }

    return res.status(200).json({
      message: "Datos del paciente actualizados.",
      pet,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al actualizar la mascota." });
  }
};
// Eliminar una mascota y su historial médico (Ruta Privada)
const deletePet = async (req, res) => {
  try {
    const { id } = req.params;

    const pet = await Pet.findOne({
      where: { id, userId: req.user.id },
    });

    if (!pet) {
      return res
        .status(404)
        .json({ message: "Mascota no encontrada o sin permisos." });
    }

    // Eliminar la mascota y su historial médico asociado de manera segura
    const oldPhotoUrl = pet.photoUrl;
    await MedicalRecord.destroy({ where: { petId: pet.id } });
    await pet.destroy();
    await deleteCloudPhoto(oldPhotoUrl);

    return res
      .status(200)
      .json({ message: "Paciente eliminado correctamente." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al eliminar la mascota." });
  }
};

module.exports = {
  deleteCloudPhoto,
  generatePublicId,
  buildPetQRCode,
  createPet,
  getMyPets,
  getPetByPublicId,
  getPetQRCode,
  updatePet,
  deletePet,
};
