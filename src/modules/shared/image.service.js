const sharp = require("sharp");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");

const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");

const PRESETS = {
  dishes: { width: 800, fit: "inside" },
  users: { width: 400, height: 400, fit: "cover" }
};

async function optimizeImage(buffer, folder = "dishes") {
  const preset = PRESETS[folder];
  if (!preset) {
    throw new Error(`Tipo de imagem desconhecido: ${folder}`);
  }

  const filename = `${crypto.randomUUID()}.webp`;
  const directory = path.join(UPLOADS_ROOT, folder);

  await fs.mkdir(directory, { recursive: true });

  const filePath = path.join(directory, filename);

  let info;
  try {
    info = await sharp(buffer)
      .rotate()
      .resize({
        width: preset.width,
        height: preset.height,
        fit: preset.fit,
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(filePath);
  } catch (err) {
    const error = new Error("Arquivo de imagem inválido ou corrompido");
    error.statusCode = 400;
    throw error;
  }

  const original = await sharp(buffer).metadata();

  console.log(
    `[IMAGEM:${folder}] original: ${original.format} ${original.width}x${original.height} ${(buffer.length / 1024).toFixed(1)} KB` +
      ` -> otimizada: webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(1)} KB`
  );

  return `/uploads/${folder}/${filename}`;
}

async function removeImage(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;

  const filePath = path.resolve(process.cwd(), "." + imageUrl);
  if (!filePath.startsWith(UPLOADS_ROOT)) return;

  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`[IMAGEM] Não foi possível remover ${imageUrl}: ${err.message}`);
    }
  }
}

module.exports = {
  optimizeImage,
  removeImage
};
