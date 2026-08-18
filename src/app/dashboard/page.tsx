"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AnalyticsRow = {
  id: string;
  created_at: string;
  user_id: string;
  profile_view: boolean;
  link_id: string | null;
};

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserEmail(user.email || "");

      const { data, error } = await supabase
        .from("Analytics")
        .select("id, created_at, user_id, profile_view, link_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Analytics error:", error);
        setAnalytics([]);
      } else {
        setAnalytics(data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const profileViews = analytics.filter(
    (item) => item.profile_view === true
  ).length;

  const linkClicks = analytics.filter(
    (item) => item.profile_view === false && item.link_id
  ).length;

  const totalInteractions = profileViews + linkClicks;

  const clickRate =
    profileViews > 0
      ? ((linkClicks / profileViews) * 100).toFixed(1)
      : "0.0";

  const linkStats = analytics
    .filter((item) => item.profile_view === false && item.link_id)
    .reduce<Record<string, number>>((acc, item) => {
      const linkId = item.link_id as string;
      acc[linkId] = (acc[linkId] || 0) + 1;
      return acc;
    }, {});

  const topLinks = Object.entries(linkStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {userEmail}
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/profile"
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Edit Profile
            </a>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Profile Views</p>
            <p className="text-4xl font-bold text-slate-900 mt-2">
              {profileViews}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Total profile visits
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Link Clicks</p>
            <p className="text-4xl font-bold text-slate-900 mt-2">
              {linkClicks}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Total link interactions
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Click Rate</p>
            <p className="text-4xl font-bold text-slate-900 mt-2">
              {clickRate}%
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Clicks compared to profile views
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Activity</p>
            <p className="text-4xl font-bold text-slate-900 mt-2">
              {totalInteractions}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Views + link clicks
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                Top Links
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Your most clicked profile links
              </p>
            </div>

            <div className="p-6">
              {topLinks.length === 0 ? (
                <div className="py-10 text-center text-slate-500">
                  No link clicks yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {topLinks.map(([linkId, clicks], index) => (
                    <div
                      key={linkId}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium text-slate-800">
                            Link {index + 1}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {linkId}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          {clicks}
                        </p>
                        <p className="text-xs text-slate-400">
                          clicks
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                Recent Activity
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Latest profile activity
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {analytics.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  No activity yet.
                </div>
              ) : (
                analytics.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          item.profile_view
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {item.profile_view ? "👁" : "🔗"}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {item.profile_view
                            ? "Profile viewed"
                            : "Link clicked"}
                        </p>

                        {item.link_id && !item.profile_view && (
                          <p className="text-xs text-slate-400">
                            Link ID: {item.link_id}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Your Public Profile
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                View your public profile and share it with others.
              </p>
            </div>

            <a
              href="/profile"
              className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
            >
              Manage Profile
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}