import type { ReactNode } from "react";

type Props = {
  quote: string | null;
  actions?: ReactNode;
};

export function QuoteOfTheDay({ quote, actions }: Props) {
  return (
    <section className="animate-fadeCalm rounded-[20px] border border-lavender/25 bg-surface px-5 py-8 shadow-quote transition-all duration-300 ease-calm" style={{ animationDelay: "90ms" }}>
      <p className="text-center text-xs tracking-[0.18em] text-lavender">✧ Phrase du jour</p>

      <blockquote className="mx-auto mt-5 max-w-[32ch] text-center font-serif text-[1.38rem] italic leading-[1.68] text-[#EEEAF9] sm:text-[1.52rem]">
        {quote || "Il y a des jours qui nous apprennent doucement à respirer plus lentement."}
      </blockquote>

      {actions}
    </section>
  );
}
