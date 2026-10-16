const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pet = sequelize.define(
  "Pet",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    publicId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Se genera al crear la mascota para usarse en el QR
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    species: {
      type: DataTypes.STRING, // Perro, Gato, etc.
      allowNull: false,
    },
    breed: {
      type: DataTypes.STRING, // Raza
    },
    birthDate: {
      type: DataTypes.DATEONLY,
    },
    microchip: {
      type: DataTypes.STRING,
    },
    ownerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ownerPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    photoUrl: {
      type: DataTypes.STRING, // URL de la foto de la mascota
    },
  },
  {
    timestamps: true,
  },
);

module.exports = Pet;
