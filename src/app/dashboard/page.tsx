"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ProfileViewRow = {
  id: string;
  profile_user_id: string;
  visitor_user_id: string | null;
  viewed_at: string;
};

type AnalyticsRow = {
  id: string;
  created_at: string;
  user_id: string;
  viewer_id: string | null;
  profile_view: boolean;
  link_id: string | null;
  share_link_id: string | null;
  interaction_type: string | null;
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

type ShareLink = {
  id: string;
  title: string;
  file_name: string;
  file_url: string;
};

type OwnProfile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type ActivityItem = {
  id: string;
  date: string;
  type: "profile" | "link" | "file";
  visitor_id: string | null;
  link_id: string | null;
  share_link_id: string | null;
};

export default function DashboardPage() {
  const [profileViewsData, setProfileViewsData] =
    useState<ProfileViewRow[]>([]);

  const [analytics, setAnalytics] =
    useState<AnalyticsRow[]>([]);

  const [visitors, setVisitors] =
    useState<Record<string, VisitorProfile>>({});

  const [profileLinks, setProfileLinks] =
    useState<Record<string, ProfileLink>>({});

  const [shareLinks, setShareLinks] =
    useState<Record<string, ShareLink>>({});

  const [profile, setProfile] =
    useState<OwnProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [copyMessage, setCopyMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // DATE RANGE FILTER
  const [dateRange, setDateRange] = useState<
    "all" | "today" | "yesterday" | "7days" | "30days" | "custom"
  >("all");

  const [customStartDate, setCustomStartDate] =
    useState("");

  const [customEndDate, setCustomEndDate] =
    useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setErrorMessage("");

      /*
       * CURRENT USER
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "Auth error:",
          userError
        );
      }

      if (!user) {
        window.location.href = "/login";
        return;
      }

      /*
       * OWN PROFILE
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
          "Profile error:",
          ownProfileError
        );
      }

      if (ownProfile) {
        setProfile(ownProfile);
      }

      /*
       * PROFILE VIEWS
       */
      const {
        data: profileViews,
        error: profileViewsError,
      } = await supabase
        .from("ProfileViews")
        .select(
          "id, profile_user_id, visitor_user_id, viewed_at"
        )
        .eq(
          "profile_user_id",
          user.id
        )
        .order("viewed_at", {
          ascending: false,
        });

      if (profileViewsError) {
        console.error(
          "ProfileViews error:",
          profileViewsError
        );

        setProfileViewsData([]);
      } else {
        setProfileViewsData(
          profileViews || []
        );
      }

      /*
       * ANALYTICS
       *
       * Includes share_link_id.
       */
      const {
        data: analyticsData,
        error: analyticsError,
      } = await supabase
        .from("Analytics")
        .select(
          "id, created_at, user_id, viewer_id, profile_view, link_id, share_link_id, interaction_type"
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
        setAnalytics(
          analyticsData || []
        );
      }

      /*
       * VISITOR IDS
       */
      const profileViewVisitorIds =
        (profileViews || [])
          .filter(
            (item) =>
              item.visitor_user_id
          )
          .map(
            (item) =>
              item.visitor_user_id as string
          );

      const analyticsVisitorIds =
        (analyticsData || [])
          .filter(
            (item) =>
              item.viewer_id
          )
          .map(
            (item) =>
              item.viewer_id as string
          );

      const visitorIds =
        Array.from(
          new Set([
            ...profileViewVisitorIds,
            ...analyticsVisitorIds,
          ])
        );

      /*
       * VISITOR PROFILES
       */
      if (visitorIds.length > 0) {
        const {
          data: visitorData,
          error: visitorError,
        } = await supabase
          .from("Profiles")
          .select(
            "user_id, username, display_name, avatar_url"
          )
          .in(
            "user_id",
            visitorIds
          );

        if (visitorError) {
          console.error(
            "Visitor error:",
            visitorError
          );
        }

        if (visitorData) {
          const visitorMap: Record<
            string,
            VisitorProfile
          > = {};

          visitorData.forEach(
            (visitor) => {
              visitorMap[
                visitor.user_id
              ] = visitor;
            }
          );

          setVisitors(
            visitorMap
          );
        }
      }

      /*
       * LINK IDS
       */
      const linkIds =
        Array.from(
          new Set(
            (analyticsData || [])
              .filter(
                (item) =>
                  item.interaction_type ===
                    "link_click" &&
                  item.link_id
              )
              .map(
                (item) =>
                  item.link_id as string
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
          .select(
            "id, title, url"
          )
          .in(
            "id",
            linkIds
          );

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

          linksData.forEach(
            (link) => {
              linkMap[
                link.id
              ] = link;
            }
          );

          setProfileLinks(
            linkMap
          );
        }
      }

      /*
       * SHARE LINK IDS
       *
       * These identify exactly which
       * brochure/file was clicked.
       */
      const shareLinkIds =
        Array.from(
          new Set(
            (analyticsData || [])
              .filter(
                (item) =>
                  item.interaction_type ===
                    "file_click" &&
                  item.share_link_id
              )
              .map(
                (item) =>
                  item.share_link_id as string
              )
          )
        );

      /*
       * LOAD SHARE LINKS
       */
      if (
        shareLinkIds.length > 0
      ) {
        const {
          data: shareData,
          error: shareError,
        } = await supabase
          .from("ShareLinks")
          .select(
            "id, title, file_name, file_url"
          )
          .in(
            "id",
            shareLinkIds
          );

        if (shareError) {
          console.error(
            "ShareLinks error:",
            shareError
          );
        }

        if (shareData) {
          const shareMap: Record<
            string,
            ShareLink
          > = {};

          shareData.forEach(
            (share) => {
              shareMap[
                share.id
              ] = share;
            }
          );

          setShareLinks(
            shareMap
          );
        }
      }
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );

      setErrorMessage(
        "Something went wrong while loading your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * DATE RANGE FILTER
   */
  function getDateKey(value: string | Date) {
    const date = value instanceof Date ? value : new Date(value);

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  }

  function getRangeDates() {
    const now = new Date();

    if (dateRange === "all") {
      return null;
    }

    if (dateRange === "custom") {
      if (!customStartDate || !customEndDate) {
        return null;
      }

      return {
        start: customStartDate,
        end: customEndDate,
      };
    }

    const start = new Date(now.getTime());
    const end = new Date(now.getTime());

    if (dateRange === "yesterday") {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (dateRange === "7days") {
      start.setDate(start.getDate() - 6);
    } else if (dateRange === "30days") {
      start.setDate(start.getDate() - 29);
    }

    return {
      start: getDateKey(start),
      end: getDateKey(end),
    };
  }

  const rangeDates = getRangeDates();

  const filteredProfileViewsData = useMemo(() => {
    if (!rangeDates) {
      return profileViewsData;
    }

    return profileViewsData.filter((item) => {
      const date = getDateKey(item.viewed_at);

      return (
        date >= rangeDates.start &&
        date <= rangeDates.end
      );
    });
  }, [
    profileViewsData,
    dateRange,
    customStartDate,
    customEndDate,
  ]);

  const filteredAnalytics = useMemo(() => {
    if (!rangeDates) {
      return analytics;
    }

    return analytics.filter((item) => {
      const date = getDateKey(item.created_at);

      return (
        date >= rangeDates.start &&
        date <= rangeDates.end
      );
    });
  }, [
    analytics,
    dateRange,
    customStartDate,
    customEndDate,
  ]);

  /*
   * PROFILE VIEWS
   */
  const profileViews =
    filteredProfileViewsData.length;

  /*
   * IDENTIFIED VISITORS
   */
  const identifiedViewerIds =
    Array.from(
      new Set(
        filteredProfileViewsData
          .filter(
            (item) =>
              item.visitor_user_id
          )
          .map(
            (item) =>
              item.visitor_user_id as string
          )
      )
    );

  const identifiedVisitors =
    identifiedViewerIds.length;

  /*
   * ANONYMOUS VIEWS
   */
  const anonymousViews =
    filteredProfileViewsData.filter(
      (item) =>
        !item.visitor_user_id
    ).length;

  /*
   * RETURNING VISITORS
   */
  const viewerVisitCounts: Record<
    string,
    number
  > = {};

  filteredProfileViewsData
    .filter(
      (item) =>
        item.visitor_user_id
    )
    .forEach((item) => {
      const id =
        item.visitor_user_id as string;

      viewerVisitCounts[id] =
        (viewerVisitCounts[id] ||
          0) + 1;
    });

  const returningVisitors =
    Object.values(
      viewerVisitCounts
    ).filter(
      (count) => count > 1
    ).length;

  /*
   * LINK CLICKS
   */
  const linkClicks =
    filteredAnalytics.filter(
      (item) =>
        item.interaction_type ===
        "link_click"
    ).length;

  /*
   * FILE CLICKS
   */
  const fileClicks =
    filteredAnalytics.filter(
      (item) =>
        item.interaction_type ===
        "file_click"
    ).length;

  /*
   * TOTAL CLICKS
   */
  const totalClicks =
    linkClicks +
    fileClicks;

  /*
   * CLICK RATE
   */
  const clickRate =
    profileViews > 0
      ? (
          (totalClicks /
            profileViews) *
          100
        ).toFixed(1)
      : "0.0";

  /*
   * TOP LINKS
   */
  const linkStats =
    filteredAnalytics
      .filter(
        (item) =>
          item.interaction_type ===
            "link_click" &&
          item.link_id
      )
      .reduce<
        Record<string, number>
      >((acc, item) => {
        const id =
          item.link_id as string;

        acc[id] =
          (acc[id] || 0) + 1;

        return acc;
      }, {});

  const topLinks =
    Object.entries(
      linkStats
    )
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(0, 5);

  /*
   * TOP FILES
   *
   * This tells the user exactly
   * which brochure/file was clicked.
   */
  const fileStats =
    filteredAnalytics
      .filter(
        (item) =>
          item.interaction_type ===
            "file_click" &&
          item.share_link_id
      )
      .reduce<
        Record<string, number>
      >((acc, item) => {
        const id =
          item.share_link_id as string;

        acc[id] =
          (acc[id] || 0) + 1;

        return acc;
      }, {});

  const topFiles =
    Object.entries(
      fileStats
    )
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(0, 5);

  /*
   * RECENT ACTIVITY
   */
  const recentActivity =
    useMemo<ActivityItem[]>(
      () => {
        const profileActivities: ActivityItem[] =
          filteredProfileViewsData.map(
            (item) => ({
              id: `profile-${item.id}`,
              date: item.viewed_at,
              type: "profile",
              visitor_id:
                item.visitor_user_id,
              link_id: null,
              share_link_id:
                null,
            })
          );

        const interactionActivities: ActivityItem[] =
          filteredAnalytics
            .filter(
              (item) =>
                item.interaction_type ===
                  "link_click" ||
                item.interaction_type ===
                  "file_click"
            )
            .map((item) => ({
              id: `interaction-${item.id}`,
              date: item.created_at,
              type:
                item.interaction_type ===
                "file_click"
                  ? "file"
                  : "link",
              visitor_id:
                item.viewer_id,
              link_id:
                item.link_id,
              share_link_id:
                item.share_link_id,
            }));

        return [
          ...profileActivities,
          ...interactionActivities,
        ]
          .sort(
            (a, b) =>
              new Date(
                b.date
              ).getTime() -
              new Date(
                a.date
              ).getTime()
          )
          .slice(0, 15);
      },
      [
        filteredProfileViewsData,
        filteredAnalytics,
      ]
    );

  /*
   * DATE FORMAT
   */
  function formatDate(
    date: string
  ) {
    return new Date(
      date
    ).toLocaleString(
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
   * COPY PROFILE LINK
   */
  async function copyProfileLink() {
    if (
      !profile?.username
    ) {
      return;
    }

    const url =
      `${window.location.origin}/${profile.username}`;

    try {
      await navigator.clipboard.writeText(
        url
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

    window.location.href =
      "/login";
  }

  /*
   * LOADING
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-[#E5E1FA] border-t-[#635BFF] rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-slate-600">
            Loading dashboard...
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* HEADER */}
      <header className="border-b border-[#E5E7EB] bg-white">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">

          <Link
            href="/dashboard"
            className="flex items-center"
          >
            <img
              src="/logo-full.png"
              alt="InstaView"
              className="h-auto w-[180px] object-contain"
            />
          </Link>

          <div className="flex items-center gap-3">

            {profile?.username && (
              <a
                href={`/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-lg bg-[#635BFF] px-6 text-sm font-semibold text-white transition hover:bg-[#5148E5]"
              >
                View Profile
              </a>
            )}

            <Link
              href="/profile"
              className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-lg border border-[#E5E1FA] bg-[#F7F6FF] px-6 text-sm font-semibold text-[#635BFF] transition hover:bg-[#EEEAFE] hover:border-[#635BFF]"
            >
              Edit Profile
            </Link>

            <button
              onClick={logout}
              className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-lg border border-[#E5E1FA] bg-white px-6 text-sm font-semibold text-[#635BFF] transition hover:bg-[#F7F6FF] hover:border-[#635BFF]"
            >
              Logout
            </button>

          </div>

        </div>

      </header>

      {/* MAIN */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-slate-900">
            Analytics Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Understand who interacts with your profile.
          </p>

        </div>

        {errorMessage && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* DATE RANGE FILTER */}
        <section className="mb-8 bg-white rounded-2xl border border-[#E5E1FA] shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Analytics by Date
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Choose a date range to view your analytics.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ["all", "All Dates"],
                ["today", "Today"],
                ["yesterday", "Yesterday"],
                ["7days", "Last 7 Days"],
                ["30days", "Last 30 Days"],
                ["custom", "Custom Range"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setDateRange(
                      value as
                        | "all"
                        | "today"
                        | "yesterday"
                        | "7days"
                        | "30days"
                        | "custom"
                    )
                  }
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                    dateRange === value
                      ? "bg-[#635BFF] text-white"
                      : "border border-[#E5E1FA] bg-[#F7F6FF] text-[#635BFF] hover:bg-[#EEEAFE] hover:border-[#635BFF]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {dateRange === "custom" && (
            <div className="mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    From
                  </label>

                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) =>
                      setCustomStartDate(e.target.value)
                    }
                    className="w-full h-11 rounded-lg border border-[#DCD8FF] px-3 text-sm text-slate-700 outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    To
                  </label>

                  <input
                    type="date"
                    value={customEndDate}
                    min={customStartDate || undefined}
                    onChange={(e) =>
                      setCustomEndDate(e.target.value)
                    }
                    className="w-full h-11 rounded-lg border border-[#DCD8FF] px-3 text-sm text-slate-700 outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/10"
                  />
                </div>
              </div>

              {customStartDate &&
                customEndDate &&
                customEndDate < customStartDate && (
                  <p className="mt-3 text-sm text-red-600">
                    The To date must be the same as or later than the From date.
                  </p>
                )}

              {rangeDates && (
                <p className="mt-3 text-xs text-slate-400">
                  Showing analytics from {rangeDates.start} to {rangeDates.end}.
                </p>
              )}
            </div>
          )}
        </section>

        {/* LIVE PROFILE */}
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
                    {typeof window !==
                    "undefined"
                      ? `${window.location.origin}/${profile.username}`
                      : `/${profile.username}`}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 mt-1">
                  You haven't created your public profile yet.
                </p>
              )}

            </div>

            <div className="flex gap-3 shrink-0">

              {profile?.username && (
                <>
                  <Link
                    href={`/${profile.username}`}
                    target="_blank"
                    className="px-5 py-2.5 rounded-lg bg-[#635BFF] text-white text-sm font-semibold transition hover:bg-[#5148E5]"
                  >
                    View Profile
                  </Link>

                  <button
                    onClick={
                      copyProfileLink
                    }
                    className="px-5 py-2.5 rounded-lg border border-[#E5E1FA] bg-[#F7F6FF] text-[#635BFF] text-sm font-semibold transition hover:bg-[#EEEAFE] hover:border-[#635BFF]"
                  >
                    Copy Link
                  </button>
                </>
              )}

            </div>

          </div>

          {copyMessage && (
            <div className="mt-4 text-sm font-medium text-green-600">
              {copyMessage}
            </div>
          )}

        </section>

        {/* STATS */}
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
              Link Clicks
            </p>

            <p className="text-4xl font-bold text-slate-900 mt-2">
              {linkClicks}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Website & social links
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              File Clicks
            </p>

            <p className="text-4xl font-bold text-slate-900 mt-2">
              {fileClicks}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Brochures & files opened
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
              Users who returned
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
              Links + files compared with profile views
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

            <p className="text-sm text-slate-500">
              Anonymous Views
            </p>

            <p className="text-3xl font-bold text-slate-900 mt-2">
              {anonymousViews}
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Visitors without an InstaView account
            </p>

          </div>

        </div>

        {/* WHO VIEWED */}
        <section className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm">

          <div className="p-6 border-b border-slate-200">

            <h2 className="text-lg font-bold text-slate-900">
              Who Viewed Your Profile
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              See who has visited your profile.
            </p>

          </div>

          <div className="divide-y divide-slate-100">

            {profileViewsData.length === 0 ? (

              <div className="p-10 text-center text-slate-500">
                No profile views yet.
              </div>

            ) : (

              profileViewsData
                .slice(0, 20)
                .map((item) => {

                  const visitor =
                    item.visitor_user_id
                      ? visitors[
                          item.visitor_user_id
                        ]
                      : null;

                  return (
                    <div
                      key={item.id}
                      className="px-6 py-5 flex items-center justify-between gap-4"
                    >

                      <div className="flex items-center gap-4 min-w-0">

                        {visitor?.avatar_url ? (

                          <img
                            src={
                              visitor.avatar_url
                            }
                            alt={
                              visitor.display_name ||
                              visitor.username ||
                              "Visitor"
                            }
                            className="w-11 h-11 rounded-full object-cover"
                          />

                        ) : (

                          <div className="w-11 h-11 shrink-0 rounded-full bg-slate-100 flex items-center justify-center">
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
                            </>

                          )}

                        </div>

                      </div>

                      <p className="text-xs text-slate-400 shrink-0">
                        {formatDate(
                          item.viewed_at
                        )}
                      </p>

                    </div>
                  );
                })

            )}

          </div>

        </section>

        {/* TOP LINKS + TOP FILES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

          {/* TOP LINKS */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">

            <div className="p-6 border-b border-slate-200">

              <h2 className="text-lg font-bold text-slate-900">
                Top Links
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Your most clicked links.
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
                    (
                      [linkId, clicks],
                      index
                    ) => {

                      const link =
                        profileLinks[
                          linkId
                        ];

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

                              {link?.url && (
                                <p className="text-xs text-slate-400 truncate">
                                  {link.url}
                                </p>
                              )}

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

          {/* TOP FILES */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">

            <div className="p-6 border-b border-slate-200">

              <h2 className="text-lg font-bold text-slate-900">
                Top Files
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                See exactly which brochures and files visitors opened.
              </p>

            </div>

            <div className="p-6">

              {topFiles.length === 0 ? (

                <div className="py-10 text-center text-slate-500">
                  No file clicks yet.
                </div>

              ) : (

                <div className="space-y-4">

                  {topFiles.map(
                    (
                      [shareId, clicks],
                      index
                    ) => {

                      const file =
                        shareLinks[
                          shareId
                        ];

                      return (
                        <div
                          key={shareId}
                          className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100"
                        >

                          <div className="flex items-center gap-4 min-w-0">

                            <div className="w-9 h-9 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>

                            <div className="min-w-0">

                              <p className="font-medium text-slate-800 truncate">
                                {file?.title ||
                                  file?.file_name ||
                                  "Unknown File"}
                              </p>

                              {file?.file_name && (
                                <p className="text-xs text-slate-400 truncate">
                                  {file.file_name}
                                </p>
                              )}

                            </div>

                          </div>

                          <div className="text-right shrink-0">

                            <p className="font-bold text-slate-900">
                              {clicks}
                            </p>

                            <p className="text-xs text-slate-400">
                              opens
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

        </div>

        {/* RECENT ACTIVITY */}
        <section className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm">

          <div className="p-6 border-b border-slate-200">

            <h2 className="text-lg font-bold text-slate-900">
              Recent Activity
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Latest profile views, link clicks and file opens.
            </p>

          </div>

          <div className="divide-y divide-slate-100">

            {recentActivity.length === 0 ? (

              <div className="p-10 text-center text-slate-500">
                No activity yet.
              </div>

            ) : (

              recentActivity.map(
                (item) => {

                  const visitor =
                    item.visitor_id
                      ? visitors[
                          item.visitor_id
                        ]
                      : null;

                  const link =
                    item.link_id
                      ? profileLinks[
                          item.link_id
                        ]
                      : null;

                  const file =
                    item.share_link_id
                      ? shareLinks[
                          item.share_link_id
                        ]
                      : null;

                  let activityText =
                    "viewed your profile";

                  let icon = "👁️";

                  if (
                    item.type ===
                    "link"
                  ) {
                    activityText =
                      `clicked ${
                        link?.title ||
                        "a link"
                      }`;

                    icon = "🔗";
                  }

                  if (
                    item.type ===
                    "file"
                  ) {
                    activityText =
                      `opened ${
                        file?.title ||
                        file?.file_name ||
                        "a file"
                      }`;

                    icon = "📄";
                  }

                  return (
                    <div
                      key={item.id}
                      className="px-6 py-4 flex items-center justify-between gap-4"
                    >

                      <div className="flex items-center gap-3 min-w-0">

                        <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center">
                          {icon}
                        </div>

                        <div className="min-w-0">

                          <p className="text-sm font-medium text-slate-800">

                            {visitor
                              ? `${
                                  visitor.display_name ||
                                  visitor.username ||
                                  "InstaView User"
                                } ${activityText}`
                              : `Anonymous visitor ${activityText}`}

                          </p>

                          {item.type ===
                            "file" &&
                            file?.file_name && (
                              <p className="text-xs text-slate-400 truncate mt-1">
                                {file.file_name}
                              </p>
                            )}

                          {visitor?.username && (
                            <p className="text-xs text-slate-400">
                              @{visitor.username}
                            </p>
                          )}

                        </div>

                      </div>

                      <p className="text-xs text-slate-400 shrink-0">
                        {formatDate(
                          item.date
                        )}
                      </p>

                    </div>
                  );
                }
              )

            )}

          </div>

        </section>

        {/* MANAGE PROFILE */}
        <section className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

            <div>

              <h2 className="text-lg font-bold text-slate-900">
                Manage Your Profile
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Update your profile, links and uploaded files.
              </p>

            </div>

            <div className="flex gap-3">

              <Link
                href="/profile"
                className="px-5 py-2.5 border border-[#E5E1FA] bg-[#F7F6FF] text-[#635BFF] rounded-lg text-sm font-semibold transition hover:bg-[#EEEAFE] hover:border-[#635BFF]"
              >
                Edit Profile
              </Link>

              {profile?.username && (
                <Link
                  href={`/${profile.username}`}
                  target="_blank"
                  className="px-5 py-2.5 bg-[#635BFF] text-white rounded-lg text-sm font-semibold transition hover:bg-[#5148E5]"
                >
                  View Live Profile
                </Link>
              )}

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}