"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

export default function ProfilePage() {
  // ============================================
  // PROFILE STATE
  // ============================================

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // ============================================
  // NORMAL LINKS
  // ============================================

  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // ============================================
  // SHARED FILES
  // ============================================

  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [fileTitle, setFileTitle] = useState("");

  // ============================================
  // UI STATE
  // ============================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linkSaving, setLinkSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================
  // LOAD PAGE
  // ============================================

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // ========================================
      // LOAD PROFILE
      // ========================================

      const { data: profile, error: profileError } =
        await supabase
          .from("Profiles")
          .select(
            "user_id, username, display_name, bio, avatar_url"
          )
          .eq("user_id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error(profileError);
        setError(profileError.message);
      }

      if (profile) {
        setUsername(profile.username || "");
        setDisplayName(profile.display_name || "");
        setBio(profile.bio || "");
        setAvatarUrl(profile.avatar_url || "");
      } else {
        // Create profile for new users
        const metadata = user.user_metadata || {};

        const providerName =
          metadata.full_name ||
          metadata.name ||
          "";

        const providerAvatar =
          metadata.avatar_url ||
          metadata.picture ||
          "";

        const { error: createError } =
          await supabase
            .from("Profiles")
            .insert({
              user_id: user.id,
              username: null,
              display_name: providerName || null,
              bio: null,
              avatar_url: providerAvatar || null,
            });

        if (createError) {
          console.error(createError);
        }

        setDisplayName(providerName);
        setAvatarUrl(providerAvatar);
      }

      // ========================================
      // LOAD NORMAL LINKS
      // ========================================

      const { data: linksData, error: linksError } =
        await supabase
          .from("Links")
          .select("id, title, url")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: true,
          });

      if (linksError) {
        console.error(linksError);
        setError(linksError.message);
      }

      setLinks(linksData || []);

      // ========================================
      // LOAD SHARED FILES
      // ========================================

      const {
        data: shareData,
        error: shareError,
      } = await supabase
        .from("ShareLinks")
        .select(
          "id, title, file_name, file_path, file_url, share_code, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (shareError) {
        console.error(
          "ShareLinks loading error:",
          shareError
        );

        // Don't block the profile page if there
        // are no ShareLinks records yet.
      }

      setShareLinks(shareData || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SAVE PROFILE
  // ============================================

  const saveProfile = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // Clean username
      const cleanUsername = username
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "");

      if (!cleanUsername) {
        setError("Username is required.");
        return;
      }

      if (cleanUsername.length < 3) {
        setError(
          "Username must be at least 3 characters."
        );
        return;
      }

      if (cleanUsername.length > 30) {
        setError(
          "Username cannot be longer than 30 characters."
        );
        return;
      }

      // ========================================
      // CHECK USERNAME
      // ========================================

      const {
        data: usernameOwner,
        error: usernameCheckError,
      } = await supabase
        .from("Profiles")
        .select("user_id")
        .eq("username", cleanUsername)
        .neq("user_id", user.id)
        .maybeSingle();

      if (usernameCheckError) {
        console.error(usernameCheckError);
        setError(
          "Unable to check username availability."
        );
        return;
      }

      if (usernameOwner) {
        setError(
          "This username is already taken."
        );
        return;
      }

      // ========================================
      // CHECK RESERVED USERNAME
      // ========================================

      const {
        data: reservedUsername,
        error: reservedError,
      } = await supabase
        .from("ReservedUsernames")
        .select("username")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (reservedError) {
        console.error(reservedError);
        setError(
          "Unable to check reserved usernames."
        );
        return;
      }

      if (reservedUsername) {
        setError(
          `"${cleanUsername}" is reserved. Please choose another username.`
        );
        return;
      }

      // ========================================
      // SAVE PROFILE
      // ========================================

      const { error: saveError } =
        await supabase
          .from("Profiles")
          .upsert(
            {
              user_id: user.id,
              username: cleanUsername,
              display_name:
                displayName.trim() || null,
              bio: bio.trim() || null,
              avatar_url: avatarUrl || null,
            },
            {
              onConflict: "user_id",
            }
          );

      if (saveError) {
        console.error(saveError);
        setError(saveError.message);
        return;
      }

      setUsername(cleanUsername);
      setMessage(
        "Profile saved successfully!"
      );
    } catch (err) {
      console.error(err);
      setError("Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // UPLOAD PROFILE PHOTO
  // ============================================

  const uploadAvatar = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");
    setError("");

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select an image file."
      );
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image must be smaller than 5MB."
      );
      e.target.value = "";
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUploadingAvatar(true);

      const extension =
        file.name.split(".").pop() || "jpg";

      const filePath =
        `${user.id}/avatar-${Date.now()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("avatars")
          .upload(
            filePath,
            file,
            {
              upsert: false,
              contentType: file.type,
            }
          );

      if (uploadError) {
        throw new Error(
          uploadError.message
        );
      }

      const { data } =
        supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      const { error: updateError } =
        await supabase
          .from("Profiles")
          .upsert(
            {
              user_id: user.id,
              avatar_url: publicUrl,
            },
            {
              onConflict: "user_id",
            }
          );

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      setAvatarUrl(publicUrl);

      setMessage(
        "Profile photo updated successfully!"
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload profile photo."
      );
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  // ============================================
  // ADD NORMAL LINK
  // ============================================

  const addLink = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !linkTitle.trim() ||
      !linkUrl.trim()
    ) {
      setError(
        "Please enter both the link title and URL."
      );
      return;
    }

    let validUrl = linkUrl.trim();

    if (
      !validUrl.startsWith("http://") &&
      !validUrl.startsWith("https://")
    ) {
      validUrl = `https://${validUrl}`;
    }

    try {
      new URL(validUrl);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }

    setLinkSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const {
        data,
        error: insertError,
      } = await supabase
        .from("Links")
        .insert({
          user_id: user.id,
          title: linkTitle.trim(),
          url: validUrl,
        })
        .select("id, title, url")
        .single();

      if (insertError) {
        throw new Error(
          insertError.message
        );
      }

      if (data) {
        setLinks((current) => [
          ...current,
          data,
        ]);
      }

      setLinkTitle("");
      setLinkUrl("");

      setMessage(
        "Link added successfully!"
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to add link."
      );
    } finally {
      setLinkSaving(false);
    }
  };

  // ============================================
  // EDIT NORMAL LINK
  // ============================================

  const editLink = async (
    id: string,
    currentTitle: string,
    currentUrl: string
  ) => {
    const newTitle = window.prompt(
      "Link title:",
      currentTitle
    );

    if (newTitle === null) {
      return;
    }

    const newUrlInput = window.prompt(
      "Link URL:",
      currentUrl
    );

    if (newUrlInput === null) {
      return;
    }

    if (
      !newTitle.trim() ||
      !newUrlInput.trim()
    ) {
      setError("Both fields are required.");
      return;
    }

    let newUrl = newUrlInput.trim();

    if (
      !newUrl.startsWith("http://") &&
      !newUrl.startsWith("https://")
    ) {
      newUrl = `https://${newUrl}`;
    }

    try {
      new URL(newUrl);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }

    try {
      const {
        data,
        error: updateError,
      } = await supabase
        .from("Links")
        .update({
          title: newTitle.trim(),
          url: newUrl,
        })
        .eq("id", id)
        .select("id, title, url")
        .single();

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      if (data) {
        setLinks((current) =>
          current.map((link) =>
            link.id === id
              ? data
              : link
          )
        );
      }

      setMessage(
        "Link updated successfully!"
      );
      setError("");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update link."
      );
    }
  };

  // ============================================
  // DELETE NORMAL LINK
  // ============================================

  const deleteLink = async (
    id: string
  ) => {
    const confirmed = window.confirm(
      "Delete this link?"
    );

    if (!confirmed) {
      return;
    }

    const { error: deleteError } =
      await supabase
        .from("Links")
        .delete()
        .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setLinks((current) =>
      current.filter(
        (link) => link.id !== id
      )
    );

    setMessage(
      "Link deleted successfully!"
    );
  };

  // ============================================
  // GENERATE SHARE CODE
  // ============================================

  const generateShareCode = () => {
    const characters =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

    let code = "";

    for (let i = 0; i < 8; i++) {
      code += characters.charAt(
        Math.floor(
          Math.random() *
            characters.length
        )
      );
    }

    return code;
  };

  // ============================================
  // UPLOAD FILE
  // ============================================

  const uploadShareFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");
    setError("");

    try {
      // ========================================
      // GET USER
      // ========================================

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // ========================================
      // FILE SIZE
      // ========================================

      if (
        file.size >
        25 * 1024 * 1024
      ) {
        setError(
          "File must be smaller than 25MB."
        );

        e.target.value = "";
        return;
      }

      setUploadingFile(true);

      // ========================================
      // SAFE FILE NAME
      // ========================================

      const safeName = file.name
        .replace(
          /[^a-zA-Z0-9._-]/g,
          "-"
        )
        .replace(
          /-+/g,
          "-"
        );

      // IMPORTANT:
      // First folder MUST be user.id
      // because your Storage policy checks it.
      const filePath =
        `${user.id}/${Date.now()}-${safeName}`;

      // ========================================
      // UPLOAD TO SUPABASE STORAGE
      // ========================================

      const {
        error: uploadError,
      } = await supabase.storage
        .from("shared-files")
        .upload(
          filePath,
          file,
          {
            upsert: false,
            contentType:
              file.type ||
              "application/octet-stream",
          }
        );

      if (uploadError) {
        throw new Error(
          uploadError.message
        );
      }

      // ========================================
      // GET PUBLIC FILE URL
      // ========================================

      const { data: publicData } =
        supabase.storage
          .from("shared-files")
          .getPublicUrl(filePath);

      const fileUrl =
        publicData.publicUrl;

      // ========================================
      // GENERATE SHARE CODE
      // ========================================

      let shareCode =
        generateShareCode();

      let attempts = 0;

      while (attempts < 10) {
        const {
          data: existing,
        } = await supabase
          .from("ShareLinks")
          .select("id")
          .eq(
            "share_code",
            shareCode
          )
          .maybeSingle();

        if (!existing) {
          break;
        }

        shareCode =
          generateShareCode();

        attempts++;
      }

      // ========================================
      // CREATE DATABASE RECORD
      // ========================================

      const {
        data: shareData,
        error: shareError,
      } = await supabase
        .from("ShareLinks")
        .insert({
          user_id: user.id,

          title:
            fileTitle.trim() ||
            file.name.replace(
              /\.[^/.]+$/,
              ""
            ),

          file_name: file.name,

          file_path: filePath,

          file_url: fileUrl,

          share_code: shareCode,
        })
        .select(
          "id, title, file_name, file_path, file_url, share_code, created_at"
        )
        .single();

      // ========================================
      // IF DATABASE INSERT FAILS,
      // REMOVE FILE FROM STORAGE
      // ========================================

      if (shareError) {
        await supabase.storage
          .from("shared-files")
          .remove([
            filePath,
          ]);

        throw new Error(
          shareError.message
        );
      }

      // ========================================
      // UPDATE SCREEN
      // ========================================

      if (shareData) {
        setShareLinks(
          (current) => [
            shareData,
            ...current,
          ]
        );
      }

      setFileTitle("");
      e.target.value = "";

      setMessage(
        "File uploaded successfully! Your share link is ready."
      );
    } catch (err) {
      console.error(
        "File upload error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload file."
      );

      e.target.value = "";
    } finally {
      setUploadingFile(false);
    }
  };

  // ============================================
  // COPY SHARE LINK
  // ============================================

  const copyShareLink = async (
    shareCode: string
  ) => {
    const url =
      `${window.location.origin}/S/${shareCode}`;

    try {
      await navigator.clipboard.writeText(
        url
      );

      setMessage(
        "Share link copied!"
      );
    } catch {
      setError(
        "Unable to copy share link."
      );
    }
  };

  // ============================================
  // OPEN SHARE LINK
  // ============================================

  const openShareLink = (
    shareCode: string
  ) => {
    const url =
      `${window.location.origin}/S/${shareCode}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ============================================
  // DELETE SHARED FILE
  // ============================================

  const deleteShareFile = async (
    share: ShareLink
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${share.file_name}" and its share link?`
      );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      // ========================================
      // DELETE DATABASE RECORD
      // ========================================

      const {
        error: deleteError,
      } = await supabase
        .from("ShareLinks")
        .delete()
        .eq(
          "id",
          share.id
        );

      if (deleteError) {
        throw new Error(
          deleteError.message
        );
      }

      // ========================================
      // DELETE ACTUAL FILE
      // ========================================

      const {
        error: storageError,
      } = await supabase.storage
        .from("shared-files")
        .remove([
          share.file_path,
        ]);

      if (storageError) {
        console.error(
          "Storage delete error:",
          storageError
        );
      }

      setShareLinks(
        (current) =>
          current.filter(
            (item) =>
              item.id !== share.id
          )
      );

      setMessage(
        "File and share link deleted."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete file."
      );
    }
  };

  // ============================================
  // COPY PROFILE URL
  // ============================================

  const copyProfileUrl = async () => {
    if (!username) {
      setError(
        "Please save your username first."
      );
      return;
    }

    const url =
      `${window.location.origin}/${username}`;

    try {
      await navigator.clipboard.writeText(
        url
      );

      setMessage(
        "Profile link copied!"
      );
    } catch {
      setError(
        "Unable to copy profile link."
      );
    }
  };

  // ============================================
  // LOGOUT
  // ============================================

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#E5E2FF] border-t-[#635BFF]" />

          <p className="mt-4 text-sm text-slate-500">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  // ============================================
  // PAGE
  // ============================================

  return (
    <main className="min-h-screen bg-slate-100">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">

          <Link
            href="/"
            className="text-xl font-bold text-slate-900"
          >
            InstaView
          </Link>

          <div className="flex items-center gap-3">

            <Link
              href="/dashboard"
              className="rounded-lg border border-[#DCD8FF] px-4 py-2 text-sm font-medium text-[#5148E5] hover:bg-[#F1EFFF]"
            >
              Dashboard
            </Link>

            {username && (
              <Link
                href={`/${username}`}
                target="_blank"
                className="hidden rounded-lg border border-[#DCD8FF] px-4 py-2 text-sm font-medium text-[#5148E5] hover:bg-[#F1EFFF] sm:block"
              >
                View Profile
              </Link>
            )}

            <button
              onClick={logout}
              className="rounded-lg border border-[#DCD8FF] px-4 py-2 text-sm font-medium text-[#635BFF] hover:bg-[#F1EFFF]"
            >
              Logout
            </button>

          </div>
        </div>
      </header>

      {/* ======================================
          CONTENT
      ====================================== */}

      <div className="mx-auto max-w-6xl px-6 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Edit Your Profile
          </h1>

          <p className="mt-2 text-slate-500">
            Manage your profile, links and files.
          </p>
        </div>

        {/* ====================================
            SUCCESS MESSAGE
        ==================================== */}

        {message && (
          <div className="mb-5 rounded-xl border border-green-100 bg-green-50 px-5 py-4 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* ====================================
            ERROR MESSAGE
        ==================================== */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">

          {/* ==================================
              LEFT SIDE
          ================================== */}

          <div className="space-y-8 lg:col-span-2">

            {/* ==================================
                PROFILE
            ================================== */}

            <section className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Profile Information
              </h2>

              {/* PROFILE PHOTO */}

              <div className="mt-6 flex items-center gap-5">

                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 text-3xl font-bold text-white">
                    {(displayName ||
                      username ||
                      "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div>

                  <label className="inline-block cursor-pointer rounded-lg border border-[#DCD8FF] px-4 py-2 text-sm font-medium text-[#635BFF] hover:bg-[#F1EFFF]">

                    {uploadingAvatar
                      ? "Uploading..."
                      : "Change Photo"}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={uploadAvatar}
                      disabled={
                        uploadingAvatar
                      }
                      className="hidden"
                    />

                  </label>

                  <p className="mt-2 text-xs text-slate-400">
                    JPG, PNG or WebP. Maximum 5MB.
                  </p>

                </div>

              </div>

              {/* PROFILE FORM */}

              <form
                onSubmit={saveProfile}
                className="mt-8 space-y-5"
              >

                {/* USERNAME */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Username
                  </label>

                  <div className="flex items-center rounded-xl border border-slate-200 bg-white">

                    <span className="pl-4 text-slate-400">
                      /
                    </span>

                    <input
                      type="text"
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )
                            .replace(
                              /[^a-z0-9-_]/g,
                              ""
                            )
                        )
                      }
                      maxLength={30}
                      placeholder="yourname"
                      className="w-full rounded-xl px-2 py-3 outline-none"
                    />

                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Your public profile:
                    {" "}
                    /{username || "username"}
                  </p>
                </div>

                {/* DISPLAY NAME */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Display Name
                  </label>

                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) =>
                      setDisplayName(
                        e.target.value
                      )
                    }
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/10"
                  />
                </div>

                {/* BIO */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Bio
                  </label>

                  <textarea
                    value={bio}
                    onChange={(e) =>
                      setBio(
                        e.target.value
                      )
                    }
                    rows={4}
                    maxLength={300}
                    placeholder="Tell people about yourself..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/10"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    {bio.length}/300
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#635BFF] px-6 py-3 font-medium text-white shadow-sm hover:bg-[#5148E5] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Profile"}
                </button>

              </form>

            </section>

            {/* ==================================
                UPLOAD FILES
            ================================== */}

            <section className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Upload Files
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Upload brochures, catalogues, PDFs,
                images, documents and other files.
                Each file gets its own shareable InstaView link.
              </p>

              {/* UPLOAD BOX */}

              <div className="mt-6 rounded-2xl border-2 border-dashed border-[#DCD8FF] bg-[#F8F7FF] p-6">

                <div className="text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#F1EFFF] text-2xl shadow-sm">
                    📄
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-900">
                    Upload a file
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    PDF, image, brochure, catalogue,
                    Word, Excel, PowerPoint, ZIP and more.
                  </p>

                </div>

                {/* FILE TITLE */}

                <div className="mt-6">

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    File title
                  </label>

                  <input
                    type="text"
                    value={fileTitle}
                    onChange={(e) =>
                      setFileTitle(
                        e.target.value
                      )
                    }
                    placeholder="Example: Product Brochure 2026"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/10"
                  />

                </div>

                {/* FILE BUTTON */}

                <label
                  className={`mt-4 flex items-center justify-center rounded-xl px-6 py-4 text-sm font-semibold text-white ${
                    uploadingFile
                      ? "cursor-not-allowed bg-[#A9A5D8]"
                      : "cursor-pointer bg-slate-900 hover:bg-slate-800"
                  }`}
                >

                  {uploadingFile
                    ? "Uploading..."
                    : "Choose File & Generate Link"}

                  <input
                    type="file"
                    onChange={
                      uploadShareFile
                    }
                    disabled={
                      uploadingFile
                    }
                    className="hidden"
                    accept="
                      .pdf,
                      .png,
                      .jpg,
                      .jpeg,
                      .webp,
                      .gif,
                      .doc,
                      .docx,
                      .ppt,
                      .pptx,
                      .xls,
                      .xlsx,
                      .zip,
                      .txt,
                      .csv
                    "
                  />

                </label>

                <p className="mt-3 text-center text-xs text-slate-400">
                  Maximum file size: 25MB
                </p>

              </div>

              {/* =================================
                  YOUR FILES
              ================================= */}

              <div className="mt-8">

                <h3 className="font-semibold text-slate-900">
                  Your Shared Files
                </h3>

                {shareLinks.length === 0 ? (

                  <div className="mt-4 rounded-xl bg-slate-50 p-6 text-center">
                    <p className="text-sm text-slate-400">
                      No files uploaded yet.
                    </p>
                  </div>

                ) : (

                  <div className="mt-4 space-y-3">

                    {shareLinks.map(
                      (share) => {

                        const shareUrl =
                          `${typeof window !== "undefined"
                            ? window.location.origin
                            : ""
                          }/S/${share.share_code}`;

                        return (
                          <div
                            key={share.id}
                            className="rounded-xl border border-slate-200 p-4"
                          >

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                              <div className="min-w-0">

                                <p className="font-semibold text-slate-900">
                                  {share.title}
                                </p>

                                <p className="mt-1 break-all text-sm text-slate-500">
                                  {share.file_name}
                                </p>

                                <p className="mt-2 break-all text-xs text-[#635BFF]">
                                  {shareUrl}
                                </p>

                              </div>

                              <div className="flex shrink-0 flex-wrap gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    copyShareLink(
                                      share.share_code
                                    )
                                  }
                                  className="rounded-lg border border-[#DCD8FF] px-3 py-2 text-sm font-medium text-[#635BFF] hover:bg-[#F1EFFF]"
                                >
                                  Copy
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openShareLink(
                                      share.share_code
                                    )
                                  }
                                  className="rounded-lg bg-[#635BFF] px-3 py-2 text-sm font-medium text-white hover:bg-[#5148E5]"
                                >
                                  View
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteShareFile(
                                      share
                                    )
                                  }
                                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>

                              </div>

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

              </div>

            </section>

            {/* ==================================
                NORMAL LINKS
            ================================== */}

            <section className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                My Links
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Add the links visitors should see
                on your public profile.
              </p>

              <form
                onSubmit={addLink}
                className="mt-6 space-y-4"
              >

                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) =>
                    setLinkTitle(
                      e.target.value
                    )
                  }
                  placeholder="Link title e.g. Instagram"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/10"
                />

                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) =>
                    setLinkUrl(
                      e.target.value
                    )
                  }
                  placeholder="https://example.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/10"
                />

                <button
                  type="submit"
                  disabled={linkSaving}
                  className="rounded-xl bg-[#635BFF] px-6 py-3 font-medium text-white shadow-sm hover:bg-[#5148E5] disabled:opacity-50"
                >
                  {linkSaving
                    ? "Adding..."
                    : "Add Link"}
                </button>

              </form>

              <div className="mt-8 space-y-3">

                {links.length === 0 ? (

                  <p className="text-sm text-slate-400">
                    No links added yet.
                  </p>

                ) : (

                  links.map((link) => (
                    <div
                      key={link.id}
                      className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >

                      <div className="min-w-0">

                        <p className="font-medium text-slate-900">
                          {link.title}
                        </p>

                        <p className="mt-1 break-all text-sm text-slate-500">
                          {link.url}
                        </p>

                      </div>

                      <div className="flex shrink-0 gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            editLink(
                              link.id,
                              link.title,
                              link.url
                            )
                          }
                          className="rounded-lg border border-[#DCD8FF] px-3 py-2 text-sm text-[#635BFF] hover:bg-[#F1EFFF]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteLink(
                              link.id
                            )
                          }
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>

                      </div>

                    </div>
                  ))
                )}

              </div>

            </section>

          </div>

          {/* ==================================
              RIGHT SIDE PREVIEW
          ================================== */}

          <aside className="lg:sticky lg:top-8 lg:self-start">

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Your Public Profile
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                This is how visitors will see your profile.
              </p>

              <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">

                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="mx-auto h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-2xl font-bold text-white">
                    {(displayName ||
                      username ||
                      "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  {displayName ||
                    username ||
                    "Your Name"}
                </h3>

                <p className="text-sm text-slate-500">
                  @{username ||
                    "username"}
                </p>

                {bio && (
                  <p className="mt-3 text-sm text-slate-600">
                    {bio}
                  </p>
                )}

                {/* NORMAL LINKS */}

                <div className="mt-5 space-y-2">

                  {links
                    .slice(0, 3)
                    .map((link) => (
                      <div
                        key={link.id}
                        className="rounded-lg bg-[#635BFF] px-3 py-2 text-sm text-white"
                      >
                        {link.title}
                      </div>
                    ))}

                </div>

                {/* FILE LINKS */}

                <div className="mt-2 space-y-2">

                  {shareLinks
                    .slice(0, 3)
                    .map((share) => (
                      <div
                        key={share.id}
                        className="rounded-lg bg-[#5148E5] px-3 py-2 text-sm text-white"
                      >
                        {share.title}
                      </div>
                    ))}

                </div>

              </div>

              <div className="mt-5 grid gap-3">

                {username && (
                  <Link
                    href={`/${username}`}
                    target="_blank"
                    className="rounded-xl border border-[#DCD8FF] px-4 py-3 text-center text-sm font-medium text-[#635BFF] hover:bg-[#F1EFFF]"
                  >
                    View Public Profile
                  </Link>
                )}

                <button
                  type="button"
                  onClick={
                    copyProfileUrl
                  }
                  disabled={!username}
                  className="rounded-xl bg-[#635BFF] px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-[#5148E5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Copy Profile Link
                </button>

              </div>

            </div>

          </aside>

        </div>

      </div>

    </main>
  );
}