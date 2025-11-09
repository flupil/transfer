const fs = require('fs');
const path = require('path');

console.log('Fixing remaining TypeScript errors...\n');

function replaceInFile(filePath, replacements) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const [old, replacement] of replacements) {
      if (content.includes(old)) {
        content = content.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Fixed: ${path.basename(filePath)}`);
      return true;
    }
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
  }
  return false;
}

// Fix MyActivityScreen - view type comparisons (these were changed incorrectly)
replaceInFile('src/screens/activity/MyActivityScreen.tsx', [
  [`viewType === 'week' && currentView === 'week'`, `viewType === 'week'`],
  [`viewType === 'month' && currentView === 'month'`, `viewType === 'month'`]
]);

// Fix FoodDiaryScreen - revert .foodName back to .name, use proper type checking
const foodDiaryContent = fs.readFileSync('src/screens/nutrition/FoodDiaryScreen.tsx', 'utf8');
// Revert foodName to name
let fixedFoodDiary = foodDiaryContent.replace(/\.foodName/g, '.name');
// Keep quantity as is
// Fix serving unit references that weren't properly changed
fs.writeFileSync('src/screens/nutrition/FoodDiaryScreen.tsx', fixedFoodDiary);
console.log('✓ Fixed: FoodDiaryScreen.tsx');

// Fix BarcodeScannerScreen - route params
replaceInFile('src/screens/nutrition/BarcodeScannerScreen.tsx', [
  [`route.params.onScan`, `(route.params as { onScan: (data: string) => void }).onScan`]
]);

// Fix CompleteFoodLogScreen - entry.name property
replaceInFile('src/screens/nutrition/CompleteFoodLogScreen.tsx', [
  [`foodName: entry.name,`, `foodName: entry.foodName || entry.name,`]
]);

// Fix OnboardingAppPurposeScreen - type assertion for appPurpose
replaceInFile('src/screens/onboarding/OnboardingAppPurposeScreen.tsx', [
  [`const savedPurpose = await AsyncStorage.getItem('appPurpose');`, `const savedPurpose = await AsyncStorage.getItem('appPurpose') as 'gym' | 'football' | null;`]
]);

// Fix OnboardingBodyStatsScreen - unit comparisons
replaceInFile('src/screens/onboarding/OnboardingBodyStatsScreen.tsx', [
  [`heightUnit === 'ft'`, `heightUnit === 'in'`],
  [`heightUnit === 'cm'`, `heightUnit === 'cm'`]
]);

// Fix OnboardingFitnessLevelScreen - _value property
replaceInFile('src/screens/onboarding/OnboardingFitnessLevelScreen.tsx', [
  [`._value`, ``]
]);

// Fix FoodDiaryScreenNew - DimensionValue type
const foodDiaryNewContent = fs.readFileSync('src/screens/nutrition/FoodDiaryScreenNew.tsx', 'utf8');
let fixedFoodDiaryNew = foodDiaryNewContent.replace(/left: `\$\{(.+?)\}%`/g, 'left: `${$1}%` as any');
fixedFoodDiaryNew = fixedFoodDiaryNew.replace(/width: `\$\{(.+?)\}%`/g, 'width: `${$1}%` as any');
fs.writeFileSync('src/screens/nutrition/FoodDiaryScreenNew.tsx', fixedFoodDiaryNew);
console.log('✓ Fixed: FoodDiaryScreenNew.tsx');

console.log('\nRemaining error fixes completed!');
