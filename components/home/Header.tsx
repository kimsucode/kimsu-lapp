type Props = {
  appName: string;
  dateLabel: string;
};

export function Header({ appName, dateLabel }: Props) {
  return (
    <header className="animate-fadeCalm rounded-soft border border-borderSubtle/70 bg-surface/70 px-4 py-3 backdrop-blur-sm transition-all duration-300 ease-calm">
      <p className="text-xs tracking-[0.18em] text-textMuted">{appName}</p>
      <p className="mt-1 text-sm text-textSecondary">{dateLabel}</p>
    </header>
  );
}
