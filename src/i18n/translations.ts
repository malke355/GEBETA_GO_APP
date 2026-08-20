export const LANGUAGES = ['en', 'am', 'or'] as const;
export type Language = (typeof LANGUAGES)[number];

type TranslationSet = {
  welcomeBack: string;
  createAccount: string;
  signInDesc: string;
  signUpDesc: string;
  fullName: string;
  emailAddress: string;
  password: string;
  phoneNumber: string;
  deliveryAddress: string;
  customer: string;
  merchant: string;
  driver: string;
  admin: string;
  signIn: string;
  signUp: string;
  noAccount: string;
  hasAccount: string;
  registerHere: string;
  loginHere: string;
  searchPlaceholder: string;
  addToCart: string;
  logOut: string;
  profile: string;
  about: string;
  favorites: string;
  offersTitle: string;
  uploadProof: string;
  rateOrder: string;
  save: string;
  language: string;
};

export const translations: Record<Language, TranslationSet> = {
  en: {
    welcomeBack: 'Welcome Back',
    createAccount: 'Create GebetaGo Account',
    signInDesc: 'Sign in to order delicious meals in Ethiopia',
    signUpDesc: 'Sign up to register as customer, merchant, or driver',
    fullName: 'Full Name',
    emailAddress: 'Email Address',
    password: 'Password',
    phoneNumber: 'Phone Number',
    deliveryAddress: 'Delivery Address',
    customer: 'Customer',
    merchant: 'Merchant',
    driver: 'Courier',
    admin: 'Admin',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    registerHere: 'Register Here',
    loginHere: 'Login Here',
    searchPlaceholder: 'Search by restaurant name or cuisine...',
    addToCart: 'Add to Cart',
    logOut: 'Log out',
    profile: 'Profile',
    about: 'About',
    favorites: 'Favorites',
    offersTitle: 'Offers around Addis',
    uploadProof: 'Upload payment screenshot',
    rateOrder: 'Rate this order',
    save: 'Save',
    language: 'Language',
  },
  am: {
    welcomeBack: 'እንኳን ደህና መጡ',
    createAccount: 'የገበታጎ አካውንት ይፍጠሩ',
    signInDesc: 'በኢትዮጵያ ውስጥ ጣፋጭ ምግቦችን ለማዘዝ ይግቡ',
    signUpDesc: 'እንደ ደንበኛ፣ ሻጭ ወይም ሹፌር ለመመዝገብ ይመዝገቡ',
    fullName: 'ሙሉ ስም',
    emailAddress: 'የኢሜል አድራሻ',
    password: 'የይለፍ ቃል',
    phoneNumber: 'ስልክ ቁጥር',
    deliveryAddress: 'የማረፊያ አድራሻ',
    customer: 'ደንበኛ',
    merchant: 'ምግብ ቤት',
    driver: 'አስረካቢ (ሹፌር)',
    admin: 'አስተዳዳሪ',
    signIn: 'ግባ',
    signUp: 'ተመዝገብ',
    noAccount: 'አካውንት የለዎትም?',
    hasAccount: 'አካውንት አለዎት?',
    registerHere: 'እዚህ ይመዝገቡ',
    loginHere: 'እዚህ ይግቡ',
    searchPlaceholder: 'በምግብ ቤት ስም ወይም አይነት ይፈልጉ...',
    addToCart: 'ቅርጫት ውስጥ ጨምር',
    logOut: 'ውጣ',
    profile: 'መገለጫ',
    about: 'ስለ እኛ',
    favorites: 'ተወዳጆች',
    offersTitle: 'ቅናሾች በአዲስ አበባ',
    uploadProof: 'የክፍያ ፎቶ ይጫኑ',
    rateOrder: 'ትዕዛዙን ደረጃ ይስጡ',
    save: 'አስቀምጥ',
    language: 'ቋንቋ',
  },
  or: {
    welcomeBack: 'Baga Garaan Deebitan',
    createAccount: 'Heeqa GebetaGo Uumi',
    signInDesc: 'Itoophiyaa keessatti nyaata mi\'aawaa ajajuuf seenaa',
    signUpDesc: 'Akka maamilaa, daldalaa ykn konkolaachisaatti galmaa\'uuf seenaa',
    fullName: 'Maqaa Guutuu',
    emailAddress: 'Teessoo E-mailii',
    password: 'Jecha Icchitii',
    phoneNumber: 'Lakk Bilbilaa',
    deliveryAddress: 'Teessoo Geessifamaa',
    customer: 'Maamila',
    merchant: 'Mana Nyaataa',
    driver: 'Ergamaa',
    admin: 'Gareen Bulchaa',
    signIn: 'Seeni',
    signUp: 'Galmaa\'i',
    noAccount: 'Heeqa hin qabduu?',
    hasAccount: 'Duraan heeqa qabdaa?',
    registerHere: 'Asitti Galmaa\'i',
    loginHere: 'Asitti Seeni',
    searchPlaceholder: 'Maqaa ykn gosa nyaataan barbaadi...',
    addToCart: 'Qurxummiitti Dabali',
    logOut: 'Ba\'i',
    profile: 'Profaayilii',
    about: 'Waa\'ee',
    favorites: 'Jaallatamoo',
    offersTitle: 'Dhiyeessii Finfinnee',
    uploadProof: 'Suuraa kaffaltii fe\'i',
    rateOrder: 'Ajaja madaali',
    save: 'Olkaa\'i',
    language: 'Afaan',
  },
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  am: 'አማ',
  or: 'OR',
};
