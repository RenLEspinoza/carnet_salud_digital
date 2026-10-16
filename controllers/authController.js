// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

// Registro de la Veterinaria
const register = async (req, res) => {
  try {
    const { email, password, vetName, phone } = req.body;

    if (!email || !password || !vetName) {
      return res.status(400).json({
        message:
          "Email, contraseña y nombre de la veterinaria son obligatorios.",
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado." });
    }

    // Encriptar la contraseña con bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      vetName,
      phone,
    });

    res.status(201).json({
      message: "Veterinaria registrada con éxito.",
      user: { id: newUser.id, email: newUser.email, vetName: newUser.vetName },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error en el servidor al registrar el usuario." });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Credenciales inválidas." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Credenciales inválidas." });
    }

    // Generar el token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, vetName: user.vetName },
      process.env.JWT_SECRET,
      { expiresIn: "12h" },
    );

    res.json({
      message: "Inicio de sesión exitoso.",
      token,
      user: { id: user.id, email: user.email, vetName: user.vetName },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error en el servidor al iniciar sesión." });
  }
};

module.exports = { register, login };
