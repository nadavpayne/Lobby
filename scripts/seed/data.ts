// Demo content for the Petah Tikva seed: buildings, businesses, offers and resident names (all fictional).

export const CITY = "פתח תקווה";

export interface SeedBuilding {
  name: string;
  address: string;
  lat: number;
  lng: number;
  apartments: number;
  committee: string;
  committeePhone: string;
  pipeline: "lead" | "contacted" | "joined";
}

export const BUILDINGS: SeedBuilding[] = [
  { name: "בית רוטשילד", address: "רוטשילד 45", lat: 32.0889, lng: 34.879, apartments: 24, committee: "אורית לוי", committeePhone: "0521234501", pipeline: "joined" },
  { name: "מגדלי ז'בוטינסקי", address: "ז'בוטינסקי 120", lat: 32.093, lng: 34.866, apartments: 40, committee: "רונן מזרחי", committeePhone: "0521234502", pipeline: "joined" },
  { name: "בית הרצל", address: "הרצל 30", lat: 32.088, lng: 34.8865, apartments: 16, committee: "שירה כהן", committeePhone: "0521234503", pipeline: "joined" },
  { name: "בית ויצמן", address: "ויצמן 12", lat: 32.0845, lng: 34.883, apartments: 20, committee: "דוד אברהם", committeePhone: "0521234504", pipeline: "joined" },
  { name: "בית סוקולוב", address: "סוקולוב 8", lat: 32.09, lng: 34.884, apartments: 18, committee: "מיכל פרץ", committeePhone: "0521234505", pipeline: "joined" },
];

/** Committees still in the sales pipeline (no residents yet). */
export const LEAD_BUILDINGS: SeedBuilding[] = [
  { name: "בית ברנר", address: "ברנר 7", lat: 32.0868, lng: 34.8812, apartments: 30, committee: "יעל שטרן", committeePhone: "0521234506", pipeline: "lead" },
  { name: "בית חיים עוזר", address: "חיים עוזר 15", lat: 32.0905, lng: 34.8875, apartments: 22, committee: "אבי גולן", committeePhone: "0521234507", pipeline: "contacted" },
];

export interface SeedBusiness {
  name: string;
  category: string;
  /** 1–2 IDs from data/business-categories.json under the category. */
  subcategories: string[];
  address: string;
  lat: number;
  lng: number;
  description: string;
  offer: { title: string; description: string; terms: string; discount?: number; endsAt?: string; startsInDays?: number };
  /** Contract override of the default 5%. */
  commission?: number;
  /** Typical bill range in shekels. */
  bill: [number, number];
  /** Relative popularity for generated redemptions. */
  weight: number;
  /** How many days ago the business joined (drives "new in Lobby"). */
  joinedDaysAgo: number;
  branches?: { name: string; address: string }[];
}

export const BUSINESSES: SeedBusiness[] = [
  { name: "פיצה מרגריטה", category: "restaurants", subcategories: ["pizzeria"], address: "רוטשילד 60", lat: 32.0893, lng: 34.8801, description: "פיצה נאפוליטנית בתנור אבן, משלוחים לכל השכונה.", offer: { title: "10% הנחה על כל התפריט", description: "על כל הפיצות, המנות והשתייה", terms: "בישיבה או באיסוף עצמי. לא כולל משלוחים." }, bill: [70, 260], weight: 9, joinedDaysAgo: 120, branches: [{ name: "סניף רוטשילד", address: "רוטשילד 60" }, { name: "סניף כפר גנים", address: "אחד העם 18" }] },
  { name: "שווארמה הכיכר", category: "restaurants", subcategories: ["takeaway"], address: "חובבי ציון 4", lat: 32.0878, lng: 34.8862, description: "שווארמה הודו על הגחלים, פתוח עד מאוחר.", offer: { title: "10% הנחה על כל מנה", description: "בפיתה, בלאפה או בצלחת", terms: "למימוש בסניף בלבד." }, bill: [45, 160], weight: 8, joinedDaysAgo: 110 },
  { name: "קפה אורנים", category: "restaurants", subcategories: ["cafe"], address: "ויצמן 20", lat: 32.0849, lng: 34.8838, description: "בית קפה שכונתי עם מאפים טריים ופינת עבודה.", offer: { title: "10% הנחה על הכל", description: "קפה, ארוחות בוקר וכריכים", terms: "לא כולל מוצרי מדף.", endsAt: "2026-12-31" }, bill: [35, 140], weight: 10, joinedDaysAgo: 100, branches: [{ name: "קפה אורנים ויצמן", address: "ויצמן 20" }, { name: "קפה אורנים בקניון", address: "ז'בוטינסקי 72" }] },
  { name: "גלידריה קרמל", category: "restaurants", subcategories: ["ice_cream_desserts"], address: "סוקולוב 14", lat: 32.0903, lng: 34.8846, description: "גלידה איטלקית בעבודת יד, 30 טעמים.", offer: { title: "15% הנחה על גלידה", description: "כל הגדלים וכל הטעמים", terms: "למימוש בסניף.", discount: 15 }, commission: 7, bill: [25, 90], weight: 6, joinedDaysAgo: 12 },
  { name: "מאפיית השכונה", category: "food_grocery", subcategories: ["bakery"], address: "הרצל 22", lat: 32.0876, lng: 34.8858, description: "לחמי מחמצת, חלות ועוגות שמרים כל בוקר.", offer: { title: "10% הנחה על כל המאפים", description: "לחמים, עוגות ועוגיות", terms: "לא כולל הזמנות מיוחדות." }, bill: [25, 120], weight: 9, joinedDaysAgo: 95 },
  { name: "מכולת שלום", category: "food_grocery", subcategories: ["grocery_supermarket"], address: "ז'בוטינסקי 118", lat: 32.0928, lng: 34.8664, description: "מכולת שכונתית עם משלוחים עד הדלת.", offer: { title: "10% הנחה על קנייה מעל ₪100", description: "על כל המוצרים בחנות", terms: "לא כולל סיגריות ואלכוהול." }, commission: 4, bill: [100, 380], weight: 7, joinedDaysAgo: 90 },
  { name: "סטודיו ליה ביוטי", category: "beauty", subcategories: ["nails","brows_lashes"], address: "רוטשילד 50", lat: 32.0886, lng: 34.8795, description: "מניקור, פדיקור, גבות וטיפולי פנים.", offer: { title: "10% הנחה על כל הטיפולים", description: "בתיאום מראש", terms: "בהצגת הקוד לפני הטיפול." }, bill: [90, 350], weight: 5, joinedDaysAgo: 80 },
  { name: "מספרת גל", category: "beauty", subcategories: ["hair_salon"], address: "הרצל 40", lat: 32.0884, lng: 34.8871, description: "תספורות לנשים, גברים וילדים.", offer: { title: "10% הנחה על תספורת וצבע", description: "לכל המשפחה", terms: "בתיאום מראש בטלפון." }, bill: [60, 300], weight: 6, joinedDaysAgo: 75 },
  { name: "סטודיו פילאטיס זן", category: "fitness", subcategories: ["studio"], address: "ויצמן 5", lat: 32.0841, lng: 34.8824, description: "פילאטיס מכשירים בקבוצות קטנות.", offer: { title: "10% הנחה על כרטיסייה", description: "כרטיסיות 10 ו-20 שיעורים", terms: "פעם בחודש לדירה." }, bill: [400, 900], weight: 3, joinedDaysAgo: 60 },
  { name: "קרוספיט פתח תקווה", category: "fitness", subcategories: ["gym"], address: "ז'בוטינסקי 100", lat: 32.0921, lng: 34.8689, description: "אימוני קרוספיט ו-HIIT לכל הרמות.", offer: { title: "10% הנחה על מנוי חודשי", description: "מנוי חופשי או 2 אימונים בשבוע", terms: "למצטרפים חדשים ולמנויים קיימים.", startsInDays: 10 }, bill: [300, 550], weight: 2, joinedDaysAgo: 5 },
  { name: "צעצועי גלגל", category: "kids_family", subcategories: ["toys"], address: "סוקולוב 3", lat: 32.0898, lng: 34.8835, description: "צעצועים, משחקי קופסה ומתנות לילדים.", offer: { title: "12% הנחה על כל החנות", description: "צעצועים, ספרים ומשחקים", terms: "לא כולל מבצעים אחרים.", discount: 12, endsAt: "2026-11-30" }, bill: [60, 320], weight: 4, joinedDaysAgo: 20 },
  { name: "כלי בית רינה", category: "home", subcategories: ["kitchenware"], address: "הרצל 12", lat: 32.0872, lng: 34.885, description: "כלי בישול, טקסטיל ועיצוב לבית.", offer: { title: "10% הנחה על כלי בית", description: "על כל המוצרים בחנות", terms: "לא כולל מוצרי חשמל." }, bill: [80, 450], weight: 3, joinedDaysAgo: 70 },
  { name: "חבר על ארבע", category: "pets", subcategories: ["pet_store"], address: "רוטשילד 38", lat: 32.0884, lng: 34.8785, description: "מזון, ציוד ומספרה לכלבים וחתולים.", offer: { title: "10% הנחה על מזון וציוד", description: "כל המותגים", terms: "לא כולל מספרה." }, bill: [70, 400], weight: 4, joinedDaysAgo: 65 },
  { name: "ניקוי יבש הצבעוני", category: "local_services", subcategories: ["laundry_dry_cleaning"], address: "ויצמן 30", lat: 32.0853, lng: 34.8846, description: "ניקוי יבש, כביסה וגיהוץ תוך 48 שעות.", offer: { title: "10% הנחה על ניקוי יבש", description: "חליפות, שמלות ווילונות", terms: "בתשלום בעת המסירה." }, bill: [40, 220], weight: 4, joinedDaysAgo: 85 },
  { name: "פארם השכונה", category: "health", subcategories: ["pharmacy"], address: "ז'בוטינסקי 124", lat: 32.0933, lng: 34.8655, description: "בית מרקחת, קוסמטיקה ותינוקות.", offer: { title: "10% הנחה על קוסמטיקה", description: "טיפוח, איפור ומוצרי תינוקות", terms: "לא כולל תרופות במרשם." }, bill: [50, 280], weight: 6, joinedDaysAgo: 8 },
];

/** Businesses still in the sales pipeline (no offers yet). */
export const LEAD_BUSINESSES = [
  { name: "מסעדת הגפן", category: "restaurants", subcategories: ["restaurant"], address: "מוהליבר 9", status: "pending" },
  { name: "אופטיקה רואים", category: "health", subcategories: ["optics"], address: "רוטשילד 70", status: "lead" },
] as const;

export const FIRST_NAMES = [
  "נועה", "יוסי", "מיכל", "איתי", "תמר", "אורי", "שני", "עומר", "רותם", "דניאל", "הילה", "אלון", "ליאת", "גיא", "מאיה",
  "רועי", "ענבל", "עידו", "קרן", "יונתן", "שירן", "אסף", "טל", "נדב", "אפרת", "בן", "סיון", "אביב", "דנה", "עמית",
];

export const LAST_NAMES = ["כהן", "לוי", "מזרחי", "פרץ", "ביטון", "אברהם", "פרידמן", "אזולאי", "דהן", "שפירא", "גבאי", "קפלן"];

/** Same opening hours for every seeded business: Sun–Thu 08–21, Fri 08–14, Sat closed. */
export const HOURS = {
  sun: [["08:00", "21:00"]], mon: [["08:00", "21:00"]], tue: [["08:00", "21:00"]], wed: [["08:00", "21:00"]],
  thu: [["08:00", "21:00"]], fri: [["08:00", "14:00"]], sat: [],
};
