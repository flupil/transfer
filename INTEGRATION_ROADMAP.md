# OpenNutriTracker Integration Roadmap

## ✅ Completed (Phase 1: Foundation)

### 1. Nutrition Data Types ✅
**File**: `src/types/nutrition.types.ts`
- Created standardized nutrition data structure (per 100g)
- Defined `FoodItem`, `FoodIntake`, `CustomMeal`, `DailyDiary`
- Added `MealType` enum (breakfast, lunch, dinner, snack)
- Helper function: `calculateNutrition()`

### 2. Open Food Facts API Service ✅
**File**: `src/services/openFoodFactsService.ts`
- `searchFoods()` - Search 1M+ foods
- `getProductByBarcode()` - Barcode lookup
- `getPopularFoods()` - Trending items
- `getFoodSuggestions()` - Autocomplete

### 3. Daily Meal Plan Selection ✅
**File**: `src/services/planSelectionService.ts`
- `selectDailyMealPlan()` - Selects breakfast/lunch/dinner/snack
- Calorie distribution: 25%/35%/30%/10%
- Scoring algorithm for meal matching

---

## 📋 Phase 2: Local Storage & Data Management

### 4. Local Database Setup
**Priority**: HIGH
**Estimated Time**: 2-3 hours

**Libraries to install**:
```bash
npm install @react-native-async-storage/async-storage
npm install react-native-mmkv  # Faster than AsyncStorage
npm install @shopify/react-native-skia  # For encryption
```

**Files to create**:
- `src/services/localStorageService.ts`
  - `saveFoodIntake(intake: FoodIntake)`
  - `getDailyDiary(date: string): DailyDiary`
  - `saveCustomMeal(meal: CustomMeal)`
  - `getRecentFoods(userId: string): RecentFoods`
  - `cacheFoodItem(food: FoodItem)` - Cache searched foods

- `src/services/encryptionService.ts`
  - `encrypt(data: any): string`
  - `decrypt(encrypted: string): any`

**Database Schema**:
```
/users/{userId}/
  /diary/{date}/
    breakfast: FoodIntake[]
    lunch: FoodIntake[]
    dinner: FoodIntake[]
    snacks: FoodIntake[]
  /customMeals/{mealId}
  /recentFoods/
  /favorites/
  /foodCache/{foodId}
```

---

## 📋 Phase 3: Food Logging Features

### 5. Food Search Screen
**Priority**: HIGH
**Estimated Time**: 3-4 hours

**File**: `src/screens/nutrition/FoodSearchScreen.tsx`

**Features**:
- Search bar with autocomplete
- Results list with infinite scroll
- Filter by dietary tags
- Show nutrition preview
- Add to meal (breakfast/lunch/dinner/snack)

**UI Components**:
```tsx
<SearchBar
  onSearch={searchFoods}
  onSuggestionSelect={selectSuggestion}
/>
<FilterTags tags={['vegetarian', 'vegan', 'gluten-free']} />
<FoodResultList
  foods={searchResults}
  onAddFood={addToMeal}
/>
```

### 6. Food Detail Modal
**Priority**: MEDIUM
**Estimated Time**: 2 hours

**File**: `src/components/FoodDetailModal.tsx`

**Features**:
- Full nutrition facts
- Serving size selector
- Amount input
- Meal type selector (breakfast/lunch/dinner/snack)
- Add to diary button

---

## 📋 Phase 4: Barcode Scanning

### 7. Barcode Scanner
**Priority**: MEDIUM
**Estimated Time**: 2-3 hours

**Libraries**:
```bash
npm install react-native-vision-camera
npm install vision-camera-code-scanner
```

**File**: `src/screens/nutrition/BarcodeScannerScreen.tsx`

**Features**:
- Camera view with barcode detection
- Automatic product lookup
- Show nutrition info
- Quick add to diary

**Permissions needed**:
- iOS: `NSCameraUsageDescription`
- Android: `CAMERA` permission

---

## 📋 Phase 5: Custom Meal Creation

### 8. Create Custom Meal Screen
**Priority**: HIGH
**Estimated Time**: 4-5 hours

**File**: `src/screens/nutrition/CreateCustomMealScreen.tsx`

**Features**:
- Meal name & description
- Add ingredients (search foods)
- Set quantities for each ingredient
- Auto-calculate total nutrition
- Set number of servings
- Add prep/cook time
- Take/upload photo
- Save to favorites

**Flow**:
1. Enter meal name
2. Search & add ingredients
3. Set amounts
4. Review total nutrition
5. Set servings
6. Save

---

## 📋 Phase 6: Food Diary / Calendar

### 9. Daily Diary Screen
**Priority**: HIGH
**Estimated Time**: 4-5 hours

**File**: `src/screens/nutrition/FoodDiaryScreen.tsx`

**Features**:
- Date selector (calendar)
- Sections for breakfast/lunch/dinner/snacks
- Add food button for each section
- Show nutrition totals vs targets
- Progress bars for calories/protein/carbs/fat
- Quick actions: edit, delete, copy meal

**UI Layout**:
```
[<< Today >>]  (date picker)

🌅 Breakfast (450/500 cal)
  - Oatmeal (300 cal) [Edit] [Delete]
  - Banana (105 cal)
  [+ Add Food]

🌞 Lunch (600/700 cal)
  [+ Add Food]

🌙 Dinner (500/600 cal)
  [+ Add Food]

🍎 Snacks (150/200 cal)
  [+ Add Food]

━━━━━━━━━━━━━━━━━━━━
Total: 1700/2000 cal
Protein: 95/150g ████░
Carbs: 180/220g ████░
Fat: 50/65g ████░
```

### 10. Calendar View Screen
**Priority**: MEDIUM
**Estimated Time**: 3 hours

**File**: `src/screens/nutrition/CalendarViewScreen.tsx`

**Libraries**:
```bash
npm install react-native-calendars
```

**Features**:
- Month/week view
- Color-code days (hit target = green, under = yellow, over = red)
- Tap date to see that day's diary
- Show streak count
- Filter by date range

---

## 📋 Phase 7: Recent Foods & Favorites

### 11. Recent Foods Feature
**Priority**: MEDIUM
**Estimated Time**: 2 hours

**File**: `src/components/RecentFoodsList.tsx`

**Features**:
- Show last 20 foods logged
- Sort by most recent
- Sort by most frequent
- Quick add button
- Star to add to favorites

### 12. Copy Meal Feature
**Priority**: MEDIUM
**Estimated Time**: 1-2 hours

**Implementation**:
- Add "Copy" button to each logged meal
- Show date picker modal
- Copy to selected date's meal slot
- Option to copy entire day

**Functions to add**:
```typescript
copyMeal(intake: FoodIntake, toDate: string, toMealType: MealType)
copyDay(fromDate: string, toDate: string)
```

---

## 📋 Phase 8: Real-Time Updates

### 13. Nutrition Context
**Priority**: HIGH
**Estimated Time**: 2-3 hours

**File**: `src/contexts/NutritionContext.tsx`

```typescript
interface NutritionContextType {
  currentDiary: DailyDiary;
  addFoodIntake: (intake: FoodIntake) => void;
  removeFoodIntake: (intakeId: string) => void;
  updateFoodIntake: (intake: FoodIntake) => void;
  copyMeal: (intakeId: string, toDate: string) => void;
  getTodayTotals: () => NutritionInfo;
  getRemainingCalories: () => number;
  recentFoods: FoodItem[];
  favorites: FoodItem[];
}
```

**Features**:
- Real-time nutrition totals
- Auto-save to local storage
- Sync with Firebase (optional)
- Update UI immediately when food added/removed

---

## 📋 Phase 9: Serving Sizes

### 14. Serving Size Selector
**Priority**: MEDIUM
**Estimated Time**: 2 hours

**File**: `src/components/ServingSizeSelector.tsx`

**Features**:
- Dropdown of serving sizes (from FoodItem.servingSizes)
- Custom amount input
- Unit selector (g, ml, oz, cup, tbsp, piece)
- Show nutrition update in real-time
- Common sizes: 100g, 1 cup, 1 tbsp, 1 piece, etc.

**UI**:
```
Serving Size:
[Dropdown: 100g ▼]
  - 100g
  - 1 serving (30g)
  - 1 cup (240ml)
  - Custom

Amount: [150] g

Nutrition:
Calories: 225 kcal
Protein: 15g
Carbs: 30g
Fat: 5g
```

---

## 📋 Phase 10: Edit/Delete Meals

### 15. Edit Food Intake
**Priority**: MEDIUM
**Estimated Time**: 2 hours

**Features**:
- Edit amount/serving size
- Change meal type (move breakfast → lunch)
- Update time logged
- Auto-recalculate nutrition

**UI**:
- Swipe left on food item → [Edit] [Delete]
- Tap to open edit modal
- Save updates to local storage

---

## 📋 Phase 11: Enhanced Nutrition Tracking

### 16. Expand to 7+ Nutrients
**Priority**: LOW
**Estimated Time**: 1 hour

**Already in types**:
- ✅ Calories
- ✅ Protein
- ✅ Carbs
- ✅ Fat
- ✅ Fiber
- ✅ Sugar
- ✅ Saturated Fat
- ✅ Sodium

**Add to UI**:
- Nutrition details screen
- Micronutrients view (optional)
- Charts for each macro

---

## 📋 Phase 12: Multi-Language Support

### 17. Multi-Language Foods
**Priority**: LOW
**Estimated Time**: 1-2 hours

**Implementation**:
- Open Food Facts API already supports multiple languages
- Add language parameter to API calls
- Detect user's locale
- Search in user's language

```typescript
const lang = Localization.locale.split('-')[0]; // 'en', 'es', 'fr', etc.

searchFoods(query, page, pageSize, lang)
```

**Languages supported by OFF**:
- English, Spanish, French, German, Italian, Portuguese, and 100+ more

---

## 📊 Implementation Priority

### Phase 1: Must Have (Week 1-2)
1. ✅ Nutrition types
2. ✅ Open Food Facts API
3. ✅ Daily meal plan selection
4. Local storage setup
5. Food search screen
6. Daily diary screen
7. Nutrition context

### Phase 2: Important (Week 3-4)
8. Food detail modal
9. Custom meal creation
10. Calendar view
11. Recent foods
12. Copy meal feature

### Phase 3: Nice to Have (Week 5-6)
13. Barcode scanner
14. Serving size selector
15. Edit/delete meals
16. Enhanced nutrition tracking

### Phase 4: Optional (Future)
17. Multi-language support

---

## 📦 Required npm Packages

```bash
# Already have
npm install @react-native-async-storage/async-storage

# Need to install
npm install react-native-mmkv                    # Fast local storage
npm install react-native-vision-camera          # Barcode scanning
npm install vision-camera-code-scanner          # Barcode plugin
npm install react-native-calendars              # Calendar view
npm install react-native-chart-kit              # Nutrition charts (optional)
npm install date-fns                            # Date utilities
```

---

## 🔄 Migration Plan

### Update Existing Screens

#### NutritionScreen.tsx
**Current**: Basic calorie tracker
**Update to**:
- Tabbed interface: Diary | Search | Custom Meals
- Show today's meals with add buttons
- Quick stats at top

#### HomeScreen.tsx
**Update**:
- Show today's nutrition progress
- Recent meals
- Quick log button

---

## 🎯 Success Metrics

After integration, users should be able to:
- ✅ Search 1M+ foods from Open Food Facts
- ✅ Scan barcodes for instant lookup
- ✅ Create custom meals with multiple ingredients
- ✅ Log foods to breakfast/lunch/dinner/snacks
- ✅ View calendar of past meals
- ✅ Copy previous meals quickly
- ✅ Track 7+ nutrients in real-time
- ✅ Edit/delete logged meals
- ✅ See recent foods & favorites
- ✅ Work offline with cached data

---

## 📝 Next Steps

1. **Install required packages** (see above)
2. **Set up local storage** (Phase 2, Task 4)
3. **Build Food Search Screen** (Phase 3, Task 5)
4. **Create Daily Diary** (Phase 6, Task 9)
5. **Implement Nutrition Context** (Phase 8, Task 13)
6. **Test with real data**
7. **Deploy incrementally**

**Estimated total time**: 40-50 hours of development

Would you like me to continue implementing the next phase?
