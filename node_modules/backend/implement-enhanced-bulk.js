const { PrismaClient } = require('@prisma/client');

async function implementEnhancedBulkFermentation() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Implementing Enhanced Bulk Fermentation with Integrated S&F...\n');
    
    // Step 1: Create new parameters for S&F methodology
    console.log('📋 Step 1: Creating new S&F parameters...');
    
    const sfMethodParam = await prisma.stepParameter.create({
      data: {
        name: 'S&F Method',
        type: 'STRING',
        description: 'Stretch and fold methodology during bulk fermentation',
        defaultValue: 'Basic',
        helpText: 'None: Just bulk ferment. Basic: Regular S&F. Intensive: Custom timing.'
      }
    });
    console.log(`✅ Created "S&F Method" parameter (ID: ${sfMethodParam.id})`);
    
    const firstFoldParam = await prisma.stepParameter.create({
      data: {
        name: 'First Fold After (minutes)',
        type: 'NUMBER',
        description: 'Minutes after bulk start to perform first stretch & fold',
        defaultValue: '30',
        helpText: 'Time after bulk fermentation starts to perform first fold'
      }
    });
    console.log(`✅ Created "First Fold After" parameter (ID: ${firstFoldParam.id})`);
    
    const foldIntervalParam = await prisma.stepParameter.create({
      data: {
        name: 'Interval Between Folds (minutes)',
        type: 'NUMBER',
        description: 'Minutes between each stretch & fold',
        defaultValue: '30',
        helpText: 'Regular interval for basic method folds'
      }
    });
    console.log(`✅ Created "Interval Between Folds" parameter (ID: ${foldIntervalParam.id})`);
    
    const customScheduleParam = await prisma.stepParameter.create({
      data: {
        name: 'Custom Fold Schedule',
        type: 'STRING',
        description: 'Comma-separated minutes for custom fold timing (e.g., "30,60,90,150")',
        defaultValue: '',
        helpText: 'For intensive method: comma-separated minutes (overrides interval)'
      }
    });
    console.log(`✅ Created "Custom Fold Schedule" parameter (ID: ${customScheduleParam.id})`);
    
    const foldStrengthParam = await prisma.stepParameter.create({
      data: {
        name: 'Fold Strength',
        type: 'STRING',
        description: 'Intensity of stretch and fold technique',
        defaultValue: 'Medium',
        helpText: 'Light: gentle, Medium: standard, Strong: vigorous'
      }
    });
    console.log(`✅ Created "Fold Strength" parameter (ID: ${foldStrengthParam.id})`);
    
    // Step 2: Find the existing Bulk Ferment template
    console.log('\n📋 Step 2: Updating Bulk Ferment template...');
    
    const bulkTemplate = await prisma.stepTemplate.findFirst({
      where: {
        role: 'BULK',
        name: 'Bulk Ferment'
      }
    });
    
    if (!bulkTemplate) {
      throw new Error('Bulk Ferment template not found!');
    }
    
    console.log(`✅ Found Bulk Ferment template (ID: ${bulkTemplate.id})`);
    
    // Step 3: Add new parameters to the Bulk Ferment template
    console.log('\n📋 Step 3: Adding S&F parameters to Bulk Ferment template...');
    
    const parameterMappings = [
      {
        parameterId: sfMethodParam.id,
        defaultValue: 'Basic',
        order: 3,
        advanced: false,
        description: 'Choose stretch & fold methodology',
        helpText: 'None: Just bulk ferment. Basic: Regular S&F. Intensive: Custom timing.'
      },
      {
        parameterId: firstFoldParam.id,
        defaultValue: '30',
        order: 4,
        advanced: false,
        description: 'When to start stretch & folds',
        helpText: 'Time after bulk fermentation starts to perform first fold'
      },
      {
        parameterId: foldIntervalParam.id,
        defaultValue: '30',
        order: 5,
        advanced: false,
        description: 'Time between each fold',
        helpText: 'Regular interval for basic method folds'
      },
      {
        parameterId: customScheduleParam.id,
        defaultValue: '',
        order: 6,
        advanced: true,
        description: 'Custom fold timing',
        helpText: 'For intensive method: comma-separated minutes (overrides interval)'
      },
      {
        parameterId: foldStrengthParam.id,
        defaultValue: 'Medium',
        order: 7,
        advanced: true,
        description: 'Fold technique intensity',
        helpText: 'Light: gentle, Medium: standard, Strong: vigorous'
      }
    ];
    
    for (const mapping of parameterMappings) {
      await prisma.stepTemplateParameter.create({
        data: {
          stepTemplateId: bulkTemplate.id,
          parameterId: mapping.parameterId,
          defaultValue: mapping.defaultValue,
          order: mapping.order,
          advanced: mapping.advanced,
          description: mapping.description,
          helpText: mapping.helpText,
          visible: true,
          active: true
        }
      });
      console.log(`✅ Added parameter to template: ${mapping.description}`);
    }
    
    // Step 4: Update the template description
    console.log('\n📋 Step 4: Updating template description...');
    
    await prisma.stepTemplate.update({
      where: { id: bulkTemplate.id },
      data: {
        description: 'The first major rise of the dough after mixing, with integrated stretch & fold methodology. During this time, yeast produces CO2, gluten structure develops, and optional S&F builds strength.'
      }
    });
    console.log('✅ Updated Bulk Ferment template description');
    
    // Step 5: Mark the separate "Stretch & Fold" template as deprecated
    console.log('\n📋 Step 5: Deprecating separate Stretch & Fold template...');
    
    const sfTemplate = await prisma.stepTemplate.findFirst({
      where: {
        role: 'BULK',
        name: 'Stretch & Fold'
      }
    });
    
    if (sfTemplate) {
      await prisma.stepTemplate.update({
        where: { id: sfTemplate.id },
        data: {
          active: false,
          description: 'DEPRECATED: Stretch & fold is now integrated into the enhanced Bulk Ferment step. Use Bulk Ferment with S&F Method instead.'
        }
      });
      console.log('✅ Marked separate "Stretch & Fold" template as deprecated');
    }
    
    console.log('\n🎉 Enhanced Bulk Fermentation Implementation Complete!');
    console.log('\n📋 SUMMARY:');
    console.log('✅ Added S&F Method parameter (None/Basic/Intensive)');
    console.log('✅ Added timing parameters for fold scheduling');
    console.log('✅ Added advanced customization options');
    console.log('✅ Enhanced Bulk Ferment template description');
    console.log('✅ Deprecated separate Stretch & Fold template');
    console.log('\n🔄 Frontend will need updates to:');
    console.log('  - Display S&F parameters conditionally');
    console.log('  - Show timeline visualization');
    console.log('  - Calculate fold schedules');
    console.log('  - Provide timer suggestions');
    
  } catch (error) {
    console.error('❌ Error implementing enhanced bulk fermentation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

implementEnhancedBulkFermentation().catch(console.error);
