"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  appName: string;
  dateLabel: string;
};

type WeatherState = {
  temperature: number;
  weatherCode: number;
};

function weatherLabel(code: number): string {
  if (code === 0) return "Ciel clair";
  if (code === 1 || code === 2) return "Peu nuageux";
  if (code === 3) return "Couvert";
  if (code === 45 || code === 48) return "Brume";
  if (code === 51 || code === 53 || code === 55) return "Bruine";
  if (code === 56 || code === 57) return "Bruine verglaçante";
  if (code === 61 || code === 63 || code === 65) return "Pluie";
  if (code === 66 || code === 67) return "Pluie verglaçante";
  if (code === 71 || code === 73 || code === 75 || code === 77) return "Neige";
  if (code === 80 || code === 81 || code === 82) return "Averses";
  if (code === 85 || code === 86) return "Averses de neige";
  if (code === 95 || code === 96 || code === 99) return "Orage";
  return "Météo du jour";
}

export function Header({ appName, dateLabel }: Props) {
  const [now, setNow] = useState<Date>(new Date());
  const [weather, setWeather] = useState<WeatherState | null>(null);

  useEffect(() => {
    const clock = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchWeather = async () => {
      try {
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&current=temperature_2m,weather_code&timezone=Europe%2FParis",
          { cache: "no-store" }
        );

        if (!response.ok) return;

        const data = await response.json();
        const current = data?.current;

        if (!isMounted || !current) return;

        if (typeof current.temperature_2m === "number" && typeof current.weather_code === "number") {
          setWeather({
            temperature: current.temperature_2m,
            weatherCode: current.weather_code
          });
        }
      } catch {
        // Fallback discret si météo indisponible
      }
    };

    fetchWeather();
    const weatherTimer = window.setInterval(fetchWeather, 30 * 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(weatherTimer);
    };
  }, []);

  const displayDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Europe/Paris"
      }).format(now);
    } catch {
      return dateLabel;
    }
  }, [dateLabel, now]);

  const displayTime = useMemo(() => {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris"
    }).format(now);
  }, [now]);

  const weatherCondition = weather ? weatherLabel(weather.weatherCode) : "Météo indisponible";
  const weatherTemp = weather ? `${Math.round(weather.temperature)}°C` : "--";

  return (
    <header className="animate-fadeCalm rounded-soft border border-borderSubtle/70 bg-surface/70 p-4 backdrop-blur-sm transition-all duration-300 ease-calm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs tracking-[0.18em] text-textMuted">{appName}</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-textPrimary">{displayDate}</p>
          <p className="mt-1 text-xs text-textMuted">Paris</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="rounded-full border border-lavender/35 bg-lavender/14 px-3 py-1 text-sm font-medium text-[#ECE9FF]">
            {displayTime}
            <span className="ml-1 text-[11px] font-normal text-[#ECE9FF]/75">(Paris)</span>
          </div>

          <div className="max-w-[170px] rounded-full border border-borderSubtle/80 bg-[#14141d]/75 px-3 py-1 text-xs text-textSecondary">
            <span className="font-medium text-textPrimary">{weatherTemp}</span>
            <span className="mx-1.5 text-textMuted">•</span>
            <span>{weatherCondition}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
