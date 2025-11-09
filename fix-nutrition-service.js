const fs = require('fs');

let content = fs.readFileSync('src/services/nutritionService.ts', 'utf8');

// Fix the forEach syntax error - need to add proper closing for nested forEach
content = content.replace(
  `    // Calculate totals
    logs.forEach(log => {
      log.meals.forEach(meal => meal.items.forEach(item => {
        const multiplier = item.quantity / 100; // Assuming nutrition per 100g
        daily.totalCalories += (item.calories || 0) * multiplier;
        daily.totalProtein += (item.protein || 0) * multiplier;
        daily.totalCarbs += (item.carbs || 0) * multiplier;
        daily.totalFat += (item.fat || 0) * multiplier;
        daily.totalFiber += (item.fiber || 0) * multiplier;
      });
    });`,
  `    // Calculate totals
    logs.forEach(log => {
      log.meals.forEach(meal => {
        meal.items.forEach(item => {
          const multiplier = item.quantity / 100; // Assuming nutrition per 100g
          daily.totalCalories += (item.macros?.calories || 0) * multiplier;
          daily.totalProtein += (item.macros?.protein || 0) * multiplier;
          daily.totalCarbs += (item.macros?.carbs || 0) * multiplier;
          daily.totalFat += (item.macros?.fat || 0) * multiplier;
          daily.totalFiber += (item.macros?.fiber || 0) * multiplier;
        });
      });
    });`
);

fs.writeFileSync('src/services/nutritionService.ts', content);
console.log('Fixed nutritionService.ts forEach syntax');
