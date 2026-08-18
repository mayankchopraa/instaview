"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserEmail("");
        setUsername("");
        setLoading(false);
        return;
      }

      setUserEmail(user.email || "");

      const { data: profile } = await supabase
        .from("Profiles")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();

      setUsername(profile?.username || "");
    } catch (error) {
      console.error("Error loading user:", error);
      setUserEmail("");
      setUsername("");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  /*
   * Logged-in user:
   * - If username exists → public profile /username
   * - If username doesn't exist → profile editor /profile
   *
   * Logged-out user:
   * - Go to signup
   */
  const profileLink = userEmail
    ? username
      ? `/${username}`
      : "/profile"
    : "/signup";

  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* ========================================================= */}
      {/* HEADER */}
      {/* ========================================================= */}

      <header className="border-b border-slate-100 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              IV
            </div>

            <span className="text-xl font-bold tracking-tight text-slate-900">
              InstaView
            </span>
          </Link>

          {/* Navigation */}
          <div className="hidden items-center gap-8 md:flex">

            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              How It Works
            </a>

            <a
              href="#about"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              About
            </a>

          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">

            {!loading && userEmail ? (
              <>
                <span className="hidden text-sm text-slate-600 sm:block">
                  {userEmail}
                </span>

                <button
                  onClick={logout}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Logout
                </button>

                <Link
                  href={profileLink}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  View Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:block"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Get Started
                </Link>
              </>
            )}

          </div>
        </nav>
      </header>


      {/* ========================================================= */}
      {/* HERO */}
      {/* ========================================================= */}

      <section className="relative overflow-hidden">

        <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 text-center sm:pt-28">

          {/* Small label */}
          <div className="mx-auto inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-medium text-slate-600">
            Understand your social audience
          </div>

          {/* Heading */}
          <h1 className="mx-auto mt-10 max-w-5xl text-5xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">

            Know who interacts with
            <br />

            <span className="text-slate-950">
              your
            </span>

            <br />

            <span className="text-slate-500">
              online presence.
            </span>

          </h1>

          {/* Description */}
          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
            Create your personal InstaView link and understand how visitors
            interact with your profile, links and content.
          </p>


          {/* ===================================================== */}
          {/* HERO BUTTONS */}
          {/* ===================================================== */}

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">

            {!loading && userEmail ? (

              /*
               * LOGGED-IN USER
               *
               * We NEVER show "Create Your Free Profile".
               * We show "View Profile".
               */
              <Link
                href={profileLink}
                className="rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                View Profile
              </Link>

            ) : (

              /*
               * LOGGED-OUT USER
               */
              <Link
                href="/signup"
                className="rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Create Your Free Profile
              </Link>

            )}

            <a
              href="#how-it-works"
              className="rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              See How It Works
            </a>

          </div>

        </div>

      </section>


      {/* ========================================================= */}
      {/* HOW IT WORKS */}
      {/* ========================================================= */}

      <section
        id="how-it-works"
        className="border-t border-slate-100 bg-slate-50"
      >

        <div className="mx-auto max-w-6xl px-6 py-24">

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Simple process
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              How InstaView Works
            </h2>

            <p className="mt-4 text-lg text-slate-600">
              Create your profile, share your link and understand how people
              interact with your online presence.
            </p>

          </div>


          <div className="mt-16 grid gap-8 md:grid-cols-4">

            {/* Step 1 */}
            <div className="rounded-2xl bg-white p-7 shadow-sm">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
                1
              </div>

              <h3 className="mt-6 text-lg font-bold text-slate-900">
                Create Account
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Sign up for free and create your InstaView profile in seconds.
              </p>

            </div>


            {/* Step 2 */}
            <div className="rounded-2xl bg-white p-7 shadow-sm">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
                2
              </div>

              <h3 className="mt-6 text-lg font-bold text-slate-900">
                Get Your Link
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Create your unique InstaView profile link to share with your
                audience.
              </p>

            </div>


            {/* Step 3 */}
            <div className="rounded-2xl bg-white p-7 shadow-sm">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
                3
              </div>

              <h3 className="mt-6 text-lg font-bold text-slate-900">
                Share Your Profile
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Add your InstaView link to Instagram, social media or anywhere
                you want people to find you.
              </p>

            </div>


            {/* Step 4 */}
            <div className="rounded-2xl bg-white p-7 shadow-sm">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
                4
              </div>

              <h3 className="mt-6 text-lg font-bold text-slate-900">
                Get Insights
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Understand how visitors interact with your profile and links.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================================= */}
      {/* FEATURES */}
      {/* ========================================================= */}

      <section
        id="features"
        className="bg-white"
      >

        <div className="mx-auto max-w-6xl px-6 py-24">

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Powerful tools
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything You Need
            </h2>

            <p className="mt-4 text-lg text-slate-600">
              Build your online presence and understand your audience better.
            </p>

          </div>


          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                👥
              </div>

              <h3 className="mt-6 text-lg font-bold text-slate-900">
                Visitor Tracking
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Understand when people visit your InstaView profile and monitor
                profile activity.
              </p>

            </div>


            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                🔄
              </div>

              <h3 className="mt-6 text-lg font-bold text-slate-900">
                Returning Visitors
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                See when visitors return to your profile and understand
                repeated interactions.
              </p>

            </div>


            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                👤
              </div>

              <h3 className="mt-6 text-lg font-bold text-slate-900">
                Visitor Identification
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Give visitors an opportunity to identify themselves and connect
                with you.
              </p>

            </div>


            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                🔔
              </div>

              <h3 className="mt-6 text-lg font-bold text-slate-900">
                Smart Notifications
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Stay informed about important interactions with your profile
                and content.
              </p>

            </div>


            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                📊
              </div>

              <h3 className="mt-6 text-lg font-bold text-slate-900">
                Advanced Analytics
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Explore your profile performance and learn more about your
                audience.
              </p>

            </div>


            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                🔗
              </div>

              <h3 className="mt-6 text-lg font-bold text-slate-900">
                Multiple Links
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Add and manage the important links you want your visitors to
                discover.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================================= */}
      {/* ABOUT */}
      {/* ========================================================= */}

      <section
        id="about"
        className="border-t border-slate-100 bg-slate-50"
      >

        <div className="mx-auto max-w-6xl px-6 py-24">

          <div className="rounded-3xl bg-slate-900 px-8 py-16 text-center sm:px-16">

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Start building your online presence today
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Create your InstaView profile, share your personal link and
              understand how your audience interacts with you.
            </p>

            <div className="mt-8">

              {!loading && userEmail ? (

                <Link
                  href={profileLink}
                  className="inline-flex rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  View Profile
                </Link>

              ) : (

                <Link
                  href="/signup"
                  className="inline-flex rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Create Your Free Profile
                </Link>

              )}

            </div>

          </div>

        </div>

      </section>


      {/* ========================================================= */}
      {/* FOOTER */}
      {/* ========================================================= */}

      <footer className="border-t border-slate-100 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
              IV
            </div>

            <span className="font-semibold text-slate-900">
              InstaView
            </span>

          </div>

          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} InstaView. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}