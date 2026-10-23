
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  CheckCircle2,
  Circle,
  XCircle,
  RotateCcw,
  Sunrise,
  Sunset,
  Clock3,
  CalendarCheck,
} from "lucide-react";

const PRAYERS = [
  { id: "fajr", name: "Fajr", type: "Fard", time: "Dawn", icon: Sunrise },
  { id: "zuhr", name: "Zuhr", type: "Fard", time: "Midday", icon: Sun },
  { id: "asr", name: "Asr", type: "Fard", time: "Afternoon", icon: Clock3 },
  { id: "maghrib", name: "Maghrib", type: "Fard", time: "Sunset", icon: Sunset },
  { id: "isha", name: "Isha", type: "Fard", time: "Night", icon: Moon },
];

const WITR = {
  id: "witr",
  name: "Witr",
  type: "Wajib",
  time: "After Isha",
  icon: Moon,
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatLongDate(key) {
  return parseDateKey(key).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function makeEmptyRecord() {
  return {
    fajr: "pending",
    zuhr: "pending",
    asr: "pending",
    maghrib: "pending",
    isha: "pending",
    witr: "pending",
  };
}

function getRecord(records, key) {
  return records[key] || makeEmptyRecord();
}

function getMonthDates(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const count = new Date(year, monthNumber, 0).getDate();

  return Array.from({ length: count }, (_, i) =>
    dateKey(new Date(year, monthNumber - 1, i + 1, 12))
  );
}

function getWeekDates(key) {
  const date = parseDateKey(key);
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay());

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    return dateKey(day);
  });
}

function calculateStats(records, dates) {
  let completedFard = 0;
  let missedFard = 0;
  let completedWitr = 0;
  let missedWitr = 0;
  let recordedDays = 0;

  dates.forEach((key) => {
    const record = records[key];
    if (!record) return;

    recordedDays += 1;

    PRAYERS.forEach(({ id }) => {
      if (record[id] === "done") completedFard += 1;
      if (record[id] === "missed") missedFard += 1;
    });

    if (record.witr === "done") completedWitr += 1;
    if (record.witr === "missed") missedWitr += 1;
  });

  const possibleFard = dates.length * PRAYERS.length;
  const completionRate = possibleFard
    ? Math.round((completedFard / possibleFard) * 100)
    : 0;

  return {
    completedFard,
    missedFard,
    completedWitr,
    missedWitr,
    recordedDays,
    completionRate,
  };
}

export default function NamazTrackerPage() {
  const [ready, setReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [visibleMonth, setVisibleMonth] = useState("");
  const [records, setRecords] = useState({});
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const today = dateKey(new Date());
    setSelectedDate(today);
    setVisibleMonth(monthKey(new Date()));
    setReady(true);
  }, []);

  const selectedRecord = useMemo(
    () => (selectedDate ? getRecord(records, selectedDate) : makeEmptyRecord()),
    [records, selectedDate]
  );

  const calendarDates = useMemo(() => {
    if (!visibleMonth) return [];

    const [year, month] = visibleMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1, 12).getDay();
    const dates = getMonthDates(visibleMonth);

    return [
      ...Array.from({ length: firstDay }, () => null),
      ...dates,
    ];
  }, [visibleMonth]);

  const weeklyStats = useMemo(() => {
    if (!selectedDate) return calculateStats({}, []);
    return calculateStats(records, getWeekDates(selectedDate));
  }, [records, selectedDate]);

  const monthlyStats = useMemo(() => {
    if (!visibleMonth) return calculateStats({}, []);
    return calculateStats(records, getMonthDates(visibleMonth));
  }, [records, visibleMonth]);

  const completedToday = Object.values(selectedRecord).filter(
    (status) => status === "done"
  ).length;

  const totalPrayers = PRAYERS.length + 1;
  const dailyProgress = Math.round((completedToday / totalPrayers) * 100);

  function changeMonth(offset) {
    const [year, month] = visibleMonth.split("-").map(Number);
    const next = new Date(year, month - 1 + offset, 1, 12);
    setVisibleMonth(monthKey(next));
  }

  function changePrayerStatus(prayerId, status) {
    setRecords((current) => {
      const record = getRecord(current, selectedDate);
      return {
        ...current,
        [selectedDate]: {
          ...record,
          [prayerId]: status,
        },
      };
    });
  }

  function resetSelectedDay() {
    setRecords((current) => {
      const updated = { ...current };
      delete updated[selectedDate];
      return updated;
    });
  }

  function selectDate(key) {
    setSelectedDate(key);
  }

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#f8f7ef] dark:bg-slate-950" />
    );
  }

  const currentMonthDate = parseDateKey(`${visibleMonth}-01`);
  const todayKey = dateKey(new Date());

  const pageClass = darkMode
    ? "min-h-screen bg-slate-950 text-slate-100"
    : "min-h-screen bg-[#f8f7ef] text-slate-800";

  const panelClass = darkMode
    ? "border border-slate-800 bg-slate-900"
    : "border border-emerald-100 bg-white";

  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";

  const selectClass = `rounded-xl border px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500 ${
    darkMode
      ? "border-slate-700 bg-slate-950 text-slate-100"
      : "border-emerald-200 bg-white text-emerald-900"
  }`;

  return (
    <main className={pageClass}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
              <CalendarCheck size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Namaz Tracker
              </h1>
              <p className={`mt-1 text-sm ${mutedText}`}>
                Build consistency, one prayer at a time.
              </p>
            </div>
          </div>

          <button
            onClick={() => setDarkMode((value) => !value)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              darkMode
                ? "border-slate-700 bg-slate-900 hover:bg-slate-800"
                : "border-emerald-100 bg-white hover:bg-emerald-50"
            }`}
          >
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            {darkMode ? "Light mode" : "Dark mode"}
          </button>
        </header>

        {/* Daily summary */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-emerald-800 p-5 text-white shadow-sm sm:col-span-2">
            <p className="text-sm text-emerald-100">Selected date</p>
            <h2 className="mt-2 text-xl font-bold">
              {formatLongDate(selectedDate)}
            </h2>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-emerald-100">Daily progress</p>
                <p className="mt-1 text-3xl font-bold">{dailyProgress}%</p>
              </div>
              <p className="text-sm text-emerald-100">
                {completedToday} of {totalPrayers} completed
              </p>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-950/40">
              <div
                className="h-full rounded-full bg-emerald-200 transition-all"
                style={{ width: `${dailyProgress}%` }}
              />
            </div>
          </div>

          <div className={`rounded-2xl p-5 shadow-sm ${panelClass}`}>
            <p className={`text-sm ${mutedText}`}>Fard completed today</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {
                PRAYERS.filter(
                  ({ id }) => selectedRecord[id] === "done"
                ).length
              }
              <span className={`ml-1 text-base font-medium ${mutedText}`}>
                / 5
              </span>
            </p>
            <p className={`mt-2 text-xs ${mutedText}`}>
              Five obligatory daily prayers
            </p>
          </div>

          <div className={`rounded-2xl p-5 shadow-sm ${panelClass}`}>
            <p className={`text-sm ${mutedText}`}>Witr status</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {selectedRecord.witr === "done"
                ? "Done"
                : selectedRecord.witr === "missed"
                ? "Missed"
                : "Pending"}
            </p>
            <p className={`mt-2 text-xs ${mutedText}`}>
              Tracked separately from Fard
            </p>
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Calendar */}
          <section className={`rounded-2xl p-4 shadow-sm sm:p-6 ${panelClass}`}>
            <div className="mb-5 flex items-center gap-2">
              <CalendarDays className="text-emerald-600" size={21} />
              <h2 className="text-lg font-bold">Calendar & past records</h2>
            </div>

            {/* Month and year selection */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
                className={`rounded-xl border p-2.5 transition ${
                  darkMode
                    ? "border-slate-700 hover:bg-slate-800"
                    : "border-emerald-100 hover:bg-emerald-50"
                }`}
              >
                <ChevronLeft size={19} />
              </button>

              <div className="flex flex-1 flex-wrap justify-center gap-2">
                <select
                  aria-label="Select month"
                  value={Number(visibleMonth.split("-")[1])}
                  onChange={(event) => {
                    const year = visibleMonth.split("-")[0];
                    const month = String(
                      Number(event.target.value)
                    ).padStart(2, "0");
                    setVisibleMonth(`${year}-${month}`);
                  }}
                  className={selectClass}
                >
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Select year"
                  value={Number(visibleMonth.split("-")[0])}
                  onChange={(event) => {
                    const month = visibleMonth.split("-")[1];
                    setVisibleMonth(`${event.target.value}-${month}`);
                  }}
                  className={selectClass}
                >
                  {Array.from({ length: 201 }, (_, index) => {
                    const year = new Date().getFullYear() - 100 + index;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                onClick={() => changeMonth(1)}
                aria-label="Next month"
                className={`rounded-xl border p-2.5 transition ${
                  darkMode
                    ? "border-slate-700 hover:bg-slate-800"
                    : "border-emerald-100 hover:bg-emerald-50"
                }`}
              >
                <ChevronRight size={19} />
              </button>
            </div>

            <div className="mb-3 text-center">
              <p className="text-base font-bold">
                {MONTHS[currentMonthDate.getMonth()]}{" "}
                {currentMonthDate.getFullYear()}
              </p>
              <p className={`mt-1 text-xs ${mutedText}`}>
                Select a date to view or update its records
              </p>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className={`py-2 text-center text-xs font-semibold ${mutedText}`}
                >
                  {day}
                </div>
              ))}

              {calendarDates.map((key, index) => {
                if (!key) {
                  return <div key={`empty-${index}`} />;
                }

                const dayNumber = parseDateKey(key).getDate();
                const isSelected = selectedDate === key;
                const isToday = todayKey === key;
                const record = records[key];

                const hasCompleted = record
                  ? Object.values(record).some((status) => status === "done")
                  : false;

                const hasMissed = record
                  ? Object.values(record).some((status) => status === "missed")
                  : false;

                return (
                  <button
                    key={key}
                    onClick={() => selectDate(key)}
                    aria-label={formatLongDate(key)}
                    aria-pressed={isSelected}
                    className={`relative flex min-h-11 flex-col items-center justify-center rounded-xl text-sm transition ${
                      isSelected
                        ? "bg-emerald-700 font-bold text-white shadow-sm"
                        : darkMode
                        ? "text-slate-200 hover:bg-slate-800"
                        : "text-slate-700 hover:bg-emerald-50"
                    } ${
                      isToday && !isSelected
                        ? "ring-2 ring-emerald-500 ring-inset"
                        : ""
                    }`}
                  >
                    {dayNumber}
                    <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
                      {hasCompleted && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSelected ? "bg-emerald-100" : "bg-emerald-500"
                          }`}
                        />
                      )}
                      {hasMissed && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSelected ? "bg-rose-200" : "bg-rose-500"
                          }`}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={`mt-4 flex flex-wrap gap-4 text-xs ${mutedText}`}>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Completed record
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Missed record
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full ring-2 ring-emerald-500" />
                Today
              </span>
            </div>

            <button
              onClick={() => {
                const today = dateKey(new Date());
                setSelectedDate(today);
                setVisibleMonth(monthKey(new Date()));
              }}
              className="mt-5 w-full rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950"
            >
              Go to today
            </button>
          </section>

          {/* Prayer tracker */}
          <section className={`rounded-2xl p-4 shadow-sm sm:p-6 ${panelClass}`}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Daily prayers</h2>
                <p className={`mt-1 text-sm ${mutedText}`}>
                  Update each prayer for the selected date.
                </p>
              </div>

              <button
                onClick={resetSelectedDay}
                title="Reset this day's records"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  darkMode
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <RotateCcw size={14} />
                Reset day
              </button>
            </div>

            <div className="mb-4 space-y-3">
              {PRAYERS.map((prayer) => (
                <PrayerCard
                  key={prayer.id}
                  prayer={prayer}
                  status={selectedRecord[prayer.id]}
                  onChange={(status) =>
                    changePrayerStatus(prayer.id, status)
                  }
                  darkMode={darkMode}
                />
              ))}
            </div>

            <div
              className={`mb-3 border-t pt-5 ${
                darkMode ? "border-slate-800" : "border-emerald-100"
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <Moon className="text-amber-500" size={19} />
                <div>
                  <h3 className="font-bold">Witr prayer</h3>
                  <p className={`text-xs ${mutedText}`}>
                    Wajib · Tracked separately
                  </p>
                </div>
              </div>

              <PrayerCard
                prayer={WITR}
                status={selectedRecord.witr}
                onChange={(status) => changePrayerStatus("witr", status)}
                darkMode={darkMode}
              />
            </div>

            <p className={`mt-4 text-xs leading-5 ${mutedText}`}>
              These are regular Namaz records. They do not add to or subtract
              from your Qaza Namaz totals.
            </p>
          </section>
        </div>

        {/* Statistics */}
        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Your statistics</h2>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Fard and Witr performance are reported separately.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <StatsPanel
              title="Weekly statistics"
              subtitle={
                selectedDate
                  ? `${formatLongDate(getWeekDates(selectedDate)[0])} – ${formatLongDate(
                      getWeekDates(selectedDate)[6]
                    )}`
                  : "Selected week"
              }
              stats={weeklyStats}
              darkMode={darkMode}
              panelClass={panelClass}
              mutedText={mutedText}
            />

            <StatsPanel
              title="Monthly statistics"
              subtitle={`${MONTHS[currentMonthDate.getMonth()]} ${currentMonthDate.getFullYear()}`}
              stats={monthlyStats}
              darkMode={darkMode}
              panelClass={panelClass}
              mutedText={mutedText}
            />
          </div>
        </section>

        <footer className={`mt-8 pb-3 text-center text-xs ${mutedText}`}>
          Track your progress with patience and consistency.
        </footer>
      </div>
    </main>
  );
}

function PrayerCard({ prayer, status, onChange, darkMode }) {
  const Icon = prayer.icon;

  const options = [
    {
      value: "pending",
      label: "Pending",
      icon: Circle,
      activeLight: "border-amber-300 bg-amber-50 text-amber-700",
      activeDark: "border-amber-700 bg-amber-950 text-amber-300",
    },
    {
      value: "done",
      label: "Done",
      icon: CheckCircle2,
      activeLight: "border-emerald-300 bg-emerald-50 text-emerald-700",
      activeDark: "border-emerald-700 bg-emerald-950 text-emerald-300",
    },
    {
      value: "missed",
      label: "Missed",
      icon: XCircle,
      activeLight: "border-rose-300 bg-rose-50 text-rose-700",
      activeDark: "border-rose-700 bg-rose-950 text-rose-300",
    },
  ];

  return (
    <div
      className={`rounded-2xl border p-3 sm:p-4 ${
        darkMode
          ? "border-slate-800 bg-slate-950/60"
          : "border-emerald-100 bg-[#fffef9]"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              prayer.id === "witr"
                ? darkMode
                  ? "bg-amber-950 text-amber-300"
                  : "bg-amber-50 text-amber-700"
                : darkMode
                ? "bg-emerald-950 text-emerald-300"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            <Icon size={19} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold">{prayer.name}</h3>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                  prayer.type === "Wajib"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : darkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {prayer.type}
              </span>
            </div>
            <p
              className={`mt-0.5 text-xs ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {prayer.time}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 text-xs font-semibold ${
            status === "done"
              ? "text-emerald-600 dark:text-emerald-400"
              : status === "missed"
              ? "text-rose-600 dark:text-rose-400"
              : darkMode
              ? "text-slate-400"
              : "text-amber-600"
          }`}
        >
          {status === "done"
            ? "Completed"
            : status === "missed"
            ? "Missed"
            : "Pending"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const OptionIcon = option.icon;
          const active = status === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                active
                  ? darkMode
                    ? option.activeDark
                    : option.activeLight
                  : darkMode
                  ? "border-slate-800 text-slate-400 hover:bg-slate-900"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <OptionIcon size={15} />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatsPanel({
  title,
  subtitle,
  stats,
  darkMode,
  panelClass,
  mutedText,
}) {
  const metricClass = darkMode
    ? "border-slate-800 bg-slate-950/60"
    : "border-emerald-100 bg-[#fffef9]";

  return (
    <div className={`rounded-2xl p-5 shadow-sm sm:p-6 ${panelClass}`}>
      <div className="mb-5">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className={`mt-1 text-xs ${mutedText}`}>{subtitle}</p>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-end justify-between gap-3">
          <span className={`text-sm ${mutedText}`}>Fard completion rate</span>
          <span className="text-xl font-bold text-emerald-600">
            {stats.completionRate}%
          </span>
        </div>

        <div
          className={`h-2.5 overflow-hidden rounded-full ${
            darkMode ? "bg-slate-800" : "bg-emerald-100"
          }`}
        >
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatMetric
          label="Fard completed"
          value={stats.completedFard}
          color="text-emerald-600 dark:text-emerald-400"
          className={metricClass}
          mutedText={mutedText}
        />
        <StatMetric
          label="Fard missed"
          value={stats.missedFard}
          color="text-rose-600 dark:text-rose-400"
          className={metricClass}
          mutedText={mutedText}
        />
        <StatMetric
          label="Witr completed"
          value={stats.completedWitr}
          color="text-amber-600 dark:text-amber-400"
          className={metricClass}
          mutedText={mutedText}
        />
        <StatMetric
          label="Witr missed"
          value={stats.missedWitr}
          color="text-rose-600 dark:text-rose-400"
          className={metricClass}
          mutedText={mutedText}
        />
      </div>

      <p className={`mt-4 text-xs ${mutedText}`}>
        Days with saved entries: {stats.recordedDays}
      </p>
    </div>
  );
}

function StatMetric({ label, value, color, className, mutedText }) {
  return (
    <div className={`rounded-xl border p-4 ${className}`}>
      <p className={`text-xs ${mutedText}`}>{label}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
