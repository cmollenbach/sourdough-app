const { PrismaClient } = require('@prisma/client');

async function checkTemplates() {
  const prisma = new PrismaClient();
  
  try {
    const templates = await prisma.stepTemplate.findMany({
      include: {
        ingredientRules: {
          include: {
            ingredientCategory: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { role: 'asc' }
    });

    console.log('Step Templates and their ingredient rules:\n');
    
    templates.forEach(template => {
      console.log(`${template.role} - ${template.name}:`);
      if (template.ingredientRules.length === 0) {
        console.log('  (no ingredient rules)');
      } else {
        template.ingredientRules.forEach(rule => {
          console.log(`  - ${rule.ingredientCategory.name} ${rule.required ? '(required)' : '(optional)'}`);
        });
      }
      console.log('');
    });
    
    // Focus on MIX steps
    const mixTemplates = templates.filter(t => t.role === 'MIX');
    console.log('\n=== MIX STEPS ANALYSIS ===');
    mixTemplates.forEach(template => {
      console.log(`\n${template.name}:`);
      const prefermentRules = template.ingredientRules.filter(rule => rule.ingredientCategory.name === 'Preferment');
      const saltRules = template.ingredientRules.filter(rule => rule.ingredientCategory.name === 'Salt');
      
      console.log(`  Preferment rules: ${prefermentRules.length}`);
      prefermentRules.forEach(rule => console.log(`    - ${rule.ingredientCategory.name} ${rule.required ? '(required)' : '(optional)'}`));
      
      console.log(`  Salt rules: ${saltRules.length}`);
      saltRules.forEach(rule => console.log(`    - ${rule.ingredientCategory.name} ${rule.required ? '(required)' : '(optional)'}`));
    });
    
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplates().catch(console.error);
