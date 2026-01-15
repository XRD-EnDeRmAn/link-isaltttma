const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

module.exports = (db, transporter, tempEmailDomains) => {
  // Kayıt
  router.post("/register", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "E-posta ve şifre gerekli." });

    const emailDomain = email.split("@")[1].toLowerCase();
    if (tempEmailDomains.includes(emailDomain)) {
      return res
        .status(400)
        .json({ error: "Geçici e-posta adresi kullanılamaz." });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    db.run(
      "INSERT INTO users (email, password, verification_code) VALUES (?, ?, ?)",
      [email, hashed, verificationCode],
      function (err) {
        if (err)
          return res
            .status(500)
            .json({ error: "E-posta zaten kullanılıyor olabilir." });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Doğrulama Kodunuz",
          text: `Kodunuz: ${verificationCode}`,
        };

        transporter
          .sendMail(mailOptions)
          .then(() => {
            req.session.tempEmail = email;
            res.json({ message: "Doğrulama kodu gönderildi." });
          })
          .catch((err) =>
            res.status(500).json({ error: "E-posta gönderilemedi." }),
          );
      },
    );
  });

  // E-posta doğrulama
  router.post("/verify-email", (req, res) => {
    const { email, verificationCode } = req.body;
    if (!email || !verificationCode)
      return res.status(400).json({ error: "E-posta ve kod gerekli." });

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
      if (err || !user)
        return res.status(404).json({ error: "Kullanıcı bulunamadı." });
      if (user.verification_code === verificationCode) {
        db.run(
          "UPDATE users SET email_verified = 1, verification_code = NULL WHERE email = ?",
          [email],
        );
        res.json({ message: "Doğrulama başarılı." });
      } else {
        res.status(400).json({ error: "Kod yanlış." });
      }
    });
  });

  // Giriş
  router.post("/login", (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
      if (err || !user)
        return res.status(401).json({ error: "Hatalı bilgiler." });
      if (!bcrypt.compareSync(password, user.password))
        return res.status(401).json({ error: "Şifre yanlış." });
      if (user.email_verified !== 1)
        return res.status(403).json({ error: "E-posta doğrulanmamış." });

      req.session.userId = user.id;
      req.session.username = email;
      res.json({ message: "Giriş başarılı." });
    });
  });

  // Çıkış
  router.get("/logout", (req, res) => {
    req.session.destroy();
    res.json({ message: "Çıkış yapıldı." });
  });

  return router;
};
