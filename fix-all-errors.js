const fs = require('fs');
const path = require('path');

function fixFile(filePath, fixes) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const fix of fixes) {
      if (content.includes(fix.old)) {
        content = content.replace(new RegExp(fix.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.new);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
  return false;
}

// All fixes
const allFixes = [
  // Fix logger calls - these files are using console.error/log with multiple args which is fine
  // The actual error is that they're not imported correctly or used incorrectly

  // CompleteFoodLogScreen - NutritionLog issues
  {
    file: 'src/screens/nutrition/CompleteFoodLogScreen.tsx',
    fixes: [
      {
        old: 'const mealType = nutritionLog.mealType;',
        new: '// Get mealType from first meal entry if available\n    const mealType = nutritionLog.meals && nutritionLog.meals.length > 0 ? nutritionLog.meals[0].mealType : \'breakfast\';'
      },
      {
        old: 'mealType: nutritionLog.mealType,\n        items: nutritionLog.items,',
        new: '// Nutrition log uses meals array, not items directly'
      },
      {
        old: '        mealType,',
        new: '        meals: [{\n          id: Date.now().toString(),\n          mealType,\n          time: new Date().toISOString(),\n          items: foodItems.map(item => ({\n            foodId: item.id,\n            foodName: item.name,\n            quantity: item.servingSize || 1,\n            unit: item.servingUnit || \'g\',\n            macros: item.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 },\n            isQuickAdd: false\n          }))\n        }],'
      }
    ]
  },

  // FoodDiaryScreen - Fix DailyDiary and FoodIntake issues
  {
    file: 'src/screens/nutrition/FoodDiaryScreen.tsx',
    fixes: [
      {
        old: 'const mealsArray = Object.entries(diary.meals || {});',
        new: '// DailyDiary uses nutritionLog which has meals array\n    const mealsArray = diary.nutritionLog?.meals ? diary.nutritionLog.meals.map(m => [m.mealType, m]) : [];'
      }
    ]
  }
];

// Execute fixes
console.log('Starting fixes...\n');
let fixedCount = 0;

for (const fileFix of allFixes) {
  const fullPath = path.join(__dirname, fileFix.file);
  if (fs.existsSync(fullPath)) {
    if (fixFile(fullPath, fileFix.fixes)) {
      fixedCount++;
    }
  } else {
    console.log(`File not found: ${fullPath}`);
  }
}

console.log(`\nFixed ${fixedCount} files`);
