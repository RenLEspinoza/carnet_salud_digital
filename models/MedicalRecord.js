const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MedicalRecord = sequelize.define(
  "MedicalRecord",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.ENUM("Vacuna", "Desparasitación", "Consulta", "Examen"),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING, // Ej: "Vacuna Antirrábica", "Triple Felina", "Chequeo Anual"
      allowNull: false,
    },
    dateApplied: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    nextDueDate: {
      type: DataTypes.DATEONLY, // Próximo control/dosis
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = MedicalRecord;
