# Google Play Store Submission Checklist

## ✅ COMPLETED

### 1. App Build
- ✅ Android build in progress via EAS
- ✅ Build URL: https://expo.dev/accounts/flupil/projects/fitandpower/builds/cc277205-f6ef-49aa-91b7-e49da4435ff2
- ⏳ Waiting for .aab file to complete (10-20 minutes)

### 2. Screenshots (8 selected)
- ✅ home page.jpg
- ✅ workouts tab.jpg
- ✅ current workout.jpg
- ✅ nutrition tab.jpg
- ✅ ai assistant.jpg
- ✅ homepage2.jpg
- ✅ workouts tab2.jpg
- ✅ nutrition tab 2.jpg

Location: `screenshots/android/`

### 3. App Listing Content
- ✅ **App Name:** Fit&Power - AI Fitness Coach
- ✅ **Short Description:** Your personal AI-powered fitness & nutrition coach in your pocket
- ✅ **Full Description:** Complete 4000-char description created
- ✅ **Category:** Health & Fitness
- ✅ **Tags:** fitness, workout, nutrition, AI coach, etc.

Location: `store-materials/STORE_LISTING.md`

### 4. Privacy & Legal
- ✅ Privacy Policy HTML created
- ✅ Privacy Policy covers all data collection
- ✅ GDPR & CCPA compliance included
- ✅ Third-party services documented (Firebase, Hugging Face, Expo)

Location: `store-materials/privacy-policy.html`

### 5. App Icon
- ✅ App icon available (512x512)

Location: `store-materials/app-icon-512.png`

### 6. Developer Information
- ✅ **Developer Name:** Fit&Power Team
- ✅ **Email:** support@fitandpower.app
- ✅ **Website:** https://fitandpower.app (needs to be set up)

### 7. Content Rating
- ✅ **Age Rating:** 13+ (Teen)
- ✅ **Content Type:** No violence, sexual content, profanity, drugs, or gambling
- ✅ **Special Notes:** Contains AI-generated content, collects health data

---

## ⏳ PENDING

### 1. Host Privacy Policy
**Action Required:**
- Upload `privacy-policy.html` to: https://fitandpower.app/privacy
- Or use free hosting: GitHub Pages, Netlify, etc.

**Quick Solution:**
```bash
# Option 1: GitHub Pages (free)
- Create GitHub repo "fitandpower-website"
- Upload privacy-policy.html as index.html
- Enable GitHub Pages
- URL will be: https://[username].github.io/fitandpower-website/

# Option 2: Firebase Hosting (free)
firebase init hosting
firebase deploy
```

### 2. Feature Graphic (1024x500)
**Action Required:**
- Create promotional banner image
- Should showcase app branding and key features
- Format: PNG or JPG
- Can use Canva, Figma, or Photoshop

**Temporary Solution:**
- Google Play accepts submission without it initially
- Can add later in Store Listing updates

### 3. Wait for Build
**Action Required:**
- Monitor build at: https://expo.dev/accounts/flupil/projects/fitandpower/builds/cc277205-f6ef-49aa-91b7-e49da4435ff2
- Download .aab file when complete
- Save to: `store-materials/app-release.aab`

---

## 📋 SUBMISSION STEPS

Once build completes and privacy policy is hosted:

### Step 1: Create Google Play Console Account
1. Go to: https://play.google.com/console
2. Sign in with Google account
3. Pay one-time $25 registration fee
4. Complete account setup

### Step 2: Create App
1. Click "Create app"
2. Fill in:
   - App name: **Fit&Power - AI Fitness Coach**
   - Default language: **English (United States)**
   - App or game: **App**
   - Free or paid: **Free**
3. Accept declarations

### Step 3: Dashboard Setup

#### A. App Access
- Select: **All functionality is available without restrictions**

#### B. Ads
- Select: **No, my app does not contain ads**

#### C. Content Rating
1. Click "Start questionnaire"
2. Select category: **Health & Fitness**
3. Answer questions:
   - Violence: No
   - Sexual content: No
   - Profanity: No
   - Drugs/alcohol/tobacco: No
   - Gambling: No
   - User interaction: Yes (AI chat)
   - Shares user location: No
   - Shares personal info: No
4. Submit for rating

#### D. Target Audience
- Age range: **13 years and older**

#### E. News App
- Select: **No**

#### F. COVID-19 Contact Tracing
- Select: **No**

#### G. Data Safety
1. Click "Start"
2. Data collection:
   - Collects: **Yes**
   - Shares: **No**
3. Data types collected:
   - Personal info: Email address
   - Health & Fitness: Fitness info, workout logs
   - App activity: In-app actions
4. Data usage:
   - App functionality
   - Analytics
   - Personalization
5. Data security:
   - Encrypted in transit: **Yes**
   - Users can request deletion: **Yes**
   - Committed to Google Play Families Policy: **No** (not targeting kids)

#### H. Government Apps
- Select: **No**

### Step 4: Store Listing
1. **App details:**
   - App name: Fit&Power - AI Fitness Coach
   - Short description: (paste from STORE_LISTING.md)
   - Full description: (paste from STORE_LISTING.md)

2. **Graphics:**
   - App icon: Upload `app-icon-512.png`
   - Feature graphic: Upload when ready (1024x500)
   - Screenshots: Upload 8 images from `screenshots/android/`

3. **Categorization:**
   - App category: **Health & Fitness**
   - Tags: fitness, workout, nutrition, AI coach

4. **Contact details:**
   - Email: support@fitandpower.app
   - Website: https://fitandpower.app
   - Phone: (optional)

5. **Privacy Policy:**
   - URL: https://fitandpower.app/privacy

### Step 5: Main Store Listing
- Countries: **Select all countries** or specific regions
- Primary language: **English (United States)**

### Step 6: Production
1. **Create new release:**
   - Click "Production" track
   - Click "Create new release"

2. **Upload AAB:**
   - Upload `app-release.aab`
   - Wait for analysis

3. **Release name:**
   - Version: **1.0.0**

4. **Release notes:**
```
Initial release of Fit&Power!

Features:
• AI-powered fitness assistant
• Comprehensive workout tracking
• Nutrition and macro logging
• Progress analytics with streaks
• Dark and light themes
• Football training mode
• Offline support

Thank you for choosing Fit&Power!
```

5. **Review and rollout:**
   - Review all sections
   - Click "Save"
   - Click "Review release"
   - Click "Start rollout to Production"

### Step 7: Wait for Review
- Google typically reviews within **1-3 days**
- You'll receive email notification
- Check status in Play Console

---

## 🚨 CRITICAL REQUIREMENTS

**Before you can submit, you MUST have:**
1. ✅ .aab file (waiting for build)
2. ❌ Privacy Policy URL (need to host privacy-policy.html)
3. ✅ App icon 512x512
4. ✅ At least 2 screenshots (we have 8)
5. ✅ Short & full description
6. ✅ Content rating answers
7. ✅ Category selection

**Only missing:** Privacy Policy URL hosting!

---

## 💡 NEXT STEPS

### Immediate (while build completes):
1. **Host privacy policy:**
   - Easiest: Use GitHub Pages (free, 5 minutes)
   - Alternative: Netlify, Firebase Hosting, own website

2. **Optional: Create feature graphic:**
   - Use Canva template for app store graphics
   - Include app icon, tagline, key features
   - 1024 x 500 pixels

### After build completes:
1. Download .aab file from Expo
2. Complete privacy policy hosting
3. Create Google Play Console account ($25)
4. Follow submission steps above
5. Submit for review!

---

## 📞 SUPPORT

**Build Issues:**
- Check: https://expo.dev/accounts/flupil/projects/fitandpower/builds/
- Docs: https://docs.expo.dev/build/introduction/

**Play Console Help:**
- https://support.google.com/googleplay/android-developer/
- https://developer.android.com/distribute/best-practices/launch/

**Questions:**
- Email: support@fitandpower.app
- Expo Community: https://forums.expo.dev/

---

**Status:** Ready to submit once build completes and privacy policy is hosted!

**Estimated Time to Submission:** 30-60 minutes after build completes
