"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserEmail(user.email || "");

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-slate-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ================= HEADER ================= */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

          {/* FULL INSTAVIEW LOGO */}
          <a
            href="/dashboard"
            className="flex items-center"
          >
            <img
              src="/logo-full.png"
              alt="InstaView"
              className="h-auto w-[180px] object-contain sm:w-[210px]"
            />
          </a>

          {/* NAVIGATION */}
          <nav className="flex items-center gap-5">

            <a
              href="/dashboard"
              className="text-sm font-medium text-slate-700 transition hover:text-slate-950"
            >
              Dashboard
            </a>

            <a
              href="/profile"
              className="text-sm font-medium text-slate-700 transition hover:text-slate-950"
            >
              Edit Profile
            </a>

            <a
              href="/profile"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              View Profile
            </a>

            <button
              onClick={handleLogout}
              className="text-sm font-medium text-slate-700 transition hover:text-slate-950"
            >
              Logout
            </button>

          </nav>
        </div>
      </header>

      {/* ================= DASHBOARD CONTENT ================= */}
      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome to InstaView
          </h1>

          <p className="mt-2 text-slate-500">
            Track, analyze and understand your profile visitors.
          </p>

          {userEmail && (
            <p className="mt-1 text-sm text-slate-400">
              {userEmail}
            </p>
          )}
        </div>

        {/* ================= PROFILE CARD ================= */}
        <div className="grid gap-6 md:grid-cols-3">

          {/* Profile */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900">
              Your Profile
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Manage your public InstaView profile.
            </p>

            <div className="mt-6">

              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={profile.display_name || "Profile"}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-2xl font-semibold text-white">
                  {profile?.display_name?.charAt(0)?.toUpperCase() || "I"}
                </div>
              )}

              <h3 className="mt-4 text-xl font-semibold text-slate-900">
                {profile?.display_name || "Your Name"}
              </h3>

              {profile?.username && (
                <p className="mt-1 text-sm text-slate-500">
                  @{profile.username}
                </p>
              )}
            </div>

            <a
              href="/profile"
              className="mt-6 block rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Edit Profile
            </a>

          </div>

          {/* Visitors */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900">
              Profile Visits
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              See activity on your public profile.
            </p>

            <div className="mt-8">
              <div className="text-4xl font-bold text-slate-900">
                0
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Profile visits
              </p>
            </div>

          </div>

          {/* Account */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900">
              Account
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your InstaView account information.
            </p>

            <div className="mt-6">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Email
              </p>

              <p className="mt-1 break-all text-sm text-slate-700">
                {userEmail}
              </p>

            </div>

            <button
              onClick={handleLogout}
              className="mt-6 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Logout
            </button>

          </div>

        </div>

        {/* ================= PUBLIC PROFILE ================= */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Your Public Profile
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Share your InstaView profile and start understanding your
                audience.
              </p>

              {profile?.username && (
                <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/${profile.username}`
                    : `/${profile.username}`}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">

              <a
                href="/profile"
                className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                View Profile
              </a>

              <a
                href="/profile"
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Edit Profile
              </a>

            </div>

          </div>

        </div>

        {/* ================= HOW IT WORKS ================= */}
        <div className="mt-8">

          <h2 className="text-2xl font-bold text-slate-900">
            How InstaView Works
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-2xl font-bold text-slate-900">
                01
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                Share Your Profile
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Add your InstaView link to your social media profile,
                bio or campaigns.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-2xl font-bold text-slate-900">
                02
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                Track Visitors
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Understand how people interact with your public
                InstaView profile.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-2xl font-bold text-slate-900">
                03
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                Analyze & Engage
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Turn visitor activity into useful audience insights
                and better engagement opportunities.
              </p>
            </div>

          </div>

        </div>

      </section>

    </main>
  );
}