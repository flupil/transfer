# App Store Assets Guide

Complete guide for creating screenshots, preview videos, and promotional materials for App Store and Google Play submissions.

---

## Status Overview

| Asset Type | Apple App Store | Google Play | Priority |
|-----------|----------------|-------------|----------|
| App Icon |  Configured |  Configured | CRITICAL |
| Screenshots (iPhone) | L Missing | N/A | CRITICAL |
| Screenshots (Android) | N/A | L Missing | CRITICAL |
| Feature Graphic | N/A | L Missing | CRITICAL |
| Preview Video | ª Optional | ª Optional | MEDIUM |
| Promo Text | ª Not Started | ª Not Started | MEDIUM |

---

## Part 1: Screenshots

### Apple App Store Requirements

**REQUIRED:** At least **3 screenshots** per device size (up to 10 maximum)

#### Device Sizes Needed:

**6.7" Display (iPhone 15 Pro Max, 14 Pro Max, 13 Pro Max, 12 Pro Max)**
- **Size:** 1290 x 2796 pixels (portrait) or 2796 x 1290 (landscape)
- **Required:** YES - this is the most important size
- **Format:** PNG or JPEG (no alpha channel)

**6.5" Display (iPhone 11 Pro Max, XS Max)**
- **Size:** 1242 x 2688 pixels (portrait) or 2688 x 1242 (landscape)
- **Required:** Optional (but recommended)

**5.5" Display (iPhone 8 Plus, 7 Plus, 6s Plus)**
- **Size:** 1242 x 2208 pixels
- **Required:** Optional

#### How to Capture iPhone Screenshots:

**Option 1: Real Device**
1. Install app on your iPhone 15 Pro Max (or similar)
2. Navigate to the screen you want to capture
3. Press **Volume Up + Side Button** simultaneously
4. Find screenshots in Photos app
5. AirDrop to your Mac

**Option 2: iOS Simulator**
```bash
# Start simulator
cd "C:\Users\jgola\Downloads\fit app\fit app\fit-app"
npx expo run:ios

# Take screenshot in simulator
# Menu: Device ’ Screenshot (or Cmd+S on Mac)
# Screenshots saved to Desktop
```

**Option 3: Expo Snack (if using Expo Go)**
1. Run app on physical device via Expo Go
2. Take screenshots normally
3. Transfer to computer

---

### Google Play Requirements

**REQUIRED:** At least **2 screenshots** per device type (up to 8 maximum)

#### Device Types Needed:

**Phone Screenshots**
- **Size:** Minimum 320px, Maximum 3840px
- **Recommended:** 1080 x 1920 pixels (9:16 aspect ratio)
- **Required:** YES - minimum 2 screenshots
- **Format:** PNG or JPEG (24-bit RGB, no alpha)

**7-inch Tablet (Optional)**
- **Size:** 1200 x 1920 pixels recommended

**10-inch Tablet (Optional)**
- **Size:** 1600 x 2560 pixels recommended

#### How to Capture Android Screenshots:

**Option 1: Real Device**
1. Install app on Android phone
2. Navigate to desired screen
3. Press **Power + Volume Down** simultaneously
4. Find in Gallery app ’ Screenshots folder
5. Transfer via USB or cloud storage

**Option 2: Android Emulator**
```bash
# Start Android emulator
cd "C:\Users\jgola\Downloads\fit app\fit app\fit-app"
npx expo run:android

# Take screenshot
# Click camera icon in emulator controls sidebar
# Or use Power button in emulator
```

---

### Screenshot Content Strategy

You need to capture these **key screens** to showcase your app:

#### Essential Screenshots (Priority Order):

1. **Dashboard/Home Screen** (REQUIRED)
   - Show streak counter, XP, navigation
   - Highlight gamification features
   - Clean, populated data (not empty state)

2. **Workout Screen** (REQUIRED)
   - Show exercise list for a specific day
   - Display sets, reps, weight tracking
   - Show "Start Workout" or progress indicator

3. **Nutrition Tracking** (REQUIRED)
   - Show calorie circle with current intake
   - Display meal log with food items
   - Highlight macro tracking (protein, carbs, fats)

4. **Progress/Stats Screen** (RECOMMENDED)
   - Charts showing workout history
   - XP level and achievements
   - Streak calendar or progress graphs

5. **Workout In Progress** (RECOMMENDED)
   - Timer or active workout interface
   - Set completion interface
   - Rest timer if applicable

6. **Profile/Settings** (OPTIONAL)
   - User profile with stats
   - Theme selection (show dark mode)
   - Language options

#### Screenshot Best Practices:

**DO:**
- Use realistic, populated data (not empty states)
- Show varied content across screenshots
- Use consistent device mockups
- Highlight unique features (gamification, streaks, XP)
- Show the app in action (completed workouts, meals logged)
- Use high-quality images (no blur or compression artifacts)
- Consider adding descriptive text overlays (see "Enhanced Screenshots" below)

**DON'T:**
- Show error messages or bugs
- Include personal/sensitive information
- Use placeholder text ("Lorem ipsum")
- Show empty states ("No workouts yet")
- Include status bar time showing 9:41 (unless intentional)
- Use low-resolution or pixelated images

---

## Part 2: Feature Graphic (Google Play ONLY)

**CRITICAL - REQUIRED FOR GOOGLE PLAY**

### Specifications:
- **Size:** 1024 x 500 pixels (exactly)
- **Format:** PNG or JPEG (24-bit RGB, no alpha)
- **Purpose:** Displayed at top of your Play Store listing

### Content Ideas:

**Option 1: App Mockup + Branding**
- Show 2-3 phone mockups displaying key screens
- Add "Fit&Power" logo prominently
- Include tagline: "Track. Progress. Achieve."
- Use brand colors: #FF6B35 (orange), #1CB0F6 (blue), #FFB800 (gold)

**Option 2: Feature Highlights**
- Split graphic into sections highlighting:
  - "Personalized Workouts"
  - "Nutrition Tracking"
  - "Gamified Progress"
- Include relevant icons or graphics

**Option 3: App Screenshot Panorama**
- Show 3-4 key screens side-by-side
- Gradient background using brand colors
- App name overlaid on top

### Design Tools:

**Free:**
- **Canva** - Templates for feature graphics
- **Figma** - Professional design (free tier)
- **GIMP** - Photoshop alternative

**Paid:**
- **Adobe Photoshop**
- **Sketch** (Mac only)

**Templates:**
- Search "Google Play Feature Graphic Template" on Canva
- Download free templates from Figma Community

---

## Part 3: Preview Videos (OPTIONAL)

### Apple App Store

**Specifications:**
- **Duration:** 15-30 seconds recommended (up to 30 seconds)
- **Size:** Same as screenshot sizes (1290 x 2796 for 6.7" display)
- **Format:** .mov, .mp4, or .m4v
- **Frame Rate:** 25-30 FPS
- **Encoding:** H.264 or HEVC (H.265)
- **File Size:** Max 500 MB

### Google Play

**Specifications:**
- **Duration:** 30 seconds to 2 minutes
- **Size:** 1920 x 1080 (16:9) or 1080 x 1920 (9:16)
- **Format:** MPEG-4 or WebM
- **Max File Size:** 100 MB
- **Frame Rate:** 30 FPS recommended

### Video Content Strategy:

**Recommended Flow (30 seconds):**

```
0:00-0:05 - App logo + tagline: "Fit&Power - Your Fitness Companion"
0:05-0:10 - Quick tour: Dashboard with streak and XP
0:10-0:15 - Feature 1: Workout tracking (show exercise list)
0:15-0:20 - Feature 2: Nutrition tracking (show calorie circle)
0:20-0:25 - Feature 3: Progress stats (show graphs/achievements)
0:25-0:30 - Call to action: "Download Now" + app icon
```

**Tips:**
- Keep it fast-paced (users have short attention spans)
- Show actual app usage, not just static screens
- Add subtle transitions (no flashy effects)
- Use on-screen text to highlight features
- Include upbeat background music (royalty-free)
- No voiceover needed (users often watch muted)

### Recording Tools:

**iOS:**
- **Built-in Screen Recording:** Settings ’ Control Center ’ Screen Recording
- **QuickTime Player (Mac):** File ’ New Screen Recording

**Android:**
- **Built-in Screen Recording:** Pull down notification shade ’ Screen Record
- **ADB Screenrecord:**
  ```bash
  adb shell screenrecord /sdcard/demo.mp4
  # Record for up to 3 minutes
  # Pull file: adb pull /sdcard/demo.mp4
  ```

**Editing Tools:**
- **Free:** DaVinci Resolve, iMovie (Mac), Kdenlive
- **Paid:** Adobe Premiere Pro, Final Cut Pro
- **Simple:** Canva Video Editor, Kapwing (online)

---

## Part 4: Enhanced Screenshots with Mockups

### Tools for Adding Device Frames:

**Free:**
- **Mockuphone.com** - Upload screenshot, add device frame
- **Screely.com** - Clean mockups with backgrounds
- **Smartmockups.com** - Free tier available

**Paid:**
- **Previewed.app** - Professional app mockups ($12/month)
- **Placeit.net** - Mockup generator (subscription)

### Adding Text Overlays:

You can enhance screenshots with descriptive text:

**Example Captions:**
- Screenshot 1: "Track Your Workouts" or "Never Miss a Day"
- Screenshot 2: "Personalized Exercise Plans"
- Screenshot 3: "Monitor Your Nutrition"
- Screenshot 4: "Watch Your Progress Grow"

**Design Guidelines:**
- Use large, readable fonts (minimum 60pt)
- Keep text concise (3-6 words max)
- Use high contrast (white text on dark background, or vice versa)
- Position text at top or bottom (don't cover UI)

---

## Part 5: App Store Descriptions

### App Name & Subtitle

**Apple:**
- **Name:** Fit&Power (max 30 characters)
- **Subtitle:** "Track Workouts & Nutrition" (max 30 characters)

**Google Play:**
- **Title:** Fit&Power - Workout & Nutrition Tracker (max 50 characters)
- **Short Description:** "Personalized fitness plans, nutrition tracking, and gamified progress." (max 80 characters)

### App Description

**Template (Apple & Google):**

```markdown
<Ë PERSONALIZED WORKOUT TRACKING
- Custom workout plans tailored to your goals
- Track sets, reps, and weights effortlessly
- Progress tracking with visual graphs

<N SMART NUTRITION TRACKING
- Log meals and track macros (protein, carbs, fats)
- Calorie counter with visual progress circle
- Meal planning and recipe suggestions

<Æ GAMIFIED PROGRESS SYSTEM
- Earn XP for completing workouts
- Maintain your workout streak
- Unlock achievements and level up

=Ê COMPREHENSIVE ANALYTICS
- Visualize your fitness journey
- Track body measurements over time
- See your strength gains and consistency

( FEATURES:
" Personalized workout routines
" Exercise library with instructions
" Nutrition and calorie tracking
" Dark mode support
" Multi-language support (English, Hebrew)
" Cloud sync across devices
" Offline mode

<¯ PERFECT FOR:
- Beginners starting their fitness journey
- Intermediate lifters tracking progress
- Anyone looking to build healthy habits

=ñ SYNC EVERYWHERE
Your data syncs seamlessly across all your devices.

---

Download Fit&Power today and start your transformation!

Privacy Policy: [INSERT URL]
Terms of Service: [INSERT URL]
Support: [INSERT EMAIL]
```

---

## Part 6: Keywords & Categories

### Apple App Store

**Primary Category:** Health & Fitness
**Secondary Category:** Lifestyle

**Keywords (max 100 characters):**
```
workout,fitness,gym,nutrition,calorie,tracker,exercise,diet,health,muscle
```

**Search Ads Keywords:**
- workout tracker
- fitness app
- gym tracker
- nutrition tracker
- calorie counter
- workout log
- fitness planner

### Google Play

**Category:** Health & Fitness
**Tags:** workout, fitness, gym, nutrition, calorie tracker, exercise, diet

---

## Part 7: Quick Checklist

### Before Submission:

#### Screenshots
- [ ] Captured at least 3 iPhone screenshots (6.7" display)
- [ ] Captured at least 2 Android screenshots (1080x1920)
- [ ] Screenshots show populated, realistic data
- [ ] No visible bugs or errors in screenshots
- [ ] Screenshots highlight key features (workouts, nutrition, progress)
- [ ] Images are high quality (PNG or JPEG, no compression artifacts)

#### Feature Graphic (Google Play ONLY)
- [ ] Created 1024x500px feature graphic
- [ ] Includes app branding (logo, colors)
- [ ] Showcases key features visually
- [ ] High quality (no pixelation)

#### Preview Video (OPTIONAL)
- [ ] Recorded 15-30 second app demo
- [ ] Video shows key features in action
- [ ] Proper resolution for target platform
- [ ] Added captions or on-screen text
- [ ] Exported in correct format (.mp4 or .mov)

#### Text Assets
- [ ] App name/title finalized
- [ ] Subtitle/short description written
- [ ] Full description written (highlights features)
- [ ] Keywords selected for App Store
- [ ] Categories selected
- [ ] Privacy Policy URL ready
- [ ] Terms of Service URL ready
- [ ] Support email ready

---

## Part 8: Where to Upload

### Apple App Store (App Store Connect)

1. Go to: https://appstoreconnect.apple.com/
2. Select your app
3. Go to "App Store" tab
4. Click on "1.0 Prepare for Submission"
5. Scroll to "App Information"
   - Add screenshots (drag and drop)
   - Add preview video (optional)
   - Enter app description
6. Fill out metadata:
   - Keywords
   - Categories
   - Privacy Policy URL
   - Support URL

### Google Play Console

1. Go to: https://play.google.com/console
2. Select your app
3. Go to "Main store listing"
4. Upload assets:
   - Screenshots (Phone, Tablet)
   - Feature graphic (1024x500)
   - Preview video (YouTube URL)
5. Enter text:
   - App title
   - Short description
   - Full description
6. Add:
   - Category
   - Tags
   - Privacy Policy URL

---

## Part 9: Testing Before Submission

### Verify Screenshots:
```bash
# Check image dimensions
file assets/screenshots/iphone_*.png

# Expected output:
# iphone_1.png: PNG image data, 1290 x 2796, 8-bit/color RGB
```

### Create Screenshot Folder:
```bash
mkdir -p assets/screenshots/iphone
mkdir -p assets/screenshots/android
mkdir -p assets/feature-graphic
```

---

## Part 10: Resources

### Free Stock Photos & Graphics:
- **Unsplash** - https://unsplash.com/ (fitness images)
- **Pexels** - https://www.pexels.com/
- **Flaticon** - https://www.flaticon.com/ (icons)

### Free Music for Videos:
- **YouTube Audio Library** - https://www.youtube.com/audiolibrary
- **Bensound** - https://www.bensound.com/
- **Free Music Archive** - https://freemusicarchive.org/

### Learning Resources:
- **Apple App Store Guidelines** - https://developer.apple.com/app-store/screenshots/
- **Google Play Asset Guidelines** - https://support.google.com/googleplay/android-developer/answer/9866151

---

## Summary: What You Need RIGHT NOW

**CRITICAL (Required for submission):**
1. **3-5 iPhone screenshots** (1290 x 2796 pixels)
2. **2-4 Android screenshots** (1080 x 1920 pixels)
3. **Feature Graphic for Google Play** (1024 x 500 pixels)
4. **App description text** (200-400 words)
5. **Privacy Policy URL** (can host on GitHub Pages or your website)

**RECOMMENDED (Not required, but helpful):**
- Preview video (30 seconds)
- Enhanced screenshots with device mockups
- Text overlays on screenshots highlighting features

**NICE TO HAVE:**
- Multiple device sizes (iPad, tablets)
- Localized screenshots for different languages
- A/B testing different screenshot orders

---

**Next Steps:**
1. Install app on your iPhone/Android device
2. Populate with realistic workout and nutrition data
3. Take screenshots of all key screens (Dashboard, Workouts, Nutrition, Progress)
4. Create feature graphic using Canva or Figma
5. Write app description highlighting your unique features
6. Upload to App Store Connect and Google Play Console

**Need help?** Contact [INSERT SUPPORT EMAIL]
