const fs = require('fs');

// Fix CompleteFoodLogScreen.tsx
let completeFoodLog = fs.readFileSync('src/screens/nutrition/CompleteFoodLogScreen.tsx', 'utf8');

// Fix the logMeal call to use proper NutritionLog structure
completeFoodLog = completeFoodLog.replace(
  /await nutritionService\.logMeal\(\{\s+userId: user\?\.id \|\| '1',\s+date: selectedDate,\s+mealType: selectedMeal,\s+items: \[entry\],\s+totalCalories: entry\.calories,\s+totalProtein: entry\.protein,\s+totalCarbs: entry\.carbs,\s+totalFat: entry\.fat,\s+\}\);/,
  `await nutritionService.logMeal({
      userId: user?.id || '1',
      date: selectedDate,
      meals: [{
        id: Date.now().toString(),
        mealType: selectedMeal,
        time: new Date().toISOString(),
        items: [entry].map(item => ({
          foodId: item.foodId,
          foodName: item.name,
          quantity: item.quantity || 1,
          unit: item.unit || 'g',
          macros: {
            calories: item.calories || 0,
            protein: item.protein || 0,
            carbs: item.carbs || 0,
            fat: item.fat || 0
          },
          isQuickAdd: false
        }))
      }],
      water: 0,
      totals: {
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat
      },
      targets: {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 65
      }
    });`
);

fs.writeFileSync('src/screens/nutrition/CompleteFoodLogScreen.tsx', completeFoodLog);
console.log('Fixed CompleteFoodLogScreen.tsx');

// Fix nutritionService.ts
let nutritionService = fs.readFileSync('src/services/nutritionService.ts', 'utf8');

// Fix line 134 - change .items to .meals
nutritionService = nutritionService.replace(
  /log\.items\.forEach\(/g,
  'log.meals.forEach(meal => meal.items.forEach('
);

// Need to close the extra forEach
nutritionService = nutritionService.replace(
  /log\.meals\.forEach\(meal => meal\.items\.forEach\((item(?:, index)?) => \{/g,
  'log.meals.forEach(meal => { meal.items.forEach(($1) => {'
);

fs.writeFileSync('src/services/nutritionService.ts', nutritionService);
console.log('Fixed nutritionService.ts');

console.log('All nutrition errors fixed!');
