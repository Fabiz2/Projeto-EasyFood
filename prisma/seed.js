require("dotenv").config({ quiet: true });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.restaurant.count();
  if (count > 0) {
    console.log("Banco já possui restaurantes, seed ignorado.");
    return;
  }

  await prisma.restaurant.create({
    data: {
      name: "Pizzaria Napoli",
      category: "Pizza",
      rating: 4.5,
      dishes: {
        create: [
          { name: "Pizza Margherita", description: "Molho de tomate, muçarela e manjericão", price: 49.9 },
          { name: "Calabresa", description: "Calabresa fatiada, cebola roxa e azeitonas", price: 46.0 }
        ]
      }
    }
  });

  await prisma.restaurant.create({
    data: {
      name: "Burger House",
      category: "Burger",
      rating: 4.2,
      dishes: {
        create: [
          { name: "Cheddar Bacon", description: "Blend 180g, cheddar, bacon e pão brioche", price: 38.5 }
        ]
      }
    }
  });

  await prisma.restaurant.create({
    data: { name: "Sushi Express", category: "Japonesa", rating: 4.8 }
  });

  console.log("Dados inseridos com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
