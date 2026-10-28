const STEPS = [
  ["ועד הבית משתף קישור", "קישור הזמנה ייחודי לבניין נשלח בקבוצת הווטסאפ של הדיירים."],
  ["הדייר מקבל קוד אישי", "בוחרים עסק בשכונה ומקבלים קוד חד-פעמי, אישי לדירה ולעסק."],
  ["מציגים בקופה וחוסכים", "העסק מאמת את הקוד, והדייר מקבל את ההנחה של העסק. פעם בחודש בכל עסק."],
] as const;

/** Three-step explanation of the flow. Phones swipe through the steps sideways (the next card peeks in); desktop shows three columns. */
export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-36 bg-linear-to-b from-cream via-white to-cream py-14">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mb-8 text-3xl font-bold">איך זה עובד</h2>
        <ol className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="flex w-[82%] shrink-0 snap-start flex-col gap-3 rounded-2xl bg-cream p-6 md:w-auto">
              <span className="flex size-11 items-center justify-center rounded-full bg-navy text-xl font-bold text-cream">{i + 1}</span>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-lg leading-relaxed">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
