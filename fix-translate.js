const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf8');

// Fix 1: Update the interface to accept optional params
content = content.replace(
  /t: \(key: string\) => string;/,
  't: (key: string, params?: Record<string, any>) => string;'
);

// Fix 2: Update the translate function signature
content = content.replace(
  /export const translate = \(key: string\): string => \{/,
  'export const translate = (key: string, params?: Record<string, any>): string => {'
);

// Fix 3: Update the t function signature and implementation
const oldTFunction = `  const t = (key: string): string => {
    return translations[language][key] || key;
  };`;

const newTFunction = `  const t = (key: string, params?: Record<string, any>): string => {
    let translation = translations[language][key] || key;

    // Replace placeholders like {name}, {number}, etc. with actual values
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(new RegExp('\\\\{' + paramKey + '\\\\}', 'g'), String(params[paramKey]));
      });
    }

    return translation;
  };`;

content = content.replace(oldTFunction, newTFunction);

// Fix 4: Update the translate function implementation similarly
const oldTranslateImpl = `export const translate = (key: string, params?: Record<string, any>): string => {
  return translations[cachedLanguage][key] || key;
};`;

const newTranslateImpl = `export const translate = (key: string, params?: Record<string, any>): string => {
  let translation = translations[cachedLanguage][key] || key;

  // Replace placeholders like {name}, {number}, etc. with actual values
  if (params) {
    Object.keys(params).forEach(paramKey => {
      translation = translation.replace(new RegExp('\\\\{' + paramKey + '\\\\}', 'g'), String(params[paramKey]));
    });
  }

  return translation;
};`;

content = content.replace(
  /export const translate = \(key: string, params\?: Record<string, any>\): string => \{\s+return translations\[cachedLanguage\]\[key\] \|\| key;\s+\};/,
  newTranslateImpl
);

// Write the file back
fs.writeFileSync('src/contexts/LanguageContext.tsx', content);

console.log('Fixed LanguageContext.tsx translate function signatures');
