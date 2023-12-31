const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const { USERS } = require("../items"); 

const router = express.Router();


const registerValidator = [
  body("fullName").notEmpty().withMessage("Harus diisi"),
  body("email")
    .notEmpty()
    .withMessage("Email harus diisi")
    .isEmail()
    .withMessage("Email tidak valid"),
  body("password")
    .notEmpty()
    .withMessage("Password harus diisi")
    .isLength({ min: 8 })
    .withMessage("Password minimal 8 karakter")
    .matches(/[\W]/)
    .withMessage("Password harus memiliki minimal 1 simbol"),
  body("dob")
    .notEmpty()
    .withMessage("Tanggal lahir wajib diisi")
    .isISO8601()
    .withMessage("Format tanggal lahir tidak valid. Gunakan format YYYY-MM-DD."),
];


const loginValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email harus diisi")
    .isEmail()
    .withMessage("Email tidak valid"),
  body("password")
    .notEmpty()
    .withMessage("Password harus diisi")
    .isLength({ min: 8 })
    .withMessage("Password minimal 8 karakter")
    .matches(/[\W]/)
    .withMessage("Password harus memiliki minimal 1 simbol"),
];


router.post("/auth/register", registerValidator, (req, res) => {
  const validateResult = validationResult(req);
  if (!validateResult.isEmpty()) {
    return res.status(400).json({
      status: "failed",
      message: "Validation error",
      errors: validateResult.array(),
    });
  }

  const { fullName, email, password, bio, dob } = req.body;

  const existingUser = USERS.find((user) => user.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "Email sudah terdaftar" });
  }

  
  const id = USERS.length + 1;
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ message: "Internal Server Error" });
    }

    USERS.push({
      id,
      fullName,
      email,
      password: hashedPassword,
      bio,
      dob,
    });

    return res.status(201).json({
      status: "success",
      message: "Berhasil register",
      data: {
        id,
        fullName,
        email,
        bio,
        dob,
      },
    });
  });
});


router.post("/auth/login", loginValidator, (req, res) => {
  const validateResult = validationResult(req);
  if (!validateResult.isEmpty()) {
    return res.status(400).json({
      status: "failed",
      message: "Validation error",
      errors: validateResult.array(),
    });
  }

  const { email, password } = req.body;

 
  const user = USERS.find((user) => user.email === email);
  if (!user) {
    return res.status(401).json({ message: "Email tidak ditemukan" });
  }

  
  bcrypt.compare(password, user.password, (err, result) => {
    if (err || !result) {
      return res.status(401).json({ message: "Password tidak ditemukan" });
    }

    const tokenData = { id: user.id, email: user.email };
    
    return res.status(200).json({
      status: "success",
      message: "Login berhasil",
      data: {
        token: "YOUR_JWT_TOKEN_HERE",
      },
    });
  });
});


router.get("/", (req, res) => {
  return res.status(200).json({
    status: "success",
    message: "Berhasil mendapatkan list user yang terdaftar",
    data: USERS.map((user) => ({
      fullName: user.fullName,
      email: user.email,
      bio: user.bio,
      dob: user.dob,
    })),
  });
});


router.get("/:userId", (req, res) => {
  const userId = parseInt(req.params.userId);

  if (isNaN(userId)) {
    return res.status(400).json({ message: "Validation Error" });
  }

  const user = USERS.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({
    status: "success",
    message: "Berhasil mendapatkan data user",
    data: {
      fullName: user.fullName,
      email: user.email,
      bio: user.bio,
      dob: user.dob,
    },
  });
});

module.exports = router;
