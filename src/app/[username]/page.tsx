"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type PublicFile = {
  name: string;
  path: string;
  url: string;
};

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [files, setFiles] = useState<PublicFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const resolvedParams = await params;
      const profileUsername = resolvedParams.username;

      setUsername(profileUsername);

      // Find profile
      const { data: profileData, error: profileError } =
        await supabase
          .from("Profiles")
          .select(
            "id, username, display_name, bio, avatar_url"
          )
          .eq("username", profileUsername)
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

      // Load uploaded files from this user's folder
      await loadFiles(profileData.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }

  async function loadFiles(userId: string) {
    const folder = userId;

    const { data, error } = await supabase.storage
      .from("shared-files")
      .list(folder, {
        limit: 100,
        sortBy: {
          column: "created_at",
          order: "desc",
        },
      });

    if (error) {
      console.error("Unable to load files:", error);
      return;
    }

    if (!data) {
      setFiles([]);
      return;
    }

    const publicFiles: PublicFile[] = data
      .filter(
        (file) =>
          file.name !== ".emptyFolderPlaceholder"
      )
      .map((file) => {
        const path = `${folder}/${file.name}`;

        const { data: publicUrlData } =
          supabase.storage
            .from("shared-files")
            .getPublicUrl(path);

        return {
          name: file.name,
          path,
          url: publicUrlData.publicUrl,
        };
      });

    setFiles(publicFiles);
  }

  function getFileIcon(fileName: string) {
    const extension =
      fileName.split(".").pop()?.toLowerCase();

    if (extension === "pdf") return "📕";
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

  function getFileType(fileName: string) {
    const extension =
      fileName.split(".").pop()?.toUpperCase();

    return extension || "FILE";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">
          Loading profile...
        </p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Profile not found
          </h1>

          <p className="mt-2 text-gray-500">
            {error || "This profile does not exist."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-6 py-5">

          <div className="flex justify-center">
            <h1 className="text-xl font-bold text-gray-900">
              InstaView
            </h1>
          </div>

        </div>
      </header>


      {/* PROFILE */}
      <div className="max-w-3xl mx-auto px-6 py-10">

        <section className="bg-white rounded-2xl border shadow-sm p-8">

          {/* AVATAR */}
          <div className="flex justify-center">

            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || "Profile"}
                className="w-28 h-28 rounded-full object-cover border bg-white"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center text-4xl">
                👤
              </div>
            )}

          </div>


          {/* NAME */}
          <div className="text-center mt-5">

            <h2 className="text-2xl font-bold text-gray-900">
              {profile.display_name ||
                profile.username}
            </h2>

            <p className="mt-1 text-gray-500">
              @{profile.username}
            </p>

          </div>


          {/* BIO */}
          {profile.bio && (
            <p className="mt-5 text-center text-gray-600 max-w-xl mx-auto leading-relaxed">
              {profile.bio}
            </p>
          )}


          {/* FILES */}
          {files.length > 0 && (
            <section className="mt-10">

              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Brochures & Files
              </h3>

              <div className="space-y-3">

                {files.map((file) => (
                  <a
                    key={file.path}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 rounded-xl border bg-white p-4 transition hover:bg-gray-50 hover:shadow-sm"
                  >

                    {/* ICON */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-2xl">
                      {getFileIcon(file.name)}
                    </div>


                    {/* FILE INFORMATION */}
                    <div className="flex-1 min-w-0">

                      <p className="font-semibold text-gray-900 truncate">
                        {file.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {getFileType(file.name)}
                      </p>

                    </div>


                    {/* OPEN */}
                    <div className="shrink-0">

                      <span className="inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">
                        View
                      </span>

                    </div>

                  </a>
                ))}

              </div>

            </section>
          )}


          {/* NO FILES */}
          {files.length === 0 && (
            <section className="mt-10">

              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Brochures & Files
              </h3>

              <div className="rounded-xl border border-dashed bg-gray-50 p-8 text-center">

                <div className="text-3xl">
                  📁
                </div>

                <p className="mt-3 text-gray-500">
                  No brochures or files uploaded yet.
                </p>

              </div>

            </section>
          )}

        </section>

      </div>

    </main>
  );
}