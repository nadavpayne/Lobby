import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "מדיניות עוגיות | לובי" };

/** /cookies — Lobby uses no tracking cookies, only browser storage needed to stay signed in. */
export default function CookiesPage() {
  return (
    <LegalPage title="מדיניות עוגיות ואחסון מקומי">
      <h2>בקצרה</h2>
      <p>
        לובי <strong>לא</strong> משתמש בעוגיות פרסום, מעקב או סטטיסטיקה, ולא משתף מידע גלישה עם צדדים שלישיים לצורכי שיווק. אנחנו
        שומרים בדפדפן רק את מה שנחוץ כדי שתישארו מחוברים. לכן אין צורך לבקש מכם הסכמה לעוגיות.
      </p>

      <h2>מה נשמר בדפדפן ולמה</h2>
      <ul>
        <li><strong>חיבור לחשבון:</strong> אסימון כניסה, כדי שלא תצטרכו להזין קוד מהאימייל בכל פעם.</li>
        <li><strong>מסך האימות של העסק:</strong> אסימון של המכשיר, כדי שקוד ה-PIN יידרש פעם אחת בלבד בכל מכשיר.</li>
      </ul>
      <p>המידע נשמר באחסון המקומי של הדפדפן (localStorage) ולא נשלח לאתרים אחרים.</p>

      <h2>איך מוחקים</h2>
      <p>
        יציאה מהחשבון באפליקציה מוחקת את אסימון הכניסה. אפשר גם למחוק את נתוני האתר בהגדרות הדפדפן (בדרך כלל: הגדרות ← פרטיות ←
        נתוני אתרים). לאחר המחיקה תתבקשו להתחבר שוב.
      </p>

      <h2>שינויים</h2>
      <p>
        אם נתחיל להשתמש בכלי מדידה או בעוגיות שאינן הכרחיות, נעדכן מדיניות זו ונבקש את הסכמתכם מראש. מידע נוסף ב
        <Link href="/privacy">מדיניות הפרטיות</Link>. לשאלות: <ContactEmail />.
      </p>
    </LegalPage>
  );
}
