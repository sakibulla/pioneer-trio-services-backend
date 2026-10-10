const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database tables...\n');
    
    // Try to query users table
    const userCount = await prisma.user.count();
    console.log('✅ users table exists - Records:', userCount);
    
    // Check other tables
    const clientCount = await prisma.client.count();
    console.log('✅ clients table exists - Records:', clientCount);
    
    const profileCount = await prisma.matrimonialProfile.count();
    console.log('✅ matrimonial_profiles table exists - Records:', profileCount);
    
    console.log('\n✅ All tables created successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P1025') {
      console.log('\n⚠️  Database connection failed. Ensure DATABASE_URL is set.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
