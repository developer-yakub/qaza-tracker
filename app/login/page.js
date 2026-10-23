
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.replace("/");
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 text-4xl">🕌</div>

        <h1 className="text-2xl font-bold text-slate-900">
          Namaz Tracker
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Sign in to save and sync your prayer progress.
        </p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-8 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        {error && (
          <p className="mt-4 break-words text-sm text-red-600">
            {error}
          </p>
        )}

        <p className="mt-6 text-xs text-slate-400">
          Your prayer records belong to your account.
        </p>
      </div>
    </main>
  );
}
