# Logger Migration Guide

## Overview
This guide explains how to replace all `console.log` statements with our production-safe logger utility.

## Why We Need This
- **Development**: Logs work normally during development
- **Production**: Logs are automatically silenced (except errors)
- **Future**: Easy to integrate with crash reporting (Sentry, Firebase Crashlytics)

## Status
✅ **Completed Files:**
- `src/utils/logger.ts` - Logger utility created
- `src/screens/DashboardScreen.tsx` - All 13 console statements replaced
- `src/components/CustomHeader.tsx` - All 10 console statements replaced

⚠️ **Remaining:** 936 console statements across 134 files

## How to Update Files

### Step 1: Import the logger
```typescript
import { logger } from '../utils/logger';
// or if in a utils file:
import { logger } from './logger';
```

### Step 2: Replace console statements

| Old Code | New Code | Use Case |
|----------|----------|----------|
| `console.log(...)` | `logger.log(...)` | Regular debug logs |
| `console.info(...)` | `logger.info(...)` | Info logs |
| `console.warn(...)` | `logger.warn(...)` | Warnings |
| `console.error(...)` | `logger.error(...)` | Errors (always logs) |
| `console.log('🔥', ...)` | `logger.debug('🔥', ...)` | Debug logs with emoji |

### Examples

**Before:**
```typescript
console.log('Loading data...');
console.log('🔥 Debug value:', value);
console.error('Failed to load:', error);
```

**After:**
```typescript
logger.log('Loading data...');
logger.debug('🔥', 'Debug value:', value);
logger.error('Failed to load:', error);
```

## Files with Most Console Statements (Priority Order)

1. `TryScreen.tsx` - 62 statements
2. `DashboardScreen.tsx` - ✅ **DONE** (was 30 statements)
3. `NutritionContext.tsx` - 30 statements
4. `TestingScreen.tsx` - 19 statements
5. `CustomHeader.tsx` - ✅ **DONE** (was 10 statements)

## Quick Find & Replace

You can use VS Code's find & replace (Ctrl+H) with regex:

1. **Find:** `console\.log\(`
   **Replace:** `logger.log(`

2. **Find:** `console\.error\(`
   **Replace:** `logger.error(`

3. **Find:** `console\.warn\(`
   **Replace:** `logger.warn(`

4. **Find:** `console\.info\(`
   **Replace:** `logger.info(`

**⚠️ Important:** Don't forget to add the import statement at the top of each file!

## Testing

After migration:
1. Test in **development mode** - logs should appear normally
2. Build **production version** - debug logs should not appear (only errors)

```bash
# Development build (logs visible)
npx expo start

# Production build (only errors visible)
npx expo start --no-dev --minify
```

## Future Integration

The logger is ready for crash reporting integration:

```typescript
// In logger.ts, update the error method:
error(...args: any[]) {
  console.error(...args);

  // Add your crash reporting service:
  // Sentry.captureException(args[0]);
  // or
  // Crashlytics().recordError(args[0]);
}
```

## Checklist for Each File

- [ ] Import logger utility
- [ ] Replace all console.log with logger.log
- [ ] Replace all console.error with logger.error
- [ ] Replace all console.warn with logger.warn
- [ ] Replace emoji debug logs with logger.debug
- [ ] Test the file works correctly
- [ ] Remove any unused console imports

## Notes

- **Keep console.error for now**: It's better to log errors in production for debugging
- **Emoji logs**: Use `logger.debug('🔥', 'message')` for emoji-prefixed logs
- **Remove later**: You can always remove debug logs entirely after testing
