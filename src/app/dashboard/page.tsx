"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type AnalyticsRow = {
  id: string;
  created_at: string;
  user_id: string;
  viewer_id: string | null;
  profile_view: boolean;
  link_id: string | null;
};

type VisitorProfile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type ProfileLink = {
  id: string;
  title: string;
  url: string;
};

type OwnProfile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);

  const [visitors, setVisitors] = useState<
    Record<string, VisitorProfile>
  >({});

  const [profileLinks, setProfileLinks] = useState<
    Record<string, ProfileLink>
  >({});

  const [profile, setProfile] =
    useState<OwnProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  /*
   * LOAD DASHBOARD
   */
  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      /*
       * GET LOGGED-IN USER
       */
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserEmail(user.email || "");

      /*
       * LOAD OWN PROFILE
       */
      const {
        data: ownProfile,
        error: ownProfileError,
      } = await supabase
        .from("Profiles")
        .select(
          "user_id, username, display_name, bio, avatar_url"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (ownProfileError) {
        console.error(
          "Own profile error:",
          ownProfileError
        );
      }

      if (ownProfile) {
        setProfile(ownProfile);
      }

      /*
       * LOAD ANALYTICS
       */
      const {
        data: analyticsData,
        error: analyticsError,
      } = await supabase
        .from("Analytics")
        .select(
          "id, created_at, user_id, viewer_id, profile_view, link_id"
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (analyticsError) {
        console.error(
          "Analytics error:",
          analyticsError
        );

        setAnalytics([]);
      } else {
        const rows = analyticsData || [];

        setAnalytics(rows);

        /*
         * GET VISITOR IDS
         */
        const viewerIds = Array.from(
          new Set(
            rows
              .filter((item) => item.viewer_id)
              .map(
                (item) => item.viewer_id as string
              )
          )
        );

        /*
         * LOAD VISITOR PROFILES
         */
        if (viewerIds.length > 0) {
          const {
            data: visitorData,
            error: visitorError,
          } = await supabase
            .from("Profiles")
            .select(
              "user_id, username, display_name, avatar_url"
            )
            .in("user_id", viewerIds);

          if (visitorError) {
            console.error(
              "Visitor profiles error:",
              visitorError
            );
          }

          if (visitorData) {
            const visitorMap: Record<
              string,
              VisitorProfile
            > = {};

            visitorData.forEach((visitor) => {
              visitorMap[visitor.user_id] =
                visitor;
            });

            setVisitors(visitorMap);
          }
        }

        /*
         * GET LINK IDS
         */
        const linkIds = Array.from(
          new Set(
            rows
              .filter((item) => item.link_id)
              .map(
                (item) => item.link_id as string
              )
          )
        );

        /*
         * LOAD LINKS
         */
        if (linkIds.length > 0) {
          const {
            data: linksData,
            error: linksError,
          } = await supabase
            .from("Links")
            .select("id, title, url")
            .in("id", linkIds);

          if (linksError) {
            console.error(
              "Links error:",
              linksError
            );
          }

          if (linksData) {
            const linkMap: Record<
              string,
              ProfileLink
            > = {};

            linksData.forEach((link) => {
              linkMap[link.id] = link;
            });

            setProfileLinks(linkMap);
          }
        }
      }
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ANALYTICS
   */

  const profileViews = analytics.filter(
    (item) => item.profile_view === true
  ).length;

  const linkClicks = analytics.filter(
    (item) =>
      item.profile_view === false &&
      item.link_id
  ).length;

  const totalInteractions =
    profileViews + linkClicks;

  /*
   * IDENTIFIED VISITORS
   */
  const identifiedViewerIds = Array.from(
    new Set(
      analytics
        .filter(
          (item) =>
            item.profile_view === true &&
            item.viewer_id
        )
        .map(
          (item) => item.viewer_id as string
        )
    )
  );

  const identifiedVisitors =
    identifiedViewerIds.length;

  /*
   * ANONYMOUS VISITS
   */
  const anonymousViews = analytics.filter(
    (item) =>
      item.profile_view === true &&
      !item.viewer_id
  ).length;

  /*
   * RETURNING VISITORS
   */
  const viewerVisitCounts: Record<
    string,
    number
  > = {};

  analytics
    .filter(
      (item) =>
        item.profile_view === true &&
        item.viewer_id
    )
    .forEach((item) => {
      const id =
        item.viewer_id as string;

      viewerVisitCounts[id] =
        (viewerVisitCounts[id] || 0) + 1;
    });

  const returningVisitors =
    Object.values(
      viewerVisitCounts
    ).filter(
      (count) => count > 1
    ).length;

  /*
   * CLICK RATE
   */
  const clickRate =
    profileViews > 0
      ? (
          (linkClicks / profileViews) *
          100
        ).toFixed(1)
      : "0.0";

  /*
   * TOP LINKS
   */
  const linkStats = analytics
    .filter(
      (item) =>
        item.profile_view === false &&
        item.link_id
    )
    .reduce<Record<string, number>>(
      (acc, item) => {
        const linkId =
          item.link_id as string;

        acc[linkId] =
          (acc[linkId] || 0) + 1;

        return acc;
      },
      {}
    );

  const topLinks = Object.entries(
    linkStats
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  /*
   * DATE FORMAT
   */
  function formatDate(date: string) {
    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  /*
   * PUBLIC PROFILE URL
   */
  const publicProfileUrl =
    profile?.username
      ? `${window.location.origin}/${profile.username}`
      : "";

  /*
   * COPY PROFILE LINK
   */
  async function copyProfileLink() {
    if (!publicProfileUrl) return;

    try {
      await navigator.clipboard.writeText(
        publicProfileUrl
      );

      setCopyMessage(
        "Profile link copied!"
      );

      setTimeout(() => {
        setCopyMessage("");
      }, 2500);
    } catch (error) {
      console.error(
        "Copy error:",
        error
      );
    }
  }

  /*
   * LOGOUT
   */
  async function logout() {
    await supabase.auth.signOut();

    window.location.href = "/login";
  }

  /*
   * LOADING
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">

          <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-slate-600">
            Loading dashboard...
          </p>

        </div>
      </main>
    );
  }

  /*
   * DASHBOARD
   */
  return (
    <main className="min-h-screen bg-slate-50">

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200">

        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">

          <div>

            <Link
              href="/"
              className="text-2xl font-bold text-slate-900"
            >
              <img
  src="/logo-full.png"
  alt="InstaView"
  className="h-auto w-[170px] object-contain sm:w-[198px]"
/>
            </Link>

          </div>

          <div className="flex gap-3 flex-wrap">

            {profile?.username && (
              <Link
                href={`/${profile.username}`}
                target="_blank"
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
              >
                View Profile
              </Link>
            )}

            <Link
              href="/profile"
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Edit Profile
            </Link>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg border border-red-200 bg-white text-red-600 text-sm font-medium hover:bg-red-50"
            >
              Logout
            </button>

          </div>

        </div>

      </header>

      {/* MAIN */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* TITLE */}
        <div className="mb-8">

          <h1 className="text-3xl font-bold text-slate-900">
            Analytics Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Understand who interacts with your profile.
          </p>

        </div>

        {/* PUBLIC PROFILE LINK */}
        <section className="mb-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>

              <h2 className="text-lg font-bold text-slate-900">
                Your Live Profile
              </h2>

              {profile?.username ? (
                <>
                  <p className="text-sm text-slate-500 mt-1">
                    Share this link with anyone.
                  </p>

                  <div className="mt-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 break-all">
                    {publicProfileUrl}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 mt-1">
                  You haven't created your public profile yet.
                </p>
              )}

            </div>

            <div className="flex gap-3 shrink-0">

              {profile?.username ? (
                <>
                  <Link
                    href={`/${profile.username}`}
                    target="_blank"
                    className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                  >
                    View Profile
                  </Link>

                  <button
                    onClick={copyProfileLink}
                    className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
                  >
                    Copy Link
                  </button>
                </>
              ) : (
                <Link
                  href="/profile"
                  className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                >
                  Create Profile
                </Link>
              )}

            </div>

          </div>

          {copyMessage && (
            <div className="mt-4 text-sm font-medium text-green-600">
              {copyMessage}
            </div>
          )}

        </section>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Profile Views
            </p>

            <p className="text-4xl font-bold text-slate-900 mt-2">
              {profileViews}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Total profile visits
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Identified Visitors
            </p>

            <p className="text-4xl font-bold text-slate-900 mt-2">
              {identifiedVisitors}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Logged-in visitors
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Anonymous Visits
            </p>

            <p className="text-4xl font-bold text-slate-900 mt-2">
              {anonymousViews}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Visitors without accounts
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Link Clicks
            </p>

            <p className="text-4xl font-bold text-slate-900 mt-2">
              {linkClicks}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Total link interactions
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Returning Visitors
            </p>

            <p className="text-4xl font-bold text-slate-900 mt-2">
              {returningVisitors}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Logged-in users returning
            </p>
          </div>

        </div>

        {/* SECONDARY STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Click Rate
            </p>

            <p className="text-3xl font-bold text-slate-900 mt-2">
              {clickRate}%
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Link clicks compared with profile views
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Total Activity
            </p>

            <p className="text-3xl font-bold text-slate-900 mt-2">
              {totalInteractions}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Views + link clicks
            </p>

          </div>

        </div>

        {/* WHO VIEWED PROFILE */}
        <section className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm">

          <div className="p-6 border-b border-slate-200">

            <h2 className="text-lg font-bold text-slate-900">
              Who Viewed Your Profile
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Logged-in visitors are shown by their InstaView profile.
              Anonymous visitors are shown separately.
            </p>

          </div>

          <div className="divide-y divide-slate-100">

            {analytics.filter(
              (item) =>
                item.profile_view === true
            ).length === 0 ? (

              <div className="p-10 text-center text-slate-500">
                No profile views yet.
              </div>

            ) : (

              analytics
                .filter(
                  (item) =>
                    item.profile_view === true
                )
                .slice(0, 20)
                .map((item) => {

                  const visitor =
                    item.viewer_id
                      ? visitors[item.viewer_id]
                      : null;

                  return (
                    <div
                      key={item.id}
                      className="px-6 py-5 flex items-center justify-between gap-4"
                    >

                      <div className="flex items-center gap-4 min-w-0">

                        {visitor?.avatar_url ? (

                          <img
                            src={visitor.avatar_url}
                            alt={
                              visitor.display_name ||
                              visitor.username ||
                              "Visitor"
                            }
                            className="w-11 h-11 rounded-full object-cover"
                          />

                        ) : (

                          <div className="w-11 h-11 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                            {visitor
                              ? "👤"
                              : "👻"}
                          </div>

                        )}

                        <div className="min-w-0">

                          {visitor ? (

                            <>
                              <p className="font-semibold text-slate-900 truncate">
                                {visitor.display_name ||
                                  visitor.username ||
                                  "InstaView User"}
                              </p>

                              {visitor.username && (
                                <p className="text-xs text-slate-500">
                                  @{visitor.username}
                                </p>
                              )}

                              <p className="text-xs text-slate-400 mt-1">
                                Viewed your profile
                              </p>
                            </>

                          ) : (

                            <>
                              <p className="font-semibold text-slate-900">
                                Anonymous Visitor
                              </p>

                              <p className="text-xs text-slate-500">
                                Visitor without an InstaView account
                              </p>

                              <p className="text-xs text-slate-400 mt-1">
                                Viewed your profile
                              </p>
                            </>

                          )}

                        </div>

                      </div>

                      <div className="text-right shrink-0">

                        <p className="text-xs text-slate-400">
                          {formatDate(
                            item.created_at
                          )}
                        </p>

                      </div>

                    </div>
                  );
                })

            )}

          </div>

        </section>

        {/* TOP LINKS + RECENT ACTIVITY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

          {/* TOP LINKS */}
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

                  {topLinks.map(
                    ([linkId, clicks], index) => {

                      const link =
                        profileLinks[linkId];

                      return (
                        <div
                          key={linkId}
                          className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100"
                        >

                          <div className="flex items-center gap-4 min-w-0">

                            <div className="w-9 h-9 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>

                            <div className="min-w-0">

                              <p className="font-medium text-slate-800">
                                {link?.title ||
                                  "Unknown Link"}
                              </p>

                              <p className="text-xs text-slate-400 truncate">
                                {link?.url ||
                                  linkId}
                              </p>

                            </div>

                          </div>

                          <div className="text-right shrink-0">

                            <p className="font-bold text-slate-900">
                              {clicks}
                            </p>

                            <p className="text-xs text-slate-400">
                              clicks
                            </p>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              )}

            </div>

          </section>

          {/* RECENT ACTIVITY */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">

            <div className="p-6 border-b border-slate-200">

              <h2 className="text-lg font-bold text-slate-900">
                Recent Activity
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Latest visitors and interactions
              </p>

            </div>

            <div className="divide-y divide-slate-100">

              {analytics.length === 0 ? (

                <div className="p-10 text-center text-slate-500">
                  No activity yet.
                </div>

              ) : (

                analytics
                  .slice(0, 10)
                  .map((item) => {

                    const visitor =
                      item.viewer_id
                        ? visitors[item.viewer_id]
                        : null;

                    const link =
                      item.link_id
                        ? profileLinks[
                            item.link_id
                          ]
                        : null;

                    return (
                      <div
                        key={item.id}
                        className="px-6 py-4 flex items-center justify-between gap-4"
                      >

                        <div className="flex items-center gap-3 min-w-0">

                          <div
                            className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
                              item.profile_view
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {item.profile_view
                              ? "👁"
                              : "🔗"}
                          </div>

                          <div className="min-w-0">

                            <p className="text-sm font-medium text-slate-800">

                              {item.profile_view ? (
                                visitor
                                  ? `${visitor.display_name || visitor.username || "InstaView User"} viewed your profile`
                                  : "Anonymous visitor viewed your profile"
                              ) : (
                                visitor
                                  ? `${visitor.display_name || visitor.username || "InstaView User"} clicked ${link?.title || "a link"}`
                                  : `Anonymous visitor clicked ${link?.title || "a link"}`
                              )}

                            </p>

                            {visitor?.username && (
                              <p className="text-xs text-slate-400">
                                @{visitor.username}
                              </p>
                            )}

                          </div>

                        </div>

                        <p className="text-xs text-slate-400 shrink-0">
                          {formatDate(
                            item.created_at
                          )}
                        </p>

                      </div>
                    );
                  })

              )}

            </div>

          </section>

        </div>

        {/* MANAGE PROFILE */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

            <div>

              <h2 className="text-lg font-bold text-slate-900">
                Manage Your Profile
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Update your name, bio, photo and profile links.
              </p>

            </div>

            <div className="flex gap-3">

              <Link
                href="/profile"
                className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Edit Profile
              </Link>

              {profile?.username && (
                <Link
                  href={`/${profile.username}`}
                  target="_blank"
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
                >
                  View Live Profile
                </Link>
              )}

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}