import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL!,
});

async function main() {
  const user = await prisma.user.create({ data: {} });

  const client = await prisma.client.upsert({
    where: {
      userId_name: { userId: user.id, name: 'Acme Startup' },
    },
    update: {},
    create: { name: 'Acme Startup', userId: user.id },
  });

  await prisma.changeRequest.create({
    data: {
      publicId: randomUUID(), // ✅ required now
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
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
