"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type ProfileLink = {
  id: string;
  title: string;
  url: string;
};

type SharedFile = {
  id: string;
  user_id: string;
  title: string | null;
  file_name: string;
  file_path: string;
  file_url: string | null;
  share_code: string;
  created_at: string;
};

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const resolvedParams = await params;
      const username = resolvedParams.username;

      /*
       * =====================================
       * LOAD PROFILE
       * =====================================
       */

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("Profiles")
        .select(
          "id, user_id, username, display_name, bio, avatar_url"
        )
        .eq("username", username)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profileData) {
        setError("Profile not found.");
        setLoading(false);
        return;
      }

      setProfile(profileData);


      /*
       * =====================================
       * RECORD PROFILE VIEW
       * =====================================
       *
       * If the visitor is logged in,
       * record their user ID.
       *
       * Do not record the profile owner's
       * own visit.
       */

      const {
        data: {
          user: visitor,
        },
      } = await supabase.auth.getUser();

      if (
        visitor &&
        visitor.id !== profileData.user_id
      ) {
        const {
          error: viewError,
        } = await supabase
          .from("ProfileViews")
          .insert({
            profile_user_id:
              profileData.user_id,

            visitor_user_id:
              visitor.id,
          });

        if (viewError) {
          console.error(
            "Unable to record profile view:",
            viewError
          );
        }
      }


      /*
       * =====================================
       * LOAD NORMAL PROFILE LINKS
       * =====================================
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
          "Error loading profile links:",
          linksError
        );
      } else if (linksData) {
        setLinks(linksData);
      }


      /*
       * =====================================
       * LOAD BROCHURES / SHARED FILES
       * =====================================
       */

      const {
        data: filesData,
        error: filesError,
      } = await supabase
        .from("ShareLinks")
        .select(
          "id, user_id, title, file_name, file_path, file_url, share_code, created_at"
        )
        .eq(
          "user_id",
          profileData.user_id
        )
        .order("created_at", {
          ascending: false,
        });

      if (filesError) {
        console.error(
          "Error loading shared files:",
          filesError
        );
      } else if (filesData) {
        setSharedFiles(filesData);
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load this profile."
      );
    } finally {
      setLoading(false);
    }
  }


  /*
   * =====================================
   * GET FILE URL
   * =====================================
   */

  function getFileUrl(file: SharedFile) {
    if (file.file_url) {
      return file.file_url;
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from("shared-files")
      .getPublicUrl(
        file.file_path
      );

    return publicUrlData.publicUrl;
  }


  /*
   * =====================================
   * FILE ICON
   * =====================================
   */

  function getFileIcon(
    fileName: string
  ) {
    const extension = fileName
      .split(".")
      .pop()
      ?.toLowerCase();

    if (extension === "pdf") {
      return "📕";
    }

    if (
      extension === "jpg" ||
      extension === "jpeg" ||
      extension === "png" ||
      extension === "webp"
    ) {
      return "🖼️";
    }

    if (
      extension === "doc" ||
      extension === "docx"
    ) {
      return "📘";
    }

    if (
      extension === "xls" ||
      extension === "xlsx"
    ) {
      return "📊";
    }

    if (
      extension === "ppt" ||
      extension === "pptx"
    ) {
      return "📙";
    }

    return "📄";
  }


  /*
   * =====================================
   * FILE TYPE
   * =====================================
   */

  function getFileType(
    fileName: string
  ) {
    const extension = fileName
      .split(".")
      .pop()
      ?.toUpperCase();

    return extension || "FILE";
  }


  /*
   * =====================================
   * LOADING SCREEN
   * =====================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="text-center">

          <div className="text-lg font-medium text-gray-700">
            Loading profile...
          </div>

        </div>

      </main>
    );
  }


  /*
   * =====================================
   * PROFILE NOT FOUND
   * =====================================
   */

  if (!profile) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

        <div className="text-center">

          <div className="text-5xl mb-4">
            😕
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Profile not found
          </h1>

          <p className="mt-2 text-gray-500">
            {error ||
              "This profile does not exist."}
          </p>

        </div>

      </main>
    );
  }


  /*
   * =====================================
   * MAIN PAGE
   * =====================================
   */

  return (
    <main className="min-h-screen bg-gray-50">

      {/* =================================
          HEADER
      ================================= */}

      <header className="bg-white border-b">

        <div className="max-w-3xl mx-auto px-6 py-5">

          <div className="flex items-center justify-center">

            <img
              src="/logo-full.png"
              alt="InstaView"
              className="h-auto w-[220px] object-contain"
            />

          </div>

        </div>

      </header>


      {/* =================================
          PROFILE CONTENT
      ================================= */}

      <div className="max-w-3xl mx-auto px-5 py-10">

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 sm:p-9">


          {/* =================================
              PROFILE PHOTO
          ================================= */}

          <div className="flex justify-center">

            {profile.avatar_url ? (

              <img
                src={profile.avatar_url}
                alt={
                  profile.display_name ||
                  profile.username ||
                  "Profile"
                }
                className="w-28 h-28 rounded-full object-cover border border-gray-200 bg-white"
              />

            ) : (

              <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center text-4xl border border-gray-200">
                👤
              </div>

            )}

          </div>


          {/* =================================
              NAME
          ================================= */}

          <div className="text-center mt-5">

            <h1 className="text-2xl font-bold text-gray-900">

              {profile.display_name ||
                profile.username}

            </h1>

            {profile.username && (

              <p className="mt-1 text-gray-500">
                @{profile.username}
              </p>

            )}

          </div>


          {/* =================================
              BIO
          ================================= */}

          {profile.bio && (

            <p className="mt-5 text-center text-gray-600 leading-relaxed max-w-xl mx-auto whitespace-pre-line">

              {profile.bio}

            </p>

          )}


          {/* =================================
              LINKS
          ================================= */}

          {links.length > 0 && (

            <section className="mt-8">

              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Links
              </h2>

              <div className="space-y-3">

                {links.map((link) => (

                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4 w-full rounded-xl border border-gray-200 bg-white px-5 py-4 transition hover:bg-gray-50 hover:shadow-sm"
                  >

                    <span className="font-medium text-gray-900 truncate">
                      {link.title}
                    </span>

                    <span className="shrink-0 text-gray-400 text-xl">
                      →
                    </span>

                  </a>

                ))}

              </div>

            </section>

          )}


          {/* =================================
              BROCHURES & FILES
          ================================= */}

          <section className="mt-9">

            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Brochures & Files
            </h2>


            {sharedFiles.length > 0 ? (

              <div className="space-y-3">

                {sharedFiles.map((file) => {

                  const fileUrl =
                    getFileUrl(file);

                  return (

                    <a
                      key={file.id}
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-4 w-full rounded-xl border border-gray-200 bg-white p-4 transition hover:bg-gray-50 hover:shadow-sm"
                    >

                      {/* FILE ICON */}

                      <div className="w-12 h-12 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">

                        {getFileIcon(
                          file.file_name
                        )}

                      </div>


                      {/* FILE DETAILS */}

                      <div className="flex-1 min-w-0">

                        <h3 className="font-semibold text-gray-900 truncate">

                          {file.title ||
                            file.file_name}

                        </h3>

                        <p className="mt-1 text-xs text-gray-500 truncate">

                          {file.file_name}

                        </p>

                        <p className="mt-1 text-xs text-gray-400">

                          {getFileType(
                            file.file_name
                          )}

                        </p>

                      </div>


                      {/* VIEW BUTTON */}

                      <span className="shrink-0 inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white group-hover:bg-gray-800">

                        View

                      </span>

                    </a>

                  );

                })}

              </div>

            ) : (

              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-7 text-center">

                <div className="text-3xl mb-2">
                  📁
                </div>

                <p className="text-sm text-gray-500">
                  No brochures or files uploaded yet.
                </p>

              </div>

            )}

          </section>


          {/* =================================
              FOOTER
          ================================= */}

          <div className="mt-10 pt-6 border-t border-gray-100 text-center">

            <p className="text-xs text-gray-400">
              Powered by InstaView
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}