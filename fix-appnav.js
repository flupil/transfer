const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/navigation/AppNavigator.tsx', 'utf8');

// Fix 1: Replace the HomeStack function
const oldHomestack = `const HomeStack = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { appPurpose } = useUserPreferences();

  return (`;

const newHomestack = `const HomeStack = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [appPurpose, setAppPurpose] = useState<'gym' | 'football'>('gym');

  useEffect(() => {
    const loadAppPurpose = async () => {
      try {
        const savedPurpose = await AsyncStorage.getItem('appPurpose');
        if (savedPurpose === 'gym' || savedPurpose === 'football') {
          setAppPurpose(savedPurpose);
        }
      } catch (error) {
        console.error('Failed to load app purpose:', error);
      }
    };
    loadAppPurpose();
  }, []);

  return (`;

content = content.replace(oldHomestack, newHomestack);

// Fix 2: Replace line 661 - change comparison
content = content.replace(
  /(appInterest === 'workouts' \|\| appInterest === 'football' \|\| appInterest === 'both')/,
  "(appInterest === 'workouts' || appInterest === 'both')"
);

// Write the file back
fs.writeFileSync('src/navigation/AppNavigator.tsx', content);

console.log('Fixed AppNavigator.tsx');
