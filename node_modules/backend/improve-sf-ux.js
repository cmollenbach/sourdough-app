const { PrismaClient } = require('@prisma/client');

async function improveSFUserExperience() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🎨 Improving S&F Parameter User Experience...\n');
    
    // Step 1: Update S&F Method parameter to be a proper dropdown with validation
    console.log('📋 Step 1: Updating S&F Method parameter...');
    
    const sfMethodParam = await prisma.stepParameter.update({
      where: { name: 'S&F Method' },
      data: {
        type: 'STRING',
        description: 'Choose stretch & fold methodology for bulk fermentation',
        defaultValue: 'None',
        helpText: 'None: Just bulk ferment without S&F. Basic: 4 folds at 30min intervals. Intensive: Custom timing with more folds.'
      }
    });
    console.log(`✅ Updated S&F Method parameter (ID: ${sfMethodParam.id})`);
    
    // Step 2: Update the step template parameters to mark S&F timing as advanced
    console.log('\n📋 Step 2: Making S&F timing parameters conditional...');
    
    // Find the Bulk Ferment template
    const bulkTemplate = await prisma.stepTemplate.findFirst({
      where: {
        role: 'BULK',
        name: 'Bulk Ferment'
      },
      include: {
        parameters: {
          include: {
            parameter: true
          }
        }
      }
    });
    
    if (!bulkTemplate) {
      throw new Error('Bulk Ferment template not found!');
    }
    
    // Update S&F timing parameters to be conditional/advanced
    const sfParameterNames = [
      'First Fold After (minutes)',
      'Interval Between Folds (minutes)', 
      'Custom Fold Schedule',
      'Fold Strength'
    ];
    
    for (const paramName of sfParameterNames) {
      const templateParam = bulkTemplate.parameters.find(p => p.parameter.name === paramName);
      if (templateParam) {
        await prisma.stepTemplateParameter.update({
          where: { id: templateParam.id },
          data: {
            visible: false,  // Start hidden
            advanced: true,  // Marked as advanced
            description: `S&F timing parameter - shows when S&F Method is not "None"`,
            helpText: templateParam.helpText + ' (Only visible when using S&F)'
          }
        });
        console.log(`✅ Updated ${paramName} to be conditional`);
      }
    }
    
    // Step 3: Update the S&F Method parameter template to control visibility
    const sfMethodTemplateParam = bulkTemplate.parameters.find(p => p.parameter.name === 'S&F Method');
    if (sfMethodTemplateParam) {
      await prisma.stepTemplateParameter.update({
        where: { id: sfMethodTemplateParam.id },
        data: {
          visible: true,
          advanced: false,
          description: 'Controls stretch & fold methodology and shows related timing options',
          helpText: 'Choose None to hide S&F options, Basic for simple scheduling, or Intensive for custom timing',
          order: 3  // Right after Duration and Temperature
        }
      });
      console.log('✅ Updated S&F Method to control visibility');
    }
    
    console.log('\n🎨 User Experience Improvements Complete!');
    console.log('\n📋 SUMMARY:');
    console.log('✅ S&F Method is now the primary control');
    console.log('✅ S&F timing parameters are hidden by default');
    console.log('✅ Parameters show conditionally based on S&F Method');
    console.log('✅ Cleaner, progressive disclosure interface');
    
    console.log('\n🎯 UI BEHAVIOR:');
    console.log('  - S&F Method: None → No S&F parameters visible');
    console.log('  - S&F Method: Basic → Show timing parameters');
    console.log('  - S&F Method: Intensive → Show all parameters including custom schedule');
    
    console.log('\n🔄 Frontend needs update to:');
    console.log('  - Render S&F Method as dropdown with options: None, Basic, Intensive');
    console.log('  - Show/hide S&F timing parameters based on S&F Method value');
    console.log('  - Implement conditional parameter visibility logic');
    
  } catch (error) {
    console.error('❌ Error improving S&F UX:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

improveSFUserExperience().catch(console.error);
