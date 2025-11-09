# 🚀 DEPLOYMENT CHECKLIST - IMPORTANT!

## ⚠️ BEFORE YOU PUBLISH YOUR APP

### 1. 🔐 **REMOVE YOUR TOKEN FROM CODE**
```typescript
// In src/services/freeAIService.ts
// CHANGE THIS:
private huggingFaceToken: string = HUGGING_FACE_TOKEN || 'YOUR_TOKEN_HERE';

// TO THIS:
private huggingFaceToken: string = HUGGING_FACE_TOKEN || '';
```

### 2. 🌐 **SET UP ENVIRONMENT VARIABLES**

#### For Expo EAS Build:
```bash
eas secret:create HUGGING_FACE_TOKEN
# Enter your token when prompted
```

#### For Vercel/Netlify (if using web):
- Go to Settings → Environment Variables
- Add: `HUGGING_FACE_TOKEN = YOUR_TOKEN_HERE`

#### For Heroku:
```bash
heroku config:set HUGGING_FACE_TOKEN=YOUR_TOKEN_HERE
```

### 3. 🛡️ **CREATE BACKEND API (MOST SECURE)**

Create `api/chat.js`:
```javascript
// Deploy this to Vercel (FREE)
export default async function handler(req, res) {
  const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;

  const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1', {
    headers: { Authorization: `Bearer ${HF_TOKEN}` },
    method: 'POST',
    body: JSON.stringify({ inputs: req.body.message })
  });

  const result = await response.json();
  res.json(result);
}
```

Then update your app:
```typescript
// Instead of calling Hugging Face directly
const response = await fetch('https://your-api.vercel.app/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message: userMessage })
});
```

### 4. ✅ **FINAL CHECKS**

- [ ] Token removed from source code
- [ ] `.env` file is in `.gitignore`
- [ ] Environment variables set on hosting platform
- [ ] Test the app without `.env` file locally
- [ ] Verify token isn't visible in app bundle

### 5. 📱 **APP STORE SUBMISSION**

#### Apple App Store:
- They might reject if token is hardcoded
- Use environment variables or backend API

#### Google Play Store:
- More lenient but still risky
- Tokens can be extracted from APK

## 💡 **QUICK REMINDER COMMANDS**

```bash
# Check if token is in your code
grep -r "hf_VyXU" --exclude-dir=node_modules .

# Check if .env is ignored
git status .env  # Should say "nothing to commit"

# Remove token from git history if accidentally committed
git filter-branch --tree-filter 'rm -f .env' HEAD
```

## 🚨 **IF YOU FORGET AND DEPLOY WITH TOKEN**

1. **Immediately revoke token:**
   - Go to https://huggingface.co/settings/tokens
   - Delete the exposed token
   - Create a new one

2. **Update your app:**
   - Push emergency update with token removed
   - Use backend API instead

## 📝 **NOTES TO SELF**

- Your token: Stored in `.env` file
- Token starts with: `hf_VyXU...`
- Created on: [TODAY'S DATE]
- Purpose: AI Chat for fitness app

---

⭐ **BOOKMARK THIS FILE!**
Set a reminder before you deploy to check this list!