const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../database/prisma");
const imageService = require("../shared/image.service");

const publicUser = { id: true, name: true, email: true, imageUrl: true };

async function register({ name, email, password }) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword
    },
    select: publicUser
  });
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return null;
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return null;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl
    }
  };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUser
  });

  if (!user) {
    const error = new Error("Usuário não encontrado");
    error.statusCode = 404;
    throw error;
  }

  return user;
}

async function uploadProfileImage(userId, buffer) {
  const current = await getMe(userId);

  const imageUrl = await imageService.optimizeImage(buffer, "users");

  const user = await prisma.user.update({
    where: { id: userId },
    data: { imageUrl },
    select: publicUser
  });

  await imageService.removeImage(current.imageUrl);

  return user;
}

module.exports = {
  register,
  login,
  getMe,
  uploadProfileImage
};
