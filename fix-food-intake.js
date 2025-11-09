const fs = require('fs');

// Fix FoodDiaryScreen.tsx - FoodIntake property access
let content = fs.readFileSync('src/screens/nutrition/FoodDiaryScreen.tsx', 'utf8');

// Replace item.name with item.foodItem.name
content = content.replace(/(?<!foodItem\.)item\.name/g, 'item.foodItem.name');

// Replace item.servingSize with item.amount (FoodIntake uses 'amount', not 'servingSize')
content = content.replace(/item\.servingSize/g, 'item.amount');

// Replace item.quantity with item.amount
content = content.replace(/item\.quantity/g, 'item.amount');

// Fix DailyDiary.meals access - diary should have nutritionLog property
content = content.replace(/diary\.meals/g, 'diary.nutritionLog?.meals');

fs.writeFileSync('src/screens/nutrition/FoodDiaryScreen.tsx', content);
console.log('✓ Fixed FoodDiaryScreen.tsx FoodIntake property access');
