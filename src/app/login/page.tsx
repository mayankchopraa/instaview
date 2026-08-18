"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type OAuthProvider = "google" | "facebook" | "github";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] =
    useState<OAuthProvider | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * EMAIL + PASSWORD LOGIN
   */
  const handleLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const {
        data,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      if (!data.user) {
        setError("Login could not be completed.");
        return;
      }

      /*
       * Successful login
       */
      window.location.href = "/dashboard";

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /*
   * SOCIAL LOGIN
   */
  const handleOAuthLogin = async (
    provider: OAuthProvider
  ) => {
    setOauthLoading(provider);
    setError("");
    setMessage("");

    try {
      const redirectTo =
        `${window.location.origin}/dashboard`;

      const {
        error: oauthError,
      } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setOauthLoading(null);
      }

    } catch (err) {
      console.error(err);
      setError(
        "Unable to continue with this provider."
      );
      setOauthLoading(null);
    }
  };

  /*
   * MAGIC LINK
   */
  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const {
        error: magicLinkError,
      } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo:
            `${window.location.origin}/dashboard`,
        },
      });

      if (magicLinkError) {
        setError(magicLinkError.message);
        return;
      }

      setMessage(
        "Magic login link sent! Check your email."
      );

    } catch (err) {
      console.error(err);
      setError(
        "Unable to send the magic link."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * FORGOT PASSWORD
   */
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError(
        "Enter your email address first."
      );
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const {
        error: resetError,
      } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo:
            `${window.location.origin}/update-password`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage(
        "Password reset link sent. Check your email."
      );

    } catch (err) {
      console.error(err);
      setError(
        "Unable to send password reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">

      {/* HOME */}
      <div className="max-w-md mx-auto mb-6">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition"
        >
          ← Home
        </Link>
      </div>

      <div className="max-w-md mx-auto">

        {/* CARD */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">

          {/* LOGO */}
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
              IV
            </div>
          </div>

          {/* TITLE */}
          <div className="text-center mt-5">

            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back
            </h1>

            <p className="mt-2 text-slate-500">
              Login to your InstaView account
            </p>

          </div>

          {/* SOCIAL LOGIN */}
          <div className="mt-8 space-y-3">

            {/* GOOGLE */}
            <button
              type="button"
              onClick={() =>
                handleOAuthLogin("google")
              }
              disabled={oauthLoading !== null}
              className="w-full h-12 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium hover:bg-slate-50 transition disabled:opacity-50"
            >
              {oauthLoading === "google"
                ? "Connecting..."
                : "Continue with Google"}
            </button>

            {/* FACEBOOK */}
            <button
              type="button"
              onClick={() =>
                handleOAuthLogin("facebook")
              }
              disabled={oauthLoading !== null}
              className="w-full h-12 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium hover:bg-slate-50 transition disabled:opacity-50"
            >
              {oauthLoading === "facebook"
                ? "Connecting..."
                : "Continue with Facebook"}
            </button>

            {/* GITHUB */}
            <button
              type="button"
              onClick={() =>
                handleOAuthLogin("github")
              }
              disabled={oauthLoading !== null}
              className="w-full h-12 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium hover:bg-slate-50 transition disabled:opacity-50"
            >
              {oauthLoading === "github"
                ? "Connecting..."
                : "Continue with GitHub"}
            </button>

          </div>

          {/* DIVIDER */}
          <div className="flex items-center gap-4 my-7">

            <div className="flex-1 h-px bg-slate-200" />

            <span className="text-xs text-slate-400">
              OR
            </span>

            <div className="flex-1 h-px bg-slate-200" />

          </div>

          {/* EMAIL LOGIN */}
          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* EMAIL */}
            <div>

              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />

            </div>

            {/* PASSWORD */}
            <div>

              <div className="flex items-center justify-between mb-2">

                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900"
                >
                  Forgot password?
                </button>

              </div>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />

            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition disabled:opacity-50"
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>

          {/* MAGIC LINK */}
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={loading}
            className="w-full mt-4 h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Login with Magic Link
          </button>

          {/* ERROR */}
          {error && (
            <div className="mt-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {message && (
            <div className="mt-5 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {/* SIGNUP */}
          <div className="text-center mt-7 pt-6 border-t border-slate-100">

            <p className="text-sm text-slate-500">
              Don't have an account?
            </p>

            <Link
              href="/signup"
              className="inline-block mt-2 font-semibold text-slate-900 hover:underline"
            >
              Create your free account
            </Link>

          </div>

        </div>

        {/* FOOTER */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} InstaView
        </p>

      </div>

    </main>
  );
}