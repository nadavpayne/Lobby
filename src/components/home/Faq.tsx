const QUESTIONS = [
  ["כמה זה עולה לדיירים?", "כלום. ההטבות חינם לכל דירה בבניין שמצטרף."],
  ["כמה זה עולה לוועד הבית?", "חינם בתקופת הניסיון. אחריה, מנוי חודשי קטן מקופת הבניין."],
  ["כמה זה עולה לעסק?", "רק על מכירות שאימתתם: 10% הנחה לדייר ו-5% עמלה ללובי. אין דמי הצטרפות."],
  ["כמה פעמים אפשר לממש?", "פעם אחת לדירה, בכל עסק, בכל חודש קלנדרי. בעסק אחר אפשר לממש באותו חודש."],
  ["למה אי אפשר להירשם לבד?", "לובי הוא מועדון סגור: מצטרפים רק דרך בניין מזוהה, כדי שההטבות יישארו לשכנים."],
  ["איך העסק יודע שהקוד אמיתי?", "כל קוד אישי לדירה ולעסק אחד, תקף 24 שעות ואפשר לממש אותו פעם אחת בלבד. העסק בודק אותו במסך האימות שלו."],
] as const;

/** Frequently asked questions as native, keyboard-accessible disclosure widgets. */
export function Faq() {
  return (
    <section id="faq" className="scroll-mt-36 bg-white py-14">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="mb-8 text-3xl font-bold">שאלות נפוצות</h2>
        <div className="flex flex-col gap-3">
          {QUESTIONS.map(([q, a]) => (
            <details key={q} className="group rounded-2xl bg-cream px-5">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 text-lg font-bold">
                {q}
                <span aria-hidden className="text-2xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-5 text-lg leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
