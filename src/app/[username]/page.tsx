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

type ShareLink = {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_url: string;
  share_code: string;
  created_at: string;
};

export default function PublicProfilePage() {
  const params = useParams();

  const username =
    typeof params?.username === "string"
      ? params.username
      : "";

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [links, setLinks] =
    useState<ProfileLink[]>([]);

  const [shareLinks, setShareLinks] =
    useState<ShareLink[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!username) return;

    loadProfile();
  }, [username]);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      /*
       * LOAD PROFILE
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

      if (profileError || !profileData) {
        console.error(
          "Profile error:",
          profileError
        );

        setError("Profile not found.");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      /*
       * LOAD NORMAL LINKS
       */
      const {
        data: linksData,
        error: linksError,
      } = await supabase
        .from("Links")
        .select("id, title, url")
        .eq(
          "user_id",
          profileData.user_id
        )
        .order("created_at", {
          ascending: true,
        });

      if (linksError) {
        console.error(
          "Links error:",
          linksError
        );
      }

      setLinks(linksData || []);

      /*
       * LOAD UPLOADED FILES / BROCHURES
       */
      const {
        data: shareData,
        error: shareError,
      } = await supabase
        .from("ShareLinks")
        .select(
          "id, title, file_name, file_path, file_url, share_code, created_at"
        )
        .eq(
          "user_id",
          profileData.user_id
        )
        .order("created_at", {
          ascending: false,
        });

      if (shareError) {
        console.error(
          "ShareLinks error:",
          shareError
        );
      }

      setShareLinks(
        shareData || []
      );

      /*
       * RECORD PROFILE VIEW
       */
      await recordProfileView(
        profileData.user_id
      );
    } catch (error) {
      console.error(
        "Profile loading error:",
        error
      );

      setError(
        "Something went wrong while loading this profile."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * PROFILE VIEW
   */
  async function recordProfileView(
    profileOwnerId: string
  ) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      /*
       * Don't count owner viewing
       * their own profile.
       */
      if (
        user &&
        user.id === profileOwnerId
      ) {
        return;
      }

      const { error } =
        await supabase
          .from("Analytics")
          .insert({
            user_id: profileOwnerId,
            viewer_id:
              user?.id || null,
            profile_view: true,
            link_id: null,
            share_link_id: null,
            interaction_type:
              "profile_view",
          });

      if (error) {
        console.error(
          "Profile view tracking error:",
          error
        );
      }
    } catch (error) {
      console.error(
        "Profile view error:",
        error
      );
    }
  }

  /*
   * NORMAL LINK CLICK
   */
  async function recordLinkClick(
    link: ProfileLink
  ) {
    try {
      if (!profile) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      /*
       * Don't count owner clicking
       * their own link.
       */
      if (
        user &&
        user.id === profile.user_id
      ) {
        return;
      }

      const { error } =
        await supabase
          .from("Analytics")
          .insert({
            user_id:
              profile.user_id,
            viewer_id:
              user?.id || null,
            profile_view: false,
            link_id: link.id,
            share_link_id: null,
            interaction_type:
              "link_click",
          });

      if (error) {
        console.error(
          "Link click error:",
          error
        );
      }
    } catch (error) {
      console.error(
        "Link click error:",
        error
      );
    }
  }

  /*
   * FILE / BROCHURE CLICK
   *
   * IMPORTANT:
   * share_link_id stores the exact
   * file that was clicked.
   */
  async function recordFileClick(
    share: ShareLink
  ) {
    try {
      if (!profile) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      /*
       * Don't count owner clicking
       * their own file.
       */
      if (
        user &&
        user.id === profile.user_id
      ) {
        return;
      }

      const { error } =
        await supabase
          .from("Analytics")
          .insert({
            user_id:
              profile.user_id,
            viewer_id:
              user?.id || null,
            profile_view: false,
            link_id: null,

            /*
             * THIS IS THE IMPORTANT PART
             */
            share_link_id:
              share.id,

            interaction_type:
              "file_click",
          });

      if (error) {
        console.error(
          "File click error:",
          error
        );
      }
    } catch (error) {
      console.error(
        "File click error:",
        error
      );
    }
  }

  /*
   * OPEN FILE
   */
  function openFile(
    share: ShareLink
  ) {
    /*
     * Track the exact file.
     *
     * Do not await this because
     * the browser should open the
     * file immediately.
     */
    void recordFileClick(
      share
    );

    window.open(
      share.file_url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /*
   * LOADING
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 mx-auto rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />

          <p className="mt-4 text-slate-500">
            Loading profile...
          </p>

        </div>

      </main>
    );
  }

  /*
   * ERROR
   */
  if (error || !profile) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">

        <div className="text-center">

          <h1 className="text-2xl font-bold text-slate-900">
            Profile not found
          </h1>

          <p className="mt-2 text-slate-500">
            {error ||
              "This profile does not exist."}
          </p>

          <Link
            href="/"
            className="inline-block mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white"
          >
            Go Home
          </Link>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">

      <div className="max-w-xl mx-auto">

        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">

          {/* COVER */}
          <div className="h-28 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400" />

          <div className="px-6 pb-8">

            {/* PROFILE IMAGE */}
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

            {/* PROFILE INFO */}
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

            {/* NORMAL LINKS */}
            <div className="mt-8 space-y-3">

              {links.length > 0 ? (

                links.map((link) => (

                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      /*
                       * Don't await analytics.
                       * Navigation happens immediately.
                       */
                      void recordLinkClick(
                        link
                      );
                    }}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-center font-medium text-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    {link.title}
                  </a>

                ))

              ) : (

                <div className="text-center text-sm text-slate-400 py-4">
                  No links added yet.
                </div>

              )}

            </div>

            {/* FILES */}
            {shareLinks.length > 0 && (

              <div className="mt-8">

                <div className="mb-4">

                  <h2 className="text-lg font-bold text-slate-900">
                    Brochures & Files
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    View our latest brochures and documents.
                  </p>

                </div>

                <div className="space-y-3">

                  {shareLinks.map(
                    (share) => (

                      <button
                        key={share.id}
                        type="button"
                        onClick={() =>
                          openFile(
                            share
                          )
                        }
                        className="w-full text-left rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                      >

                        <div className="flex items-center gap-4">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                            📄
                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="font-semibold text-slate-900 truncate">
                              {share.title}
                            </p>

                            <p className="mt-1 text-sm text-slate-500 truncate">
                              {share.file_name}
                            </p>

                          </div>

                          <div className="shrink-0">

                            <span className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white">
                              View
                            </span>

                          </div>

                        </div>

                      </button>

                    )
                  )}

                </div>

              </div>

            )}

          </div>

        </div>

        {/* CREATE PROFILE */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">

          <h2 className="text-lg font-semibold text-slate-900">
            Create your own InstaView profile
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Put all your important links in one place and understand how people interact with your profile.
          </p>

          <div className="mt-4 flex justify-center">

            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition"
            >
              Create Free Profile
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}