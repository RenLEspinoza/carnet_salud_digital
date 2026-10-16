const sequelize = require("../config/database");
const User = require("./User");
const Pet = require("./Pet");
const MedicalRecord = require("./MedicalRecord");

// Centralizamos los modelos y definimos las relaciones de Sequelize:
// 1 User (Veterinaria) ---> N Pets
// 1 Pet ---> N MedicalRecords

// Relaciones
User.hasMany(Pet, { foreignKey: "userId", onDelete: "CASCADE" });
Pet.belongsTo(User, { foreignKey: "userId" });

Pet.hasMany(MedicalRecord, { foreignKey: "petId", onDelete: "CASCADE" });
MedicalRecord.belongsTo(Pet, { foreignKey: "petId" });

module.exports = {
  sequelize,
  User,
  Pet,
  MedicalRecord,
};
