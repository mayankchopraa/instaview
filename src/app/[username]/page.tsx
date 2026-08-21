"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Profile = {
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type ProfileLink = {
  id: string;
  title: string;
  url: string;
};

export default function PublicProfilePage() {
  const params = useParams();

  const username =
    typeof params?.username === "string"
      ? params.username
      : "";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) return;

    loadProfile();
  }, [username]);

  /*
   * LOAD PUBLIC PROFILE
   */
  const loadProfile = async () => {
    setLoading(true);
    setError("");

    try {
      /*
       * Find profile
       */
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("Profiles")
        .select(
          "user_id, username, display_name, bio, avatar_url"
        )
        .eq("username", username)
        .single();

      /*
       * Profile doesn't exist
       */
      if (profileError || !profileData) {
        setError("Profile not found.");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      /*
       * Load links
       */
      const {
        data: linksData,
        error: linksError,
      } = await supabase
        .from("Links")
        .select("id, title, url")
        .eq("user_id", profileData.user_id)
        .order("id", { ascending: true });

      if (!linksError && linksData) {
        setLinks(linksData);
      }

      /*
       * Record profile view
       */
      await recordProfileView(profileData.user_id);
    } catch (err) {
      console.error(
        "Error loading public profile:",
        err
      );

      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /*
   * RECORD PROFILE VIEW
   *
   * Logged-in visitor:
   * viewer_id = visitor's Supabase user ID
   *
   * Anonymous visitor:
   * viewer_id = null
   *
   * Profile owner viewing own profile:
   * not recorded
   */
  const recordProfileView = async (
    profileOwnerId: string
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      /*
       * Don't count owner viewing own profile
       */
      if (user && user.id === profileOwnerId) {
        return;
      }

      /*
       * Logged-in visitor
       */
      if (user) {
        const { error } = await supabase
          .from("Analytics")
          .insert({
            user_id: profileOwnerId,
            viewer_id: user.id,
            profile_view: true,
            link_id: null,
          });

        if (error) {
          console.error(
            "Profile view tracking error:",
            error
          );
        }

        return;
      }

      /*
       * Anonymous visitor
       */
      const { error } = await supabase
        .from("Analytics")
        .insert({
          user_id: profileOwnerId,
          viewer_id: null,
          profile_view: true,
          link_id: null,
        });

      if (error) {
        console.error(
          "Anonymous profile tracking error:",
          error
        );
      }
    } catch (error) {
      /*
       * Analytics failure should never
       * prevent profile from loading.
       */
      console.error(
        "Analytics tracking failed:",
        error
      );
    }
  };

  /*
   * RECORD LINK CLICK
   */
  const handleLinkClick = async (
    link: ProfileLink
  ) => {
    try {
      if (!profile) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      /*
       * Don't record owner clicking
       * own profile link
       */
      if (user && user.id === profile.user_id) {
        return;
      }

      /*
       * Logged-in visitor
       */
      if (user) {
        const { error } = await supabase
          .from("Analytics")
          .insert({
            user_id: profile.user_id,
            viewer_id: user.id,
            profile_view: false,
            link_id: link.id,
          });

        if (error) {
          console.error(
            "Link click tracking error:",
            error
          );
        }

        return;
      }

      /*
       * Anonymous visitor
       */
      const { error } = await supabase
        .from("Analytics")
        .insert({
          user_id: profile.user_id,
          viewer_id: null,
          profile_view: false,
          link_id: link.id,
        });

      if (error) {
        console.error(
          "Anonymous link tracking error:",
          error
        );
      }
    } catch (error) {
      console.error(
        "Link tracking failed:",
        error
      );
    }
  };

  /*
   * LOADING
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />

          <div className="mt-4 text-slate-600 text-sm">
            Loading profile...
          </div>
        </div>
      </main>
    );
  }

  /*
   * PROFILE NOT FOUND
   */
  if (error || !profile) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-3xl">
            👤
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Profile Not Found
          </h1>

          <p className="mt-2 text-slate-500">
            The profile you are looking for does not exist.
          </p>

          <Link
            href="/"
            className="inline-block mt-6 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  /*
   * PUBLIC PROFILE
   */
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:py-10">

      {/* =========================
          TOP NAVIGATION
      ========================== */}
      <div className="max-w-xl mx-auto mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">

          <div className="flex items-center justify-between gap-3">

            {/* BRAND / HOME */}
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-slate-900 hover:text-slate-700 transition"
            >
                <img
  src="/logo-full.png"
  alt="InstaView"
  className="h-auto w-[180px] object-contain sm:w-[210px]"
/>
            </Link>

            {/* AUTH BUTTONS */}
            <div className="flex items-center gap-2">

              <Link
                href="/login"
                className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="px-3 sm:px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition"
              >
                Sign Up
              </Link>

            </div>

          </div>

        </div>
      </div>


      {/* =========================
          PUBLIC PROFILE
      ========================== */}

      <div className="max-w-xl mx-auto">

        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">

          {/* COVER */}
          <div className="h-28 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400" />

          <div className="px-6 pb-8">

            {/* PROFILE PHOTO */}
            <div className="flex justify-center -mt-14">

              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={
                    profile.display_name ||
                    profile.username
                  }
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center text-4xl">
                  👤
                </div>
              )}

            </div>


            {/* PROFILE INFORMATION */}
            <div className="text-center mt-4">

              <h1 className="text-2xl font-bold text-slate-900">
                {profile.display_name ||
                  profile.username}
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                @{profile.username}
              </p>

              {profile.bio && (
                <p className="text-slate-600 mt-4 leading-relaxed">
                  {profile.bio}
                </p>
              )}

            </div>


            {/* LINKS */}
            <div className="mt-8 space-y-3">

              {links.length > 0 ? (
                links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      handleLinkClick(link)
                    }
                    className="block w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-center font-medium text-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    {link.title}
                  </a>
                ))
              ) : (
                <div className="text-center text-sm text-slate-400 py-6">
                  No links added yet.
                </div>
              )}

            </div>

          </div>
        </div>


        {/* =========================
            CREATE YOUR OWN PROFILE
        ========================== */}

        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">

          <h2 className="text-lg font-semibold text-slate-900">
            Create your own InstaView profile
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Put all your important links in one place and
            understand how people interact with your profile.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">

            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition"
            >
              Create Free Profile
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
            >
              Login
            </Link>

          </div>

        </div>


        {/* FOOTER */}
        <div className="text-center mt-6">

          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-900 transition"
          >
            ← Visit InstaView Home
          </Link>

          <p className="text-xs text-slate-400 mt-2">
            Powered by InstaView
          </p>

        </div>

      </div>

    </main>
  );
}