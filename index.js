const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const authRoutes = require("./routes/authRoutes");
const petRoutes = require("./routes/petRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "API del Carnet Digital Veterinario activa 🐾" });
});

// ...middlewares express.json() y cors()...

app.use("/api/auth", authRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/records", medicalRecordRoutes);

// Middleware para capturar JSON malformado
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message:
        "El formato JSON enviado en el Body no es válido. Revisa comillas y sintaxis.",
    });
  }
  next();
});

// Arrancar servidor y sincronizar base de datos
async function main() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a PostgreSQL establecida con éxito.");

    // sync({ alter: true }) actualiza las tablas según los modelos sin borrarlas
    await sequelize.sync({ alter: true });
    console.log("✅ Tablas sincronizadas con Sequelize.");

    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
  }
}

main();
