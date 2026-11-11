const sharp = require("sharp");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");

async function optimizeImage(buffer) {
  const filename = `${crypto.randomUUID()}.webp`;
  const directory = path.resolve(process.cwd(), "uploads", "dishes");

  await fs.mkdir(directory, { recursive: true });

  const filePath = path.join(directory, filename);

  let info;
  try {
    info = await sharp(buffer)
      .rotate()
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filePath);
  } catch (err) {
    // O mimetype veio como imagem, mas o Sharp não conseguiu decodificar
    const error = new Error("Arquivo de imagem inválido ou corrompido");
    error.statusCode = 400;
    throw error;
  }

  const original = await sharp(buffer).metadata();

  console.log(
    `[IMAGEM] original: ${original.format} ${original.width}x${original.height} ${(buffer.length / 1024).toFixed(1)} KB` +
      ` -> otimizada: webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(1)} KB`
  );

  return `/uploads/dishes/${filename}`;
}

module.exports = {
  optimizeImage
};
