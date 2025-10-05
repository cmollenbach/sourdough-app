const { PrismaClient } = require('@prisma/client');

async function enhancePlanningField() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🎯 Enhancing S&F planning field for comprehensive timing...\n');
    
    // Update the Custom Fold Schedule parameter to be more comprehensive
    const planningParam = await prisma.stepParameter.findFirst({
      where: { name: 'Custom Fold Schedule' }
    });
    
    if (planningParam) {
      await prisma.stepParameter.update({
        where: { id: planningParam.id },
        data: {
          name: 'Timing Plan',
          description: 'Complete timing strategy including S&F schedule and overall plan',
          helpText: 'Describe your full timing plan: S&F schedule, duration, specific times, or weekend/daily schedule. Examples: "Folds at 30, 60, 90min" or "Start 8am, bulk 4hrs with hourly folds, bake 2pm"'
        }
      });
      console.log(`✅ Enhanced "Custom Fold Schedule" → "Timing Plan" (ID: ${planningParam.id})`);
    } else {
      console.log('⚠️ Custom Fold Schedule parameter not found');
    }
    
    console.log('\n🎯 Planning Enhancement Complete!');
    console.log('✅ Field now supports comprehensive timing planning');
    console.log('✅ Users can describe complete schedules with S&F and timing');
    console.log('✅ Flexible text format supports any planning style');
    
  } catch (error) {
    console.error('❌ Error enhancing planning field:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

enhancePlanningField().catch(console.error);
