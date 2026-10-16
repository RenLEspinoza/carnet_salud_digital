const { MedicalRecord, Pet } = require("../models");

// Agregar un registro médico/vacuna a una mascota (Ruta Privada)
const addMedicalRecord = async (req, res) => {
  try {
    const { petId } = req.params;
    const { type, title, dateApplied, nextDueDate, notes } = req.body;

    if (!type || !title || !dateApplied) {
      return res.status(400).json({
        message: "El tipo, título y fecha de aplicación son obligatorios.",
      });
    }

    // Verificar que la mascota pertenezca a la veterinaria autenticada
    const pet = await Pet.findOne({
      where: { id: petId, userId: req.user.id },
    });

    if (!pet) {
      return res.status(404).json({
        message: "Mascota no encontrada o no autorizada.",
      });
    }

    const newRecord = await MedicalRecord.create({
      type,
      title,
      dateApplied,
      nextDueDate,
      notes,
      petId: pet.id,
    });

    res.status(201).json({
      message: "Registro médico agregado con éxito.",
      record: newRecord,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al agregar el registro médico." });
  }
};

// Eliminar un registro médico (Ruta Privada)
const deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await MedicalRecord.findByPk(id, {
      include: [{ model: Pet, where: { userId: req.user.id } }],
    });

    if (!record) {
      return res
        .status(404)
        .json({ message: "Registro médico no encontrado." });
    }

    await record.destroy();
    res.json({ message: "Registro médico eliminado correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar el registro médico." });
  }
};

module.exports = {
  addMedicalRecord,
  deleteMedicalRecord,
};
