
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  CalendarDays,
  CheckCircle2,
  Target,
  Sun,
  Moon,
  RotateCcw,
  Calculator,
  X,
} from "lucide-react";

const PRAYERS = [
  { id: "fajr", name: "Fajr", type: "Fard" },
  { id: "zuhr", name: "Zuhr", type: "Fard" },
  { id: "asr", name: "Asr", type: "Fard" },
  { id: "maghrib", name: "Maghrib", type: "Fard" },
  { id: "isha", name: "Isha", type: "Fard" },
  { id: "witr", name: "Witr", type: "Wajib" },
];

const DEFAULT_TARGETS = {
  fajr: 2555,
  zuhr: 2555,
  asr: 2555,
  maghrib: 2555,
  isha: 2555,
  witr: 2555,
};

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getDayTotal(log, date) {
  const record = log[dateKey(date)] || {};
  return PRAYERS.reduce(
    (sum, prayer) => sum + Number(record[prayer.id] || 0),
    0
  );
}

function getPrayerTotal(log, prayerId) {
  return Object.values(log).reduce(
    (sum, record) => sum + Number(record?.[prayerId] || 0),
    0
  );
}

function calculateQazaDays(start, end) {
  if (!start || !end || start > end) return 0;

  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);

  const startUTC = Date.UTC(sy, sm - 1, sd);
  const endUTC = Date.UTC(ey, em - 1, ed);

  return Math.floor((endUTC - startUTC) / 86400000) + 1;
}

export default function Home() {
  const [dark, setDark] = useState(false);

  // Dates are initialized after mounting to avoid prerender warnings.
  const [todayKey, setTodayKey] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(null);

  const [log, setLog] = useState({});
  const [targets, setTargets] = useState({ ...DEFAULT_TARGETS });

  // Qaza calculator state
  const [showQazaCalculator, setShowQazaCalculator] = useState(false);
  const [qazaStartDate, setQazaStartDate] = useState("");
  const [qazaEndDate, setQazaEndDate] = useState("");

  const [calculatorPrayers, setCalculatorPrayers] = useState({
    fajr: true,
    zuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
    witr: true,
  });

  useEffect(() => {
    const today = new Date();
    const sevenYearsAgo = new Date(today);
    sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

    setTodayKey(dateKey(today));
    setSelectedDate(today);
    setVisibleMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );
    setQazaStartDate(dateKey(sevenYearsAgo));
    setQazaEndDate(dateKey(today));
  }, []);

  const completedByPrayer = useMemo(
    () =>
      Object.fromEntries(
        PRAYERS.map((prayer) => [
          prayer.id,
          getPrayerTotal(log, prayer.id),
        ])
      ),
    [log]
  );

  const completedTotal = PRAYERS.reduce(
    (sum, prayer) => sum + completedByPrayer[prayer.id],
    0
  );

  const targetTotal = PRAYERS.reduce(
    (sum, prayer) => sum + Number(targets[prayer.id] || 0),
    0
  );

  const remainingTotal = PRAYERS.reduce(
    (sum, prayer) =>
      sum +
      Math.max(
        0,
        Number(targets[prayer.id] || 0) -
          completedByPrayer[prayer.id]
      ),
    0
  );

  const overallProgress =
    targetTotal > 0
      ? Math.min(
          100,
          Math.round((completedTotal / targetTotal) * 100)
        )
      : 0;

  const selectedKey = selectedDate ? dateKey(selectedDate) : "";
  const selectedRecord = log[selectedKey] || {};

  const currentYear = todayKey
    ? Number(todayKey.slice(0, 4))
    : 2026;

  const years = Array.from(
    { length: 100 },
    (_, index) => currentYear - index
  );

  const calculatedDays = calculateQazaDays(
    qazaStartDate,
    qazaEndDate
  );

  const selectedPrayerCount = PRAYERS.filter(
    (prayer) => calculatorPrayers[prayer.id]
  ).length;

  const calculatedTotal = calculatedDays * selectedPrayerCount;

  const page = dark
    ? "min-h-screen bg-[#0b1120] text-slate-100"
    : "min-h-screen bg-slate-50 text-slate-900";

  const card = dark
    ? "rounded-2xl border border-slate-800 bg-[#111b2e] shadow-lg shadow-black/10"
    : "rounded-2xl border border-slate-200 bg-white shadow-sm";

  const muted = dark ? "text-slate-400" : "text-slate-500";

  const inputClass = dark
    ? "rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
    : "rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-500";

  const secondaryButton = dark
    ? "border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100";

  const primaryButton =
    "bg-emerald-600 text-white hover:bg-emerald-500";

  const iconButton =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-30";

  function changeCount(prayerId, amount) {
    if (!selectedDate) return;

    setLog((current) => {
      const key = dateKey(selectedDate);
      const record = current[key] || {};
      const count = Math.max(
        0,
        Number(record[prayerId] || 0) + amount
      );

      return {
        ...current,
        [key]: {
          ...record,
          [prayerId]: count,
        },
      };
    });
  }

  function changeMonth(amount) {
    if (!visibleMonth) return;

    setVisibleMonth(
      new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth() + amount,
        1
      )
    );
  }

  function selectDay(day) {
    setSelectedDate(day);
    setVisibleMonth(
      new Date(day.getFullYear(), day.getMonth(), 1)
    );
  }

  function goToToday() {
    const today = new Date();

    setSelectedDate(today);
    setVisibleMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );
  }

  function resetProgress() {
    if (
      !window.confirm(
        "Reset all completed Qaza entries and restore default targets?"
      )
    ) {
      return;
    }

    setLog({});
    setTargets({ ...DEFAULT_TARGETS });
  }

  function openQazaCalculator() {
    if (!qazaStartDate || !qazaEndDate) {
      const today = new Date();
      const sevenYearsAgo = new Date(today);
      sevenYearsAgo.setFullYear(
        sevenYearsAgo.getFullYear() - 7
      );

      setQazaStartDate(dateKey(sevenYearsAgo));
      setQazaEndDate(dateKey(today));
    }

    setShowQazaCalculator(true);
  }

  function applyQazaCalculation() {
    if (calculatedDays <= 0 || selectedPrayerCount === 0) return;

    setTargets((current) => {
      const updated = { ...current };

      PRAYERS.forEach((prayer) => {
        if (calculatorPrayers[prayer.id]) {
          updated[prayer.id] = calculatedDays;
        }
      });

      return updated;
    });

    setShowQazaCalculator(false);
  }

  // Avoid rendering date-dependent content before client initialization.
  if (!selectedDate || !visibleMonth || !todayKey) {
    return (
      <main className={`${page} flex min-h-screen items-center justify-center`}>
        <p className={muted}>Loading Qaza Tracker...</p>
      </main>
    );
  }

  const firstDay = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1
  );

  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0
  ).getDate();

  const weeks = Math.ceil(
    (firstDay.getDay() + daysInMonth) / 7
  );

  const calendarDays = Array.from(
    { length: weeks * 7 },
    (_, index) =>
      new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
        index - firstDay.getDay() + 1
      )
  );

  

  

  return (
    <main className={`${page} transition-colors duration-300`}>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">

        {/* Header */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className={`mb-2 flex items-center gap-2 text-sm ${muted}`}>
              <CalendarDays size={17} />
              Personal worship tracker
            </div>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Qaza Namaz Tracker
            </h1>

            <p className={`mt-2 text-sm ${muted}`}>
              Make progress one Qaza prayer at a time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`${card} flex items-center gap-2 px-3 py-2 text-sm`}>
              <CheckCircle2 size={17} className="text-emerald-500" />
              Frontend demo
            </div>

            <button
              type="button"
              onClick={() => setDark((current) => !current)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${secondaryButton}`}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
              {dark ? "Light Mode" : "Dark Mode"}
            </button>

            <button
              type="button"
              onClick={resetProgress}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${secondaryButton}`}
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </header>

        {/* Summary cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Qaza completed",
              value: completedTotal,
              description: "All prayer categories",
            },
            {
              title: "Qaza remaining",
              value: remainingTotal,
              description: "Based on your targets",
            },
            {
              title: "Overall progress",
              value: `${overallProgress}%`,
              description: `${completedTotal.toLocaleString("en-IN")} of ${targetTotal.toLocaleString("en-IN")} entries`,
              progress: overallProgress,
            },
          ].map((item) => (
            <section key={item.title} className={`${card} p-5`}>
              <p className={`text-sm font-medium ${muted}`}>
                {item.title}
              </p>

              <p className="mt-3 text-3xl font-bold">
                {typeof item.value === "number"
                  ? item.value.toLocaleString("en-IN")
                  : item.value}
              </p>

              {item.progress !== undefined && (
                <div className={`mt-4 h-2 overflow-hidden rounded-full ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              <p className={`mt-2 text-xs ${muted}`}>
                {item.description}
              </p>
            </section>
          ))}
        </section>

        {/* Calendar and daily tracker */}
        <section className="grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className={card}>
            <div className="flex flex-col gap-4 p-5">
              <div>
                <h2 className="text-xl font-bold">Qaza Calendar</h2>
                <p className={`mt-1 text-sm ${muted}`}>
                  Select any month, year, and date.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => changeMonth(-1)}
                  className={`${iconButton} ${secondaryButton}`}
                >
                  <ChevronLeft size={18} />
                </button>

                <select
                  value={visibleMonth.getMonth()}
                  onChange={(event) =>
                    setVisibleMonth(
                      new Date(
                        visibleMonth.getFullYear(),
                        Number(event.target.value),
                        1
                      )
                    )
                  }
                  className={`${inputClass} min-w-36 flex-1`}
                  aria-label="Select month"
                >
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  value={visibleMonth.getFullYear()}
                  onChange={(event) =>
                    setVisibleMonth(
                      new Date(
                        Number(event.target.value),
                        visibleMonth.getMonth(),
                        1
                      )
                    )
                  }
                  className={`${inputClass} w-28`}
                  aria-label="Select year"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => changeMonth(1)}
                  className={`${iconButton} ${secondaryButton}`}
                >
                  <ChevronRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={goToToday}
                  className={`rounded-lg px-3 py-2 text-sm ${secondaryButton}`}
                >
                  Today
                </button>
              </div>

              <p className={`text-sm font-medium ${muted}`}>
                {MONTHS[visibleMonth.getMonth()]}{" "}
                {visibleMonth.getFullYear()}
              </p>
            </div>

            <div className="px-3 pb-5 sm:px-5">
              <div className="grid grid-cols-7 gap-1.5">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className={`pb-2 text-center text-xs font-semibold ${muted}`}
                    >
                      {day}
                    </div>
                  )
                )}

                {calendarDays.map((day) => {
                  const key = dateKey(day);
                  const isSelected = key === selectedKey;

                  const isCurrentMonth =
                    day.getMonth() === visibleMonth.getMonth() &&
                    day.getFullYear() === visibleMonth.getFullYear();

                  const total = getDayTotal(log, day);

                  const dayClass = isSelected
                    ? "border-emerald-500 bg-emerald-600 text-white"
                    : dark
                    ? "border-slate-800 bg-slate-900/70 hover:border-slate-600"
                    : "border-slate-100 bg-slate-50 hover:border-slate-300";

                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => selectDay(day)}
                      aria-pressed={isSelected}
                      aria-label={`${formatDate(day)}, ${total} entries`}
                      className={`flex min-h-[68px] flex-col items-center rounded-xl border p-1.5 transition sm:min-h-[78px] ${dayClass} ${!isCurrentMonth ? "opacity-35" : ""}`}
                    >
                      <span className="text-sm font-semibold">
                        {day.getDate()}
                      </span>

                      {total > 0 ? (
                        <span className={`mt-1 rounded-md px-1 py-0.5 text-[10px] font-semibold ${isSelected ? "bg-white/20 text-white" : "bg-emerald-500/15 text-emerald-500"}`}>
                          {total} done
                        </span>
                      ) : (
                        <span className="mt-1 text-[10px] opacity-40">
                          —
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className={`mt-4 text-xs ${muted}`}>
                Select a date to record completed Qaza prayers.
              </p>
            </div>
          </section>

          {/* Daily prayer counters */}
          <section className={card}>
            <div className="p-5">
              <h2 className="text-xl font-bold">Record your Qaza</h2>
              <p className={`mt-2 text-sm ${muted}`}>
                {formatDate(selectedDate)}
              </p>
              <p className={`mt-1 text-xs ${muted}`}>
                Press + to add a completed Qaza, or − to undo one.
              </p>
            </div>

            <div className="space-y-3 px-4 pb-5 sm:px-5">
              {PRAYERS.map((prayer) => {
                const count = Number(selectedRecord[prayer.id] || 0);

                return (
                  <div
                    key={prayer.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${dark ? "border-slate-800" : "border-slate-200"}`}
                  >
                    <div>
                      <p className="font-semibold">{prayer.name}</p>
                      <p className={`mt-0.5 text-xs ${muted}`}>
                        {prayer.type}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={count === 0}
                        aria-label={`Undo ${prayer.name}`}
                        onClick={() => changeCount(prayer.id, -1)}
                        className={`${iconButton} ${secondaryButton}`}
                      >
                        <Minus size={16} />
                      </button>

                      <span className="w-7 text-center font-bold tabular-nums">
                        {count}
                      </span>

                      <button
                        type="button"
                        aria-label={`Add ${prayer.name}`}
                        onClick={() => changeCount(prayer.id, 1)}
                        className={`${iconButton} ${primaryButton}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className={`flex items-center justify-between rounded-xl p-4 ${dark ? "bg-slate-900" : "bg-slate-100"}`}>
                <span className="text-sm font-medium">
                  Completed on this date
                </span>
                <span className="text-xl font-bold">
                  {getDayTotal(log, selectedDate)}
                </span>
              </div>
            </div>
          </section>
        </section>

        {/* Qaza calculator trigger */}
        <section className={`${card} p-5`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Calculate Your Qaza</h2>
              <p className={`mt-1 text-sm ${muted}`}>
                Estimate missed prayers between two dates.
              </p>
            </div>

            <button
              type="button"
              onClick={openQazaCalculator}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold ${primaryButton}`}
            >
              <Calculator size={18} />
              Calculate Qaza
            </button>
          </div>
        </section>

        {/* Qaza calculator popup */}
        {showQazaCalculator && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShowQazaCalculator(false);
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="qaza-calculator-title"
              className={`my-auto w-full max-w-lg rounded-2xl border p-5 shadow-2xl sm:p-6 ${dark ? "border-slate-700 bg-[#111b2e] text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="qaza-calculator-title" className="text-xl font-bold">
                    Qaza Date Calculator
                  </h2>
                  <p className={`mt-1 text-sm ${muted}`}>
                    Choose the period you want to calculate.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close calculator"
                  onClick={() => setShowQazaCalculator(false)}
                  className={`${iconButton} ${secondaryButton}`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Date range */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="qaza-start-date" className={`mb-2 block text-sm font-medium ${muted}`}>
                    From date
                  </label>
                  <input
                    id="qaza-start-date"
                    type="date"
                    value={qazaStartDate}
                    max={qazaEndDate || todayKey}
                    onChange={(event) => setQazaStartDate(event.target.value)}
                    className={`${inputClass} w-full`}
                  />
                </div>

                <div>
                  <label htmlFor="qaza-end-date" className={`mb-2 block text-sm font-medium ${muted}`}>
                    To date
                  </label>
                  <input
                    id="qaza-end-date"
                    type="date"
                    value={qazaEndDate}
                    min={qazaStartDate || undefined}
                    max={todayKey}
                    onChange={(event) => setQazaEndDate(event.target.value)}
                    className={`${inputClass} w-full`}
                  />
                </div>
              </div>

              {/* Prayer selection */}
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">
                    Select prayers to include
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setCalculatorPrayers((current) => {
                        const allSelected = PRAYERS.every(
                          (prayer) => current[prayer.id]
                        );

                        return Object.fromEntries(
                          PRAYERS.map((prayer) => [
                            prayer.id,
                            !allSelected,
                          ])
                        );
                      })
                    }
                    className="text-xs font-semibold text-emerald-500"
                  >
                    {PRAYERS.every((prayer) => calculatorPrayers[prayer.id])
                      ? "Deselect all"
                      : "Select all"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {PRAYERS.map((prayer) => (
                    <label
                      key={prayer.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${dark ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}
                    >
                      <input
                        type="checkbox"
                        checked={calculatorPrayers[prayer.id]}
                        onChange={(event) =>
                          setCalculatorPrayers((current) => ({
                            ...current,
                            [prayer.id]: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-emerald-600"
                      />

                      <span>
                        <span className="block text-sm font-semibold">
                          {prayer.name}
                        </span>
                        <span className={`block text-xs ${muted}`}>
                          {prayer.type}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Calculator results */}
              <div className={`mt-6 rounded-xl p-4 ${dark ? "bg-slate-900" : "bg-emerald-50"}`}>
                <p className={`text-sm ${muted}`}>
                  Days in selected period (inclusive)
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {calculatedDays > 0
                    ? calculatedDays.toLocaleString("en-IN")
                    : "Invalid date range"}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className={`text-sm ${muted}`}>
                    Estimated prayers
                  </span>
                  <span className="text-xl font-bold text-emerald-500">
                    {calculatedDays > 0
                      ? calculatedTotal.toLocaleString("en-IN")
                      : "0"}
                  </span>
                </div>

                <p className={`mt-2 text-xs ${muted}`}>
                  One Qaza per selected prayer per day.
                </p>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowQazaCalculator(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${secondaryButton}`}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={calculatedDays <= 0 || selectedPrayerCount === 0}
                  onClick={applyQazaCalculation}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${primaryButton}`}
                >
                  Apply to targets
                </button>
              </div>

              <p className={`mt-4 text-xs leading-5 ${muted}`}>
                Applying replaces the target for each selected prayer with
                the number of days in the chosen period. Unselected targets
                remain unchanged. Adjust the estimate for days when you
                did not miss a prayer.
              </p>
            </section>
          </div>
        )}

        {/* Editable Qaza targets */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Qaza targets</h2>
            <p className={`mt-1 text-sm ${muted}`}>
              Set the estimated outstanding count for each prayer.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRAYERS.map((prayer) => {
              const target = Number(targets[prayer.id] || 0);
              const completed = completedByPrayer[prayer.id];
              const remaining = Math.max(0, target - completed);

              const progress =
                target > 0
                  ? Math.min(100, Math.round((completed / target) * 100))
                  : 0;

              return (
                <section key={prayer.id} className={`${card} p-5`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{prayer.name}</h3>
                      <p className={`text-sm ${muted}`}>{prayer.type}</p>
                    </div>
                    <Target size={19} className={muted} />
                  </div>

                  <label htmlFor={`target-${prayer.id}`} className={`mb-2 mt-5 block text-sm ${muted}`}>
                    Total Qaza owed
                  </label>

                  <input
                    id={`target-${prayer.id}`}
                    type="number"
                    min="0"
                    step="1"
                    value={targets[prayer.id]}
                    onChange={(event) => {
                      const value = Math.max(
                        0,
                        Number(event.target.value) || 0
                      );

                      setTargets((current) => ({
                        ...current,
                        [prayer.id]: value,
                      }));
                    }}
                    className={`${inputClass} w-full`}
                  />

                  <div className="mt-4 flex justify-between gap-2 text-sm">
                    <span className={muted}>
                      Done: {completed.toLocaleString("en-IN")}
                    </span>
                    <span className="font-semibold">
                      Left: {remaining.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className={`mt-3 h-2 overflow-hidden rounded-full ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className={`mt-2 text-right text-xs ${muted}`}>
                    {progress}% completed
                  </p>
                </section>
              );
            })}
          </div>
        </section>

        <footer className={`border-t py-5 text-xs leading-6 ${muted} ${dark ? "border-slate-800" : "border-slate-200"}`}>
          Frontend demo only: refreshing the page resets entries and targets.
          The default target of 2,555 per prayer is an estimate based on seven
          years of 365 days. Adjust targets to reflect your actual Qaza.
          Witr is tracked separately as Wajib according to the Hanafi school.
        </footer>
      </div>
    </main>
  );
}
