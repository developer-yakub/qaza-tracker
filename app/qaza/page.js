
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const PRAYERS = [
  { key: "fajr", label: "Fajr", arabic: "الفجر", type: "Fard" },
  { key: "zuhr", label: "Zuhr", arabic: "الظهر", type: "Fard" },
  { key: "asr", label: "Asr", arabic: "العصر", type: "Fard" },
  { key: "maghrib", label: "Maghrib", arabic: "المغرب", type: "Fard" },
  { key: "isha", label: "Isha", arabic: "العشاء", type: "Fard" },
  { key: "witr", label: "Witr", arabic: "الوتر", type: "Wajib" },
];

const EMPTY_COUNTS = {
  fajr: 0,
  zuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0,
  witr: 0,
};

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNumber(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.max(0, Math.floor(number))
    : 0;
}

function normalizeCounts(data = {}) {
  return Object.fromEntries(
    PRAYERS.map(({ key }) => [key, getNumber(data[key])])
  );
}

function formatDate(date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMonth(date) {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function getTodayString() {
  return dateKey(new Date());
}

export default function QazaPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [savingPrayer, setSavingPrayer] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Initialize dates in the browser to avoid Next.js prerender errors.
  const [todayKey, setTodayKey] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(null);

  const [records, setRecords] = useState({});
  const [targets, setTargets] = useState(EMPTY_COUNTS);
  const [darkMode, setDarkMode] = useState(false);
  const [showTargets, setShowTargets] = useState(false);

  // Qaza date calculator
  const [showCalculator, setShowCalculator] = useState(false);
  const [fromDate, setFromDate] = useState("2019-10-23");
  const [toDate, setToDate] = useState("2026-10-23");

  const [selectedPrayers, setSelectedPrayers] = useState({
    fajr: true,
    zuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
    witr: true,
  });

  const [dayAdjustment, setDayAdjustment] = useState("0");

  useEffect(() => {
    const now = new Date();

    setTodayKey(dateKey(now));
    setSelectedDate(now);
    setVisibleMonth(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
  }, []);

  const recordCollection = useCallback(
    (uid) => collection(db, "users", uid, "qazaRecords"),
    []
  );

  const settingsRef = useCallback(
    (uid) => doc(db, "users", uid, "settings", "qazaTracker"),
    []
  );

  const loadData = useCallback(async () => {
    if (!user) {
      setRecords({});
      setTargets(EMPTY_COUNTS);
      setDarkMode(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [recordsSnapshot, settingsSnapshot] = await Promise.all([
        getDocs(recordCollection(user.uid)),
        getDoc(settingsRef(user.uid)),
      ]);

      const nextRecords = {};

      recordsSnapshot.forEach((recordDoc) => {
        nextRecords[recordDoc.id] = normalizeCounts(
          recordDoc.data()
        );
      });

      setRecords(nextRecords);

      if (settingsSnapshot.exists()) {
        const settings = settingsSnapshot.data();

        setTargets(normalizeCounts(settings.targets || {}));
        setDarkMode(Boolean(settings.darkMode));
      } else {
        setTargets(EMPTY_COUNTS);
        setDarkMode(false);
      }
    } catch (err) {
      console.error("Failed to load Qaza data:", err);
      setError(
        "Could not load data. Check your connection and Firestore rules."
      );
    } finally {
      setLoading(false);
    }
  }, [user, recordCollection, settingsRef]);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user, loadData]);

  const selectedKey = selectedDate
    ? dateKey(selectedDate)
    : null;

  const selectedCounts = useMemo(
    () =>
      selectedKey
        ? records[selectedKey] || EMPTY_COUNTS
        : EMPTY_COUNTS,
    [records, selectedKey]
  );

  const totals = useMemo(() => {
    const result = { ...EMPTY_COUNTS };

    Object.values(records).forEach((record) => {
      PRAYERS.forEach(({ key }) => {
        result[key] += getNumber(record[key]);
      });
    });

    return result;
  }, [records]);

  const totalRecorded = PRAYERS.reduce(
    (sum, prayer) => sum + totals[prayer.key],
    0
  );

  const totalTarget = PRAYERS.reduce(
    (sum, prayer) => sum + getNumber(targets[prayer.key]),
    0
  );

  const totalRemaining = PRAYERS.reduce(
    (sum, prayer) =>
      sum +
      Math.max(
        0,
        getNumber(targets[prayer.key]) -
          getNumber(totals[prayer.key])
      ),
    0
  );

  // Inclusive date calculation using UTC.
  const calculatorDays = useMemo(() => {
    if (!fromDate || !toDate) return 0;

    const [fy, fm, fd] = fromDate.split("-").map(Number);
    const [ty, tm, td] = toDate.split("-").map(Number);

    const start = Date.UTC(fy, fm - 1, fd);
    const end = Date.UTC(ty, tm - 1, td);

    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      return 0;
    }

    return Math.floor((end - start) / 86400000) + 1;
  }, [fromDate, toDate]);

  const adjustedDays = Math.max(
    0,
    calculatorDays -
      Math.min(calculatorDays, getNumber(dayAdjustment))
  );

  const selectedPrayerCount = PRAYERS.filter(
    ({ key }) => selectedPrayers[key]
  ).length;

  const estimatedPrayers = adjustedDays * selectedPrayerCount;

  function toggleCalculatorPrayer(key) {
    setSelectedPrayers((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  }

  function selectAllCalculatorPrayers(value) {
    setSelectedPrayers(
      Object.fromEntries(
        PRAYERS.map(({ key }) => [key, value])
      )
    );
  }

  async function handleGoogleSignIn() {
    setError("");

    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      console.error(err);
      setError(err.message || "Google sign-in failed.");
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
      setRecords({});
      setTargets(EMPTY_COUNTS);
      setMessage("");
      setError("");
    } catch (err) {
      console.error(err);
      setError("Could not sign out. Please try again.");
    }
  }

  async function saveRecord(nextCounts) {
    if (!user || !selectedKey) return false;

    setError("");
    setMessage("");

    const normalized = normalizeCounts(nextCounts);
    const previousRecord = records[selectedKey];

    setRecords((previous) => ({
      ...previous,
      [selectedKey]: normalized,
    }));

    try {
      await setDoc(
        doc(db, "users", user.uid, "qazaRecords", selectedKey),
        {
          ...normalized,
          date: selectedKey,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage("Daily Qaza record saved.");
      return true;
    } catch (err) {
      console.error("Failed to save Qaza record:", err);

      setRecords((previous) => {
        const restored = { ...previous };

        if (previousRecord) {
          restored[selectedKey] = previousRecord;
        } else {
          delete restored[selectedKey];
        }

        return restored;
      });

      setError(
        "Could not save the record. Check your connection and Firestore rules."
      );

      return false;
    }
  }

  async function updatePrayer(key, amount) {
    if (!selectedKey) return;

    const nextCounts = {
      ...selectedCounts,
      [key]: Math.max(
        0,
        getNumber(selectedCounts[key]) + amount
      ),
    };

    await saveRecord(nextCounts);
  }

  // ADD QAZA: Increase only the selected prayer's overall target.
  async function addQazaToPrayer(key) {
    if (!user) {
      setError("Please sign in first.");
      return;
    }

    if (savingPrayer) return;

    setError("");
    setMessage("");
    setSavingPrayer(key);

    const previousTargets = targets;
    const nextTargets = {
      ...targets,
      [key]: getNumber(targets[key]) + 1,
    };

    // Update the screen immediately.
    setTargets(nextTargets);

    try {
      await setDoc(
        settingsRef(user.uid),
        {
          targets: nextTargets,
          darkMode,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const prayer = PRAYERS.find((item) => item.key === key);

      setMessage(`Added 1 Qaza to ${prayer?.label || key}.`);
    } catch (err) {
      console.error("Failed to add Qaza:", err);

      setTargets(previousTargets);
      setError(
        "Could not add Qaza. Please check your connection and try again."
      );
    } finally {
      setSavingPrayer(null);
    }
  }

  // Apply the calculator result to selected prayer targets.
  async function applyCalculatorToTargets() {
    if (!user) {
      setError("Please sign in first.");
      return;
    }

    if (calculatorDays <= 0 || selectedPrayerCount === 0) {
      setError("Choose a valid date range and at least one prayer.");
      return;
    }

    const previousTargets = targets;
    const nextTargets = { ...targets };

    PRAYERS.forEach(({ key }) => {
      if (selectedPrayers[key]) {
        nextTargets[key] = adjustedDays;
      }
    });

    setTargets(nextTargets);
    setError("");
    setMessage("");

    try {
      await setDoc(
        settingsRef(user.uid),
        {
          targets: nextTargets,
          darkMode,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setShowCalculator(false);
      setMessage("Qaza targets updated successfully.");
    } catch (err) {
      console.error("Failed to apply calculator:", err);
      setTargets(previousTargets);
      setError("Could not update targets. Please try again.");
    }
  }

  async function saveTargets() {
    if (!user) return;

    const nextTargets = normalizeCounts(targets);
    setError("");
    setMessage("");

    try {
      await setDoc(
        settingsRef(user.uid),
        {
          targets: nextTargets,
          darkMode,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setTargets(nextTargets);
      setShowTargets(false);
      setMessage("Targets saved.");
    } catch (err) {
      console.error(err);
      setError("Could not save targets. Check your Firestore rules.");
    }
  }

  async function toggleDarkMode() {
    const nextValue = !darkMode;
    const previousValue = darkMode;

    setDarkMode(nextValue);

    if (!user) return;

    try {
      await setDoc(
        settingsRef(user.uid),
        {
          targets: normalizeCounts(targets),
          darkMode: nextValue,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      setDarkMode(previousValue);
      setError("Could not save the theme preference.");
    }
  }

  async function resetSelectedDate() {
    if (!selectedKey) return;

    if (
      !window.confirm(
        `Reset all prayer counts for ${selectedKey}?`
      )
    ) {
      return;
    }

    await saveRecord(EMPTY_COUNTS);
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

  function selectCalendarDay(day) {
    if (!visibleMonth) return;

    setSelectedDate(
      new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
        day
      )
    );
  }

  function goToToday() {
    const now = new Date();

    setSelectedDate(now);
    setVisibleMonth(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );
  }

  const calendarDays = useMemo(() => {
    if (!visibleMonth) return [];

    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return [
      ...Array(firstDay).fill(null),
      ...Array.from(
        { length: daysInMonth },
        (_, index) => index + 1
      ),
    ];
  }, [visibleMonth]);

  const pageClass = darkMode
    ? "min-h-screen bg-slate-950 text-slate-100"
    : "min-h-screen bg-slate-50 text-slate-900";

  const panelClass = darkMode
    ? "rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  const mutedClass = darkMode
    ? "text-slate-400"
    : "text-slate-500";

  const inputClass = darkMode
    ? "w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500"
    : "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500";

  const buttonClass = darkMode
    ? "rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-800"
    : "rounded-xl border border-slate-200 px-4 py-2 hover:bg-slate-100";

  if (authLoading) {
    return (
      <main className={pageClass}>
        <div className="flex min-h-screen items-center justify-center">
          <p className={mutedClass}>Checking your sign-in...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={pageClass}>
        <div className="flex min-h-screen items-center justify-center p-5">
          <section className={`${panelClass} w-full max-w-md text-center`}>
            <div className="mb-4 text-5xl">🕌</div>
            <h1 className="text-3xl font-bold">Qaza Tracker</h1>

            <p className={`mt-3 ${mutedClass}`}>
              Sign in to track missed prayers and sync your records.
            </p>

            {error && (
              <p className="mt-4 break-words rounded-lg bg-red-100 p-3 text-sm text-red-800">
                {error}
              </p>
            )}

            <button
              onClick={handleGoogleSignIn}
              className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              Continue with Google
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={pageClass}>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-500">
              YOUR DAILY WORSHIP
            </p>
            <h1 className="mt-1 text-3xl font-bold">Qaza Tracker</h1>
            <p className={`mt-1 text-sm ${mutedClass}`}>
              Track your missed prayers, one day at a time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={toggleDarkMode} className={buttonClass}>
              {darkMode ? "☀️ Light mode" : "🌙 Dark mode"}
            </button>

            <button
              onClick={() => setShowTargets((value) => !value)}
              className={buttonClass}
            >
              Targets
            </button>

            <button onClick={handleSignOut} className={buttonClass}>
              Sign out
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
            {message}
          </div>
        )}

        {/* QAZA CALCULATOR LAUNCHER */}
        <section className={panelClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Qaza Date Calculator</h2>
              <p className={`mt-1 text-sm ${mutedClass}`}>
                Calculate missed prayers using a date range.
              </p>
            </div>

            <button
              onClick={() => setShowCalculator(true)}
              className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              Open calculator
            </button>
          </div>
        </section>

        {/* QAZA DATE CALCULATOR MODAL */}
        {showCalculator && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setShowCalculator(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="qaza-calculator-title"
              className={`mx-auto my-4 max-w-4xl rounded-3xl border p-5 sm:p-8 ${
                darkMode
                  ? "border-slate-700 bg-slate-900 text-slate-100"
                  : "border-slate-200 bg-white text-slate-900"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="qaza-calculator-title"
                    className="text-3xl font-bold"
                  >
                    Qaza Date Calculator
                  </h2>
                  <p className={`mt-2 ${mutedClass}`}>
                    Choose the period you want to calculate.
                  </p>
                </div>

                <button
                  onClick={() => setShowCalculator(false)}
                  className={`rounded-xl border px-4 py-2 text-2xl ${buttonClass}`}
                  aria-label="Close calculator"
                >
                  ×
                </button>
              </div>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-3 block font-medium">From date</span>
                  <input
                    type="date"
                    value={fromDate}
                    max={toDate || todayKey || undefined}
                    onChange={(event) => {
                      setFromDate(event.target.value);
                      setDayAdjustment("0");
                    }}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-3 block font-medium">To date</span>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    max={todayKey || undefined}
                    onChange={(event) => {
                      setToDate(event.target.value);
                      setDayAdjustment("0");
                    }}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-bold">
                  Select prayers to include
                </h3>

                <button
                  onClick={() =>
                    selectAllCalculatorPrayers(
                      !PRAYERS.every(({ key }) => selectedPrayers[key])
                    )
                  }
                  className="font-semibold text-emerald-500"
                >
                  {PRAYERS.every(({ key }) => selectedPrayers[key])
                    ? "Deselect all"
                    : "Select all"}
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {PRAYERS.map((prayer) => (
                  <label
                    key={prayer.key}
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition ${
                      selectedPrayers[prayer.key]
                        ? "border-emerald-500"
                        : darkMode
                          ? "border-slate-700"
                          : "border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPrayers[prayer.key]}
                      onChange={() => toggleCalculatorPrayer(prayer.key)}
                      className="h-5 w-5 accent-emerald-600"
                    />

                    <span>
                      <span className="block text-lg font-bold">
                        {prayer.label}
                      </span>
                      <span className={`block text-sm ${mutedClass}`}>
                        {prayer.type}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <div
                className={`mt-7 rounded-3xl p-6 ${
                  darkMode ? "bg-emerald-950/50" : "bg-emerald-50"
                }`}
              >
                <p className={mutedClass}>
                  Days in selected period (inclusive)
                </p>

                <p className="mt-2 text-4xl font-bold">
                  {adjustedDays.toLocaleString("en-IN")}
                </p>

                <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                  <span className={mutedClass}>Estimated prayers</span>
                  <span className="text-3xl font-bold text-emerald-500">
                    {estimatedPrayers.toLocaleString("en-IN")}
                  </span>
                </div>

                <p className={`mt-4 text-sm ${mutedClass}`}>
                  One Qaza per selected prayer per day.
                </p>

                <label className="mt-5 block">
                  <span className="mb-2 block text-sm font-medium">
                    Days when you did not miss prayers
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={calculatorDays}
                    value={dayAdjustment}
                    onChange={(event) => {
                      const raw = event.target.value;

                      if (raw === "") {
                        setDayAdjustment("");
                        return;
                      }

                      setDayAdjustment(
                        String(
                          Math.min(calculatorDays, getNumber(raw))
                        )
                      );
                    }}
                    onBlur={() => {
                      if (dayAdjustment === "") {
                        setDayAdjustment("0");
                      }
                    }}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="mt-7 flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => setShowCalculator(false)}
                  className={`rounded-xl border px-5 py-3 font-semibold ${buttonClass}`}
                >
                  Cancel
                </button>

                <button
                  onClick={applyCalculatorToTargets}
                  disabled={adjustedDays === 0 || selectedPrayerCount === 0}
                  className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply to targets
                </button>
              </div>

              <p className={`mt-6 text-sm leading-7 ${mutedClass}`}>
                Applying replaces the target for each selected prayer with
                the adjusted number of days. Unselected targets remain
                unchanged. Review your estimate before applying.
              </p>
            </div>
          </div>
        )}

        {/* TARGET SETTINGS */}
        {showTargets && (
          <section className={panelClass}>
            <h2 className="text-xl font-bold">Qaza targets</h2>
            <p className={`mt-1 text-sm ${mutedClass}`}>
              Set the target count for each prayer.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PRAYERS.map((prayer) => (
                <label key={prayer.key} className="space-y-2">
                  <span className="block font-medium">{prayer.label}</span>
                  <input
                    type="number"
                    min="0"
                    value={targets[prayer.key]}
                    onChange={(event) =>
                      setTargets((previous) => ({
                        ...previous,
                        [prayer.key]: getNumber(event.target.value),
                      }))
                    }
                    className={inputClass}
                  />
                </label>
              ))}
            </div>

            <button
              onClick={saveTargets}
              className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              Save targets
            </button>
          </section>
        )}

        {/* SUMMARY CARDS */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={panelClass}>
            <p className={`text-sm ${mutedClass}`}>Recorded Qaza prayers</p>
            <p className="mt-2 text-3xl font-bold">{totalRecorded}</p>
          </div>

          <div className={panelClass}>
            <p className={`text-sm ${mutedClass}`}>Total target</p>
            <p className="mt-2 text-3xl font-bold">{totalTarget}</p>
          </div>

          <div className={panelClass}>
            <p className={`text-sm ${mutedClass}`}>Target remaining</p>
            <p className="mt-2 text-3xl font-bold">{totalRemaining}</p>
          </div>

          <div className={panelClass}>
            <p className={`text-sm ${mutedClass}`}>Selected day</p>
            <p className="mt-2 text-xl font-bold">
              {selectedDate ? formatDate(selectedDate) : "Loading date..."}
            </p>
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          {/* CALENDAR */}
          <section className={panelClass}>
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => changeMonth(-1)}
                disabled={!visibleMonth}
                className={buttonClass}
                aria-label="Previous month"
              >
                ←
              </button>

              <h2 className="text-xl font-bold">
                {visibleMonth ? formatMonth(visibleMonth) : "Calendar"}
              </h2>

              <button
                onClick={() => changeMonth(1)}
                disabled={!visibleMonth}
                className={buttonClass}
                aria-label="Next month"
              >
                →
              </button>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-1 text-center text-sm">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day) => (
                  <div key={day} className={`py-2 font-semibold ${mutedClass}`}>
                    {day}
                  </div>
                )
              )}

              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`blank-${index}`} />;
                }

                const dayDate = new Date(
                  visibleMonth.getFullYear(),
                  visibleMonth.getMonth(),
                  day
                );

                const key = dateKey(dayDate);
                const isSelected = key === selectedKey;
                const isToday = key === todayKey;
                const hasRecords = Boolean(records[key]);

                const dayClass = isSelected
                  ? "bg-emerald-600 text-white"
                  : isToday
                    ? "border border-emerald-500"
                    : darkMode
                      ? "hover:bg-slate-800"
                      : "hover:bg-slate-100";

                return (
                  <button
                    key={key}
                    onClick={() => selectCalendarDay(day)}
                    className={`relative flex min-h-11 items-center justify-center rounded-lg ${dayClass}`}
                    aria-pressed={isSelected}
                    aria-label={`${day} ${formatMonth(visibleMonth)}`}
                  >
                    {day}
                    {hasRecords && (
                      <span
                        className={`absolute bottom-1 h-1 w-1 rounded-full ${
                          isSelected ? "bg-white" : "bg-emerald-500"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={goToToday}
              disabled={!todayKey}
              className={`mt-4 w-full ${buttonClass}`}
            >
              Go to today
            </button>
          </section>

          {/* DAILY QAZA COUNTERS + ADD QAZA BUTTON */}
          <section className={panelClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Daily Qaza counts</h2>
                <p className={`mt-1 text-sm ${mutedClass}`}>
                  {selectedDate ? formatDate(selectedDate) : "Loading date..."}
                </p>
              </div>

              <button onClick={resetSelectedDate} className={buttonClass}>
                Reset day
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {PRAYERS.map((prayer) => (
                <div
                  key={prayer.key}
                  className={`flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-5 ${
                    darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-2xl font-bold">{prayer.label}</h3>

                    <p className={`mt-1 ${mutedClass}`}>
                      {prayer.type}
                    </p>

                    <button
                      onClick={() => addQazaToPrayer(prayer.key)}
                      disabled={savingPrayer !== null}
                      className="mt-4 rounded-2xl bg-orange-100 px-5 py-3 font-semibold text-orange-700 transition hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingPrayer === prayer.key
                        ? "Adding..."
                        : "Add Qaza"}
                    </button>

                    <p className={`mt-2 text-sm ${mutedClass}`}>
                      Target: {getNumber(targets[prayer.key])}
                    </p>

                    <p className={`text-sm ${mutedClass}`}>
                      Recorded: {getNumber(totals[prayer.key])}
                    </p>

                    <p className={`text-sm font-medium ${mutedClass}`}>
                      Remaining:{" "}
                      {Math.max(
                        0,
                        getNumber(targets[prayer.key]) -
                          getNumber(totals[prayer.key])
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updatePrayer(prayer.key, -1)}
                      disabled={
                        !selectedKey ||
                        !selectedCounts[prayer.key]
                      }
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl disabled:cursor-not-allowed disabled:opacity-40 ${buttonClass}`}
                      aria-label={`Decrease ${prayer.label} daily count`}
                    >
                      −
                    </button>

                    <span className="w-8 text-center text-2xl font-bold tabular-nums">
                      {selectedCounts[prayer.key]}
                    </span>

                    <button
                      onClick={() => updatePrayer(prayer.key, 1)}
                      disabled={!selectedKey}
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-3xl text-white hover:bg-emerald-700 disabled:opacity-40"
                      aria-label={`Increase ${prayer.label} daily count`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              className={`mt-5 flex items-center justify-between rounded-xl p-4 ${
                darkMode ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <span className="font-semibold">Selected-day total</span>
              <span className="text-2xl font-bold">
                {PRAYERS.reduce(
                  (sum, prayer) =>
                    sum + getNumber(selectedCounts[prayer.key]),
                  0
                )}
              </span>
            </div>
          </section>
        </div>

        {/* PRAYER SUMMARY */}
        <section className={panelClass}>
          <h2 className="text-xl font-bold">Prayer summary</h2>
          <p className={`mt-1 text-sm ${mutedClass}`}>
            Recorded counts across all saved dates compared with your targets.
          </p>

          <div className="mt-4 space-y-4">
            {PRAYERS.map((prayer) => {
              const target = getNumber(targets[prayer.key]);
              const recorded = getNumber(totals[prayer.key]);
              const remaining = Math.max(0, target - recorded);

              const progress =
                target > 0
                  ? Math.min(100, Math.round((recorded / target) * 100))
                  : 0;

              return (
                <div key={prayer.key}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-medium">{prayer.label}</span>
                    <span className={`text-sm ${mutedClass}`}>
                      {recorded} recorded / {target} target / {remaining} remaining
                    </span>
                  </div>

                  <div
                    className={`h-2 overflow-hidden rounded-full ${
                      darkMode ? "bg-slate-800" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <footer className={`pb-4 text-center text-sm ${mutedClass}`}>
          Your records and targets are saved to your signed-in Firebase account.
        </footer>
      </div>
    </main>
  );
}
