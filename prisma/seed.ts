// prisma/seed.ts
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL!, // prisma+postgres://... (your Accelerate URL)
});

async function main() {
  const user = await prisma.user.create({ data: {} });

  const client = await prisma.client.create({
    data: { name: 'Acme Startup', userId: user.id },
  });

  await prisma.changeRequest.create({
    data: {
      message: 'Can you make a quick logo tweak?',
      price: 5000,
      status: 'pending',
      userId: user.id,
      clientId: client.id,
    },
  });

  console.log('Seed data inserted');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
