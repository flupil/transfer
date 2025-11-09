const fs = require('fs');

// Read the LanguageContext file
const content = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf8');

// Extract translation keys from English section
const enSection = content.match(/en:\s*\{[\s\S]*?\n  \},\n  he:/);
if (!enSection) {
  console.log('[ERROR] Could not extract English translations');
  process.exit(1);
}

// Extract translation keys from Hebrew section
const heSection = content.match(/he:\s*\{[\s\S]*$/);
if (!heSection) {
  console.log('[ERROR] Could not extract Hebrew translations');
  process.exit(1);
}

// Count keys
const enKeys = (enSection[0].match(/'[\w.]+'\s*:/g) || []).map(k => k.match(/'([\w.]+)'/)[1]);
const heKeys = (heSection[0].match(/'[\w.]+'\s*:/g) || []).map(k => k.match(/'([\w.]+)'/)[1]);

console.log('Translation Statistics:');
console.log('=======================');
console.log('English keys:', enKeys.length);
console.log('Hebrew keys:', heKeys.length);
console.log('');

// Find missing keys
const missingInHebrew = enKeys.filter(key => !heKeys.includes(key));
const extraInHebrew = heKeys.filter(key => !enKeys.includes(key));

if (enKeys.length === heKeys.length && missingInHebrew.length === 0) {
  console.log('[PASS] All translations are complete!');
  console.log('[PASS] No missing keys found');
} else {
  if (missingInHebrew.length > 0) {
    console.log('[FAIL] Missing in Hebrew (' + missingInHebrew.length + ' keys):');
    console.log('=====================================');
    missingInHebrew.forEach((key, index) => {
      console.log((index + 1) + '. ' + key);
    });
    console.log('');
  }

  if (extraInHebrew.length > 0) {
    console.log('[WARN] Extra keys in Hebrew (not in English):');
    console.log('==========================================');
    extraInHebrew.forEach((key, index) => {
      console.log((index + 1) + '. ' + key);
    });
    console.log('');
  }
}

// Check for placeholder or untranslated strings (English text in Hebrew section)
console.log('Checking for untranslated strings in Hebrew...');
const heSectionText = heSection[0];
const suspiciousPatterns = [
  /:\s*'[A-Z][a-z]+/g,  // English words starting with capital letter
  /:\s*'(Save|Cancel|Delete|Edit|Add|Close|Search|Settings)/g  // Common English words
];

let foundSuspicious = false;
suspiciousPatterns.forEach(pattern => {
  const matches = heSectionText.match(pattern);
  if (matches && matches.length > 0) {
    if (!foundSuspicious) {
      console.log('[WARN] Possible untranslated strings found:');
      foundSuspicious = true;
    }
    matches.forEach(match => console.log('  ' + match));
  }
});

if (!foundSuspicious) {
  console.log('[PASS] No obvious untranslated strings detected');
}

console.log('');
console.log('Summary:');
console.log('========');
console.log('Total English keys:', enKeys.length);
console.log('Total Hebrew keys:', heKeys.length);
console.log('Missing translations:', missingInHebrew.length);
console.log('Extra translations:', extraInHebrew.length);

if (missingInHebrew.length === 0 && extraInHebrew.length === 0) {
  console.log('');
  console.log('[SUCCESS] Translation verification PASSED!');
  process.exit(0);
} else {
  console.log('');
  console.log('[FAILURE] Translation verification FAILED');
  process.exit(1);
}
