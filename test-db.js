const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'test123',
        name: 'Test User',
        role: 'USER'
      }
    });
    console.log('Usuario creado exitosamente:', user);
  } catch (error) {
    console.error('Error al crear el usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 