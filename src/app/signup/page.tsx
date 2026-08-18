"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
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
        setLoggedIn(false);
        setUsername("");
        return;
      }

      setLoggedIn(true);

      const { data: profile } = await supabase
        .from("Profiles")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();

      setUsername(profile?.username || "");
    } catch (error) {
      console.error(error);
      setLoggedIn(false);
      setUsername("");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* HEADER */}
      <header className="border-b border-slate-100 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              IV
            </div>

            <span className="text-xl font-bold tracking-tight">
              InstaView
            </span>
          </Link>

          <div className="flex items-center gap-3">

            {!loading && loggedIn ? (
              <>
                <Link
                  href="/profile"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Edit Profile
                </Link>

                {username && (
                  <Link
                    href={`/${username}`}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View Profile
                  </Link>
                )}

                <button
                  onClick={logout}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:block"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Get Started
                </Link>
              </>
            )}

          </div>
        </nav>
      </header>


      {/* HERO */}
      <section className="overflow-hidden">

        <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 text-center sm:pt-28">

          <div className="mx-auto inline-flex rounded-full border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-medium text-slate-600">
            Understand your social audience
          </div>

          <h1 className="mx-auto mt-10 max-w-5xl text-5xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Know who interacts with your
            <span className="block text-slate-500">
              online presence.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
            Create your personal InstaView link and understand how visitors
            interact with your profile, links and content.
          </p>


          {/* MAIN BUTTON */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">

            {!loading && loggedIn ? (
              <>
                {/* EDIT PROFILE */}
                <Link
                  href="/profile"
                  className="rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white hover:bg-slate-800"
                >
                  Edit Profile
                </Link>

                {/* PUBLIC PROFILE */}
                {username && (
                  <Link
                    href={`/${username}`}
                    className="rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View Public Profile
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white hover:bg-slate-800"
                >
                  Create Your Free Profile
                </Link>

                <Link
                  href="/login"
                  className="rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Login
                </Link>
              </>
            )}

          </div>

        </div>
      </section>


      {/* HOW IT WORKS */}
      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-24">

          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Simple process
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              How InstaView Works
            </h2>

            <p className="mt-4 text-lg text-slate-600">
              Create your profile, share your link and understand your
              audience.
            </p>
          </div>


          <div className="mt-16 grid gap-8 md:grid-cols-4">

            {[
              ["1", "Create Account", "Sign up and create your InstaView account."],
              ["2", "Build Profile", "Add your photo, name, bio and important links."],
              ["3", "Share Your Link", "Share your unique InstaView profile with anyone."],
              ["4", "Get Insights", "Understand how visitors interact with your profile."]
            ].map(([number, title, text]) => (
              <div
                key={number}
                className="rounded-2xl bg-white p-7 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
                  {number}
                </div>

                <h3 className="mt-6 text-lg font-bold">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {text}
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>


      {/* FEATURES */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">

          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Powerful tools
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Everything You Need
            </h2>

            <p className="mt-4 text-lg text-slate-600">
              Manage your profile and understand your audience.
            </p>
          </div>


          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {[
              ["👤", "Personal Profile", "Create and customize your own profile."],
              ["🔗", "Multiple Links", "Add all your important links in one place."],
              ["📊", "Profile Analytics", "Understand activity on your profile."],
              ["👥", "Visitor Tracking", "See activity from visitors."],
              ["📱", "Social Presence", "Share one simple link everywhere."],
              ["⚙️", "Easy Management", "Update your profile whenever you want."]
            ].map(([icon, title, text]) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                  {icon}
                </div>

                <h3 className="mt-6 text-lg font-bold">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {text}
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">

          {loggedIn ? (
            <>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Manage your InstaView profile
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                Update your profile, photo, bio and links whenever you want.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">

                <Link
                  href="/profile"
                  className="rounded-xl bg-slate-900 px-8 py-4 font-semibold text-white hover:bg-slate-800"
                >
                  Edit Profile
                </Link>

                {username && (
                  <Link
                    href={`/${username}`}
                    className="rounded-xl border border-slate-200 bg-white px-8 py-4 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View Public Profile
                  </Link>
                )}

              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Ready to create your InstaView profile?
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                Create your free profile and start building your online
                presence.
              </p>

              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-flex rounded-xl bg-slate-900 px-8 py-4 font-semibold text-white hover:bg-slate-800"
                >
                  Get Started Free
                </Link>
              </div>
            </>
          )}

        </div>
      </section>


      {/* FOOTER */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
              IV
            </div>

            <span className="font-semibold">
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