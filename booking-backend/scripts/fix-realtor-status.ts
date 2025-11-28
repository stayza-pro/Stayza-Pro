import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRealtorStatus() {
  try {
    console.log('🔍 Checking current realtor statuses...');
    
    // Get all realtors and their current status
    const realtors = await prisma.realtor.findMany({
      select: {
        id: true,
        businessName: true,
        status: true,
        cacStatus: true,
        suspendedAt: true,
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });

    console.log('📊 Current Realtor Status:');
    realtors.forEach(realtor => {
      console.log(`- ${realtor.businessName} (${realtor.user.email})`);
      console.log(`  Status: ${realtor.status}, CAC: ${realtor.cacStatus}, Suspended: ${!!realtor.suspendedAt}`);
    });

    if (realtors.length === 0) {
      console.log('❌ No realtors found in database');
      return;
    }

    console.log('\n🔧 Fixing realtor statuses...');
    
    // Update all realtors to be approved and CAC verified
    const updateResult = await prisma.realtor.updateMany({
      data: {
        status: 'APPROVED',
        cacStatus: 'APPROVED',
        suspendedAt: null,
        cacVerifiedAt: new Date(),
        canAppeal: true
      }
    });

    console.log(`✅ Updated ${updateResult.count} realtors to APPROVED status with CAC verification`);

    // Verify the changes
    const updatedRealtors = await prisma.realtor.findMany({
      select: {
        id: true,
        businessName: true,
        status: true,
        cacStatus: true,
        suspendedAt: true
      }
    });

    console.log('\n📊 Updated Realtor Status:');
    updatedRealtors.forEach(realtor => {
      console.log(`- ${realtor.businessName}: Status=${realtor.status}, CAC=${realtor.cacStatus}`);
    });

  } catch (error) {
    console.error('❌ Error fixing realtor status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRealtorStatus();