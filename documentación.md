# Documentación de proceso de Proyecto

## Fase 1

## Iniciar proyecto

### Paso 1: Inicializar proyecto Node.js

```bash
npm init -y
```

### Instalar dependencias principales

```bash
npm install express pg pg-hstore sequelize dotenv bcryptjs jsonwebtoken cors qrcode
```

### Instalar dependencias de desarrollo

```bash
npm install -D nodemon
```

### Agregar Script en package.json para ejecutar en modo desarrollo

```JavaScript
"scripts": {
  "dev": "nodemon index.js",
  "start": "node index.js"
}
```

## Paso 2: Configurar estructura de archivos base Backend

CSD_v1/
├── config/
│ └── database.js
├── models/
│ ├── index.js
│ ├── User.js
│ ├── Pet.js
│ └── MedicalRecord.js
├── .env
├── index.js
└── package.json

## Paso 3: Variables de Entorno y Conexión a Base de Datos / Crear archivo .env

```JavaScript
PORT=3000
DB_NAME=vet_carnet_db
DB_USER=postgres
DB_PASSWORD=tu_password_local
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=secreto_super_seguro_para_jwt
```

### Configurar database.js

```JavaScript
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // Puedes poner console.log para ver las queries SQL si lo deseas
  }
);

module.exports = sequelize;
```

## Paso 4: Definición de modelos en Sequelize

**models/User.js:** (Veterinaria / Administrador)
**models/Pet.js:** (Ficha de la Mascota)
**models/MedicalRecord.js** (Vacunas, Desparasitaciones y Atenciones)

## Paso 5: Asociaciones entre modelos ( models/index.js )

Centralizamos los modelos y definimos las relaciones de Sequelize:
1 User (Veterinaria) ---> N Pets1
Pet ---> N MedicalRecords

## Paso 6: Servidor Express e Inicialización ( index.js )

```JavaScript
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
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
```

## Fase 2 / Rutas / AUTH / JWT

### Paso 1: Crear carpeta /middlewares, crear archivo auth.js / Protección de rutas privadas usando JWT

```JavaScript
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato esperado: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Guardamos { id, email, vetName }
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado.' });
  }
};

module.exports = verifyToken;
```

### Paso 2: Autenticación (Controlador y Rutas)

Registro con bcrypt y Login con generación de JWT
Crear carpetas controllers y routes.
**Implementar controlador de registro y login.**

```JavaScript

// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Registro de la Veterinaria
const register = async (req, res) => {
  try {
    const { email, password, vetName, phone } = req.body;

    if (!email || !password || !vetName) {
      return res.status(400).json({ message: 'Email, contraseña y nombre de la veterinaria son obligatorios.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
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
      message: 'Veterinaria registrada con éxito.',
      user: { id: newUser.id, email: newUser.email, vetName: newUser.vetName },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al registrar el usuario.' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Credenciales inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas.' });
    }

    // Generar el token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, vetName: user.vetName },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: { id: user.id, email: user.email, vetName: user.vetName },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al iniciar sesión.' });
  }
};

module.exports = { register, login };
```

**Implementar el archivo de rutas de autenticación:**

```JavaScript
// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);

module.exports = router;
```

### Paso 3: Mascotas y Generación de QR

**Creación de fichas, generación de publicId y código QR.**

Implementa las funciones para crear mascotas, listar las mascotas asociadas al veterinario autenticado,
consultar la ficha pública por publicId y generar la imagen Base64 del código QR.

**Agregar archivo de rutas para las mascotas**

```JavaScript
// routes/petRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const {
  createPet,
  getMyPets,
  getPetByPublicId,
  getPetQRCode,
} = require('../controllers/petController');

// Rutas protegidas por JWT
router.post('/', verifyToken, createPet);
router.get('/my-pets', verifyToken, getMyPets);

// Rutas públicas (Escaneo y vista del QR)
router.get('/public/:publicId', getPetByPublicId);
router.get('/public/:publicId/qr', getPetQRCode);

module.exports = router;
```

### Paso 4: Registrar las Rutas en el Servidor

Conexión de los endpoints en index.js
**Importar e integrar authRoutes y petRoutes en el index.js principal**

```JavaScript
// index.js (fragmento de rutas)
const authRoutes = require('./routes/authRoutes');
const petRoutes = require('./routes/petRoutes');

// ...middlewares express.json() y cors()...

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
```

## Fase 3 / Modulo de atenciones Médicas e Historial (MedicalRecord)

### Paso 1: Controlador de Registros Médicos (controllers/medicalRecordController.js)

Crear medicalRecordController.js para manejo de inserción y consulta de vacunas o atenciones.

```JavaScript
const { MedicalRecord, Pet } = require('../models');

// Agregar un registro médico/vacuna a una mascota (Ruta Privada)
const addMedicalRecord = async (req, res) => {
  try {
    const { petId } = req.params;
    const { type, title, dateApplied, nextDueDate, notes } = req.body;

    if (!type || !title || !dateApplied) {
      return res.status(400).json({
        message: 'El tipo, título y fecha de aplicación son obligatorios.',
      });
    }

    // Verificar que la mascota pertenezca a la veterinaria autenticada
    const pet = await Pet.findOne({
      where: { id: petId, userId: req.user.id },
    });

    if (!pet) {
      return res.status(404).json({
        message: 'Mascota no encontrada o no autorizada.',
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
      message: 'Registro médico agregado con éxito.',
      record: newRecord,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al agregar el registro médico.' });
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
      return res.status(404).json({ message: 'Registro médico no encontrado.' });
    }

    await record.destroy();
    res.json({ message: 'Registro médico eliminado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el registro médico.' });
  }
};

module.exports = {
  addMedicalRecord,
  deleteMedicalRecord,
};
```

### Paso 2: Rutas del Registro Médico (routes/medicalRecordRoutes.js)

```JavaScript
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const {
  addMedicalRecord,
  deleteMedicalRecord,
} = require('../controllers/medicalRecordController');

// Rutas protegidas por JWT
router.post('/pet/:petId', verifyToken, addMedicalRecord);
router.delete('/:id', verifyToken, deleteMedicalRecord);

module.exports = router;
```

### Paso 3: Registrar la nueva ruta en index.js

_Agregar el import y la ruta en el servidor principal._

```JavaScript
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');

// ... middlewares ...

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/records', medicalRecordRoutes); // <-- Nueva ruta
```

### Paso 4: Realización de pruebas en ThunderCLient/Postman

_Pruebas sugeridas_

**1. Login:** _Obtener el token del usuario registrado._
POST http://localhost:3000/api/auth/login

```JSON
{
"email":"email@mail.com",
"password":"12345678",
}
```

_Prueba exitosa_

**2. Crear Mascota:**
POST http://localhost:3000/api/pets
Header: Authorization: Bearer <TOKEN>
Body JSON:

```JSON
{
"name": "Cachupín",
"species": "Perro",
"breed": "Quiltro",
"ownerName": "Renato López",
"ownerPhone": "+56912345678"
}
```

_Prueba exitosa_

**3. Agregar vacuna a la Mascota (id:1):**
POST http://localhost:3000/api/records/pet/1
Header: Authorization: Bearer <TOKEN>
Body JSON:

```JSON
{
"type": "Vacuna",
"title": "Octuple / Sextuple",
"dateApplied": "2026-10-15",
"nextDueDate": "2027-10-15",
"notes": "Aplicada sin reacciones adversas."
}
```

_Prueba exitosa_

**4. Ver Ficha Pública por publicId (Ficha de Carnet Digital):**
GET http://localhost:3000/api/pets/public/<publicId_de_Palta>
_Respuesta esperada: Datos de Cachupín + arreglo MedicalRecords con la vacuna recién creada._
_Prueba exitosa_

**5. Prueba extra: Prueba de generación de la imagen del código QR**
Método: GET
URL: http://localhost:3000/api/pets/public/TU_PUBLIC_ID_AQUI/qr
Hacer clic en Send.
_Prueba exitosa_
