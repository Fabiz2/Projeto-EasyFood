const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error("Formato de imagem não permitido (use JPEG, PNG ou WebP)");
      error.statusCode = 400;
      return callback(error);
    }

    callback(null, true);
  }
});

module.exports = upload;
