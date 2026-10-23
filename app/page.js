
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Clock3,
  CalendarCheck,
  History,
  ArrowRight,
  CheckCircle2,
  Circle,
  LayoutDashboard,
  ChartNoAxesCombined,
  CalendarDays,
  Sparkles,
} from "lucide-react";

const PRAYERS = [
  { id: "fajr", name: "Fajr", icon: Sunrise },
  { id: "zuhr", name: "Zuhr", icon: Sun },
  { id: "asr", name: "Asr", icon: Clock3 },
  { id: "maghrib", name: "Maghrib", icon: Sunset },
  { id: "isha", name: "Isha", icon: Moon },
];

function getToday() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [today, setToday] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setToday(getToday());
    setMounted(true);
  }, []);

  const page = darkMode
    ? "min-h-screen bg-slate-950 text-slate-100"
    : "min-h-screen bg-[#f8f7ef] text-slate-800";

  const card = darkMode
    ? "border border-slate-800 bg-slate-900"
    : "border border-emerald-100 bg-white";

  const muted = darkMode ? "text-slate-400" : "text-slate-500";

  return (
    <main className={page}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <LayoutDashboard size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Worship Dashboard
              </h1>
              <p className={`mt-1 text-sm ${muted}`}>
                Your personal prayer companion
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDarkMode((value) => !value)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              darkMode
                ? "border-slate-700 hover:bg-slate-800"
                : "border-emerald-100 bg-white hover:bg-emerald-50"
            }`}
          >
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            {darkMode ? "Light mode" : "Dark mode"}
          </button>
        </header>

        {/* Welcome banner */}
        <section className="relative mb-6 overflow-hidden rounded-3xl bg-emerald-800 p-6 text-white sm:p-8">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-emerald-50">
              <Sparkles size={15} />
              Your daily worship journey
            </div>

            <h2 className="text-3xl font-bold sm:text-4xl">
              Assalamu Alaikum
            </h2>

            <p className="mt-3 text-sm leading-6 text-emerald-100 sm:text-base">
              Stay consistent with your daily prayers and make steady progress
              with your Qaza tracker, one day at a time.
            </p>

            <p className="mt-5 text-sm font-medium text-emerald-100">
              {mounted ? today : "Your daily overview"}
            </p>

            <Link
              href="/namaz"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
            >
              Open Namaz Tracker
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="pointer-events-none absolute -right-10 -top-12 hidden h-64 w-64 items-center justify-center rounded-full border border-white/10 sm:flex">
            <div className="flex h-48 w-48 items-center justify-center rounded-full border border-white/10">
              <Moon size={100} strokeWidth={0.8} className="text-emerald-100/70" />
            </div>
          </div>
        </section>

        {/* Main tracker cards */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Your trackers</h2>
            <p className={`mt-1 text-sm ${muted}`}>
              Choose what you want to work on today.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Namaz */}
            <Link
              href="/namaz"
              className={`group rounded-2xl p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-6 ${card}`}
            >
              <div className="mb-5 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CalendarCheck size={25} />
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Daily tracking
                </span>
              </div>

              <h3 className="text-xl font-bold">Regular Namaz</h3>
              <p className={`mt-2 text-sm leading-6 ${muted}`}>
                Record your five daily Fard prayers, track Witr separately,
                and review your calendar and statistics.
              </p>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Go to Namaz Tracker
                </span>
                <ArrowRight
                  size={19}
                  className="text-emerald-700 transition group-hover:translate-x-1 dark:text-emerald-300"
                />
              </div>
            </Link>

            {/* Qaza */}
            <Link
              href="/qaza"
              className={`group rounded-2xl p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-6 ${card}`}
            >
              <div className="mb-5 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <History size={25} />
                </div>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  Progress tracking
                </span>
              </div>

              <h3 className="text-xl font-bold">Qaza Namaz</h3>
              <p className={`mt-2 text-sm leading-6 ${muted}`}>
                Manage outstanding Qaza prayers, record completed prayers,
                set targets, and use the Qaza date calculator.
              </p>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  Go to Qaza Tracker
                </span>
                <ArrowRight
                  size={19}
                  className="text-amber-700 transition group-hover:translate-x-1 dark:text-amber-300"
                />
              </div>
            </Link>
          </div>
        </section>

        {/* Daily prayer overview */}
        <section className={`mb-8 rounded-2xl p-5 shadow-sm sm:p-6 ${card}`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Daily prayer overview</h2>
              <p className={`mt-1 text-sm ${muted}`}>
                Your five daily Fard prayers
              </p>
            </div>

            <Link
              href="/namaz"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
            >
              Update records <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PRAYERS.map((prayer) => {
              const Icon = prayer.icon;

              return (
                <Link
                  key={prayer.id}
                  href="/namaz"
                  className={`rounded-xl border p-4 transition hover:border-emerald-300 ${
                    darkMode
                      ? "border-slate-800 bg-slate-950/50"
                      : "border-emerald-100 bg-[#fffef9]"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <Icon size={21} className="text-emerald-600" />
                    <Circle size={17} className={muted} />
                  </div>

                  <h3 className="font-bold">{prayer.name}</h3>
                  <p className={`mt-1 text-xs ${muted}`}>
                    Open to update
                  </p>
                </Link>
              );
            })}
          </div>

          <div
            className={`mt-4 flex items-center gap-3 rounded-xl p-4 ${
              darkMode ? "bg-amber-950/30" : "bg-amber-50"
            }`}
          >
            <Moon size={21} className="text-amber-600" />
            <div className="flex-1">
              <p className="font-semibold">Witr prayer</p>
              <p className={`mt-1 text-xs ${muted}`}>
                Tracked separately in your Namaz page.
              </p>
            </div>
            <Link
              href="/namaz"
              className="text-sm font-semibold text-amber-700 hover:underline dark:text-amber-300"
            >
              Track
            </Link>
          </div>
        </section>

        {/* Overview and quick links */}
        <section className="grid gap-5 md:grid-cols-2">
          <div className={`rounded-2xl p-5 shadow-sm sm:p-6 ${card}`}>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <ChartNoAxesCombined size={23} />
            </div>

            <h3 className="text-lg font-bold">Your progress</h3>
            <p className={`mt-2 text-sm leading-6 ${muted}`}>
              View your weekly and monthly prayer statistics in the Namaz
              tracker, and your completed and remaining Qaza totals in the
              Qaza tracker.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/namaz"
                className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Namaz statistics
              </Link>
              <Link
                href="/qaza"
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  darkMode
                    ? "border-slate-700 hover:bg-slate-800"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                Qaza progress
              </Link>
            </div>
          </div>

          <div className={`rounded-2xl p-5 shadow-sm sm:p-6 ${card}`}>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CalendarDays size={23} />
            </div>

            <h3 className="text-lg font-bold">Quick access</h3>
            <p className={`mt-2 text-sm leading-6 ${muted}`}>
              Jump directly to your trackers whenever you need to record
              a prayer or review past entries.
            </p>

            <div className="mt-5 space-y-2">
              <QuickLink
                href="/namaz"
                title="Record regular Namaz"
                darkMode={darkMode}
              />
              <QuickLink
                href="/qaza"
                title="Record completed Qaza"
                darkMode={darkMode}
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`mt-10 pb-4 text-center text-sm ${muted}`}>
          <div className="mb-2 flex items-center justify-center gap-2">
            <Moon size={16} className="text-emerald-600" />
            <span className="font-semibold">Namaz Tracker</span>
          </div>
          One step at a time. Stay consistent.
        </footer>
      </div>
    </main>
  );
}

function QuickLink({ href, title, darkMode }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition ${
        darkMode
          ? "border-slate-800 hover:bg-slate-800"
          : "border-emerald-100 hover:bg-emerald-50"
      }`}
    >
      {title}
      <ArrowRight size={16} className="text-emerald-600" />
    </Link>
  );
}
