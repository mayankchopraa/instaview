"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type OAuthProvider = "google" | "facebook" | "github";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] =
    useState<OAuthProvider | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * EMAIL SIGNUP
   */
  const handleSignup = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setMessage("");

    /*
     * CHECK NAME
     */
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    /*
     * CHECK EMAIL
     */
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    /*
     * CHECK PASSWORD
     */
    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    /*
     * CHECK PASSWORD MATCH
     */
    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * IMPORTANT:
       * After clicking the verification email,
       * Supabase will return the user to:
       *
       * /auth/callback
       */
      const redirectTo =
        `${window.location.origin}/auth/callback`;

      const {
        data,
        error: signupError,
      } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,

        options: {
          data: {
            full_name: name.trim(),
          },

          emailRedirectTo: redirectTo,
        },
      });

      /*
       * SIGNUP ERROR
       */
      if (signupError) {
        setError(signupError.message);
        return;
      }

      /*
       * EMAIL VERIFICATION REQUIRED
       *
       * When Supabase email confirmation is enabled,
       * there will be a user but no active session.
       */
      if (data.user && !data.session) {
        setMessage(
          "Account created! Please check your email and click the verification link to activate your InstaView account."
        );

        return;
      }

      /*
       * IF EMAIL CONFIRMATION IS DISABLED
       *
       * This keeps the code compatible with your
       * current Supabase configuration.
       */
      if (data.session) {
        window.location.href = "/dashboard";
        return;
      }

      /*
       * FALLBACK
       */
      setMessage(
        "Account created successfully. Please check your email."
      );

    } catch (err) {
      console.error(
        "Signup error:",
        err
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  /*
   * SOCIAL SIGNUP
   *
   * Google / Facebook / GitHub
   *
   * We are NOT changing these options.
   */
  const handleOAuthSignup = async (
    provider: OAuthProvider
  ) => {
    setOauthLoading(provider);
    setError("");
    setMessage("");

    try {
      /*
       * Social login returns through the same
       * authentication callback.
       */
      const redirectTo =
        `${window.location.origin}/auth/callback`;

      const {
        error: oauthError,
      } = await supabase.auth.signInWithOAuth({
        provider,

        options: {
          redirectTo,

          queryParams:
            provider === "google"
              ? {
                  access_type: "offline",
                  prompt: "select_account",
                }
              : undefined,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setOauthLoading(null);
      }

    } catch (err) {
      console.error(
        "OAuth signup error:",
        err
      );

      setError(
        "Unable to continue with this provider."
      );

      setOauthLoading(null);
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

            <img
  src="/logo-icon.png"
  alt="InstaView"
  className="h-auto w-[180px] object-contain sm:w-[210px]"
/>

          </div>


          {/* TITLE */}
          <div className="text-center mt-5">

            <h1 className="text-3xl font-bold text-slate-900">
              Create your account
            </h1>

            <p className="mt-2 text-slate-500">
              Start building your InstaView profile
            </p>

          </div>


          {/* SOCIAL SIGNUP */}
          <div className="mt-8 space-y-3">

            {/* GOOGLE */}
            <button
              type="button"
              onClick={() =>
                handleOAuthSignup("google")
              }
              disabled={
                oauthLoading !== null ||
                loading
              }
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
                handleOAuthSignup("facebook")
              }
              disabled={
                oauthLoading !== null ||
                loading
              }
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
                handleOAuthSignup("github")
              }
              disabled={
                oauthLoading !== null ||
                loading
              }
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


          {/* EMAIL SIGNUP */}
          <form
            onSubmit={handleSignup}
            className="space-y-5"
          >

            {/* NAME */}
            <div>

              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Your name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Your name"
                required
                autoComplete="name"
                className="w-full h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />

            </div>


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

              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />

            </div>


            {/* CONFIRM PASSWORD */}
            <div>

              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Enter password again"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />

            </div>


            {/* SIGNUP BUTTON */}
            <button
              type="submit"
              disabled={
                loading ||
                oauthLoading !== null
              }
              className="w-full h-12 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition disabled:opacity-50"
            >
              {loading
                ? "Creating account..."
                : "Create Account"}
            </button>

          </form>


          {/* ERROR */}
          {error && (
            <div className="mt-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}


          {/* SUCCESS */}
          {message && (
            <div className="mt-5 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">

              <p>
                {message}
              </p>

              <p className="mt-2 text-xs text-green-600">
                Check your spam or promotions folder if
                you don't see the email.
              </p>

              <Link
                href="/login"
                className="inline-block mt-3 font-semibold underline"
              >
                Go to Login
              </Link>

            </div>
          )}


          {/* LOGIN */}
          <div className="text-center mt-7 pt-6 border-t border-slate-100">

            <p className="text-sm text-slate-500">
              Already have an account?
            </p>

            <Link
              href="/login"
              className="inline-block mt-2 font-semibold text-slate-900 hover:underline"
            >
              Login to InstaView
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