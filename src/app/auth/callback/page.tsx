"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        /*
         * Wait briefly for Supabase to process
         * the authentication callback.
         */
        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );

        /*
         * Get the currently authenticated user.
         */
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        /*
         * Authentication failed
         */
        if (userError || !user) {
          console.error(
            "Authentication callback error:",
            userError
          );

          setError(
            "The verification or login link is invalid or has expired."
          );

          return;
        }

        /*
         * SOCIAL LOGIN
         *
         * Google, Facebook and GitHub users
         * can continue directly.
         */
        const providers = [
          "google",
          "facebook",
          "github",
        ];

        const provider =
          user.app_metadata?.provider;

        if (
          provider &&
          providers.includes(provider)
        ) {
          router.replace("/dashboard");
          router.refresh();
          return;
        }

        /*
         * EMAIL LOGIN / EMAIL VERIFICATION
         *
         * Check whether the email has been verified.
         */
        if (!user.email_confirmed_at) {
          setError(
            "Your email has not been verified yet. Please check your inbox and click the verification link."
          );

          /*
           * Sign out unverified users so they
           * cannot access the dashboard.
           */
          await supabase.auth.signOut();

          return;
        }

        /*
         * EMAIL VERIFIED
         */
        router.replace("/dashboard");
        router.refresh();

      } catch (err) {
        console.error(
          "Callback processing error:",
          err
        );

        setError(
          "Something went wrong. Please try again."
        );
      }
    };

    handleCallback();
  }, [router]);


  /*
   * ERROR SCREEN
   */
  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">

          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-2xl font-bold text-red-600">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Verification Failed
          </h1>

          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            {error}
          </p>

          <div className="mt-7 flex flex-col gap-3">

            <a
              href="/login"
              className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              Go to Login
            </a>

            <a
              href="/"
              className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back to Home
            </a>

          </div>

        </div>

      </main>
    );
  }


  /*
   * LOADING SCREEN
   */
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

      <div className="text-center">

        <div className="w-12 h-12 mx-auto rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />

        <h1 className="mt-6 text-xl font-bold text-slate-900">
          Verifying your account...
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Please wait while we complete your authentication.
        </p>

      </div>

    </main>
  );
}