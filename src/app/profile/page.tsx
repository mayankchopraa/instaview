"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Profile = {
  id?: string;
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type ProfileLink = {
  id: string;
  user_id: string;
  title: string;
  url: string;
};

/*
|--------------------------------------------------------------------------
| RESERVED USERNAMES
|--------------------------------------------------------------------------
*/

const RESERVED_USERNAMES = new Set([
  "dashboard",
  "login",
  "signup",
  "sign-up",
  "register",
  "registration",
  "profile",
  "profiles",
  "admin",
  "administrator",
  "api",
  "auth",
  "authentication",
  "settings",
  "account",
  "accounts",
  "home",
  "index",
  "about",
  "contact",
  "help",
  "support",
  "privacy",
  "terms",
  "pricing",
  "logout",
  "forgot-password",
  "reset-password",
  "verify",
  "verification",
  "callback",
  "invite",
  "invites",
  "null",
  "undefined",
]);

export default function ProfilePage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");

  const [profile, setProfile] = useState<Profile | null>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [links, setLinks] = useState<ProfileLink[]>([]);

  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingLink, setAddingLink] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD PROFILE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      /*
       * Get logged-in user
       */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      /*
       * Load profile
       */

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("Profiles")
        .select(
          "id, user_id, username, display_name, bio, avatar_url"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(profileError);

        setError("Unable to load your profile.");
        return;
      }

      if (profileData) {
        setProfile(profileData);

        setUsername(profileData.username || "");
        setDisplayName(profileData.display_name || "");
        setBio(profileData.bio || "");
        setAvatarUrl(profileData.avatar_url || "");
      }

      /*
       * Load profile links
       */

      const {
        data: linksData,
        error: linksError,
      } = await supabase
        .from("Links")
        .select("id, user_id, title, url")
        .eq("user_id", user.id)
        .order("id", {
          ascending: true,
        });

      if (linksError) {
        console.error(linksError);
      }

      if (linksData) {
        setLinks(linksData);
      }
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong while loading your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | USERNAME NORMALIZATION
  |--------------------------------------------------------------------------
  */

  const normalizeUsername = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/^@/, "");
  };

  /*
  |--------------------------------------------------------------------------
  | USERNAME VALIDATION
  |--------------------------------------------------------------------------
  */

  const validateUsername = (value: string) => {
    const cleanUsername =
      normalizeUsername(value);

    if (!cleanUsername) {
      return "Username is required.";
    }

    if (
      cleanUsername.length < 3 ||
      cleanUsername.length > 30
    ) {
      return "Username must be between 3 and 30 characters.";
    }

    if (!/^[a-z0-9_-]+$/.test(cleanUsername)) {
      return "Username can contain only letters, numbers, hyphens and underscores.";
    }

    if (
      RESERVED_USERNAMES.has(cleanUsername)
    ) {
      return `"${cleanUsername}" is a reserved username. Please choose another one.`;
    }

    return "";
  };

  /*
  |--------------------------------------------------------------------------
  | CHECK USERNAME AVAILABILITY
  |--------------------------------------------------------------------------
  */

  const checkUsernameAvailability = async (
    cleanUsername: string
  ) => {
    const {
      data,
      error: usernameError,
    } = await supabase
      .from("Profiles")
      .select("user_id")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (usernameError) {
      console.error(usernameError);

      return {
        available: false,
        error:
          "Unable to check username availability.",
      };
    }

    /*
     * Username does not exist
     */

    if (!data) {
      return {
        available: true,
        error: "",
      };
    }

    /*
     * Username belongs to current user
     */

    if (data.user_id === userId) {
      return {
        available: true,
        error: "",
      };
    }

    return {
      available: false,
      error: "This username is already taken.",
    };
  };

  /*
  |--------------------------------------------------------------------------
  | SAVE PROFILE
  |--------------------------------------------------------------------------
  */

  const handleSaveProfile = async () => {
    setError("");
    setMessage("");

    const cleanUsername =
      normalizeUsername(username);

    /*
     * Validate username
     */

    const usernameValidation =
      validateUsername(cleanUsername);

    if (usernameValidation) {
      setError(usernameValidation);
      return;
    }

    if (!userId) {
      setError("You are not logged in.");
      return;
    }

    setSaving(true);

    try {
      /*
       * Check username
       */

      const availability =
        await checkUsernameAvailability(
          cleanUsername
        );

      if (!availability.available) {
        setError(
          availability.error ||
            "This username is not available."
        );

        setSaving(false);
        return;
      }

      /*
       * Profile data
       */

      const profileData = {
        user_id: userId,
        username: cleanUsername,
        display_name:
          displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url:
          avatarUrl.trim() || null,
      };

      /*
       * Existing profile
       */

      if (profile) {
        const {
          data,
          error: updateError,
        } = await supabase
          .from("Profiles")
          .update({
            username:
              profileData.username,
            display_name:
              profileData.display_name,
            bio: profileData.bio,
            avatar_url:
              profileData.avatar_url,
          })
          .eq("user_id", userId)
          .select(
            "id, user_id, username, display_name, bio, avatar_url"
          )
          .single();

        if (updateError) {
          console.error(updateError);

          if (
            updateError.code === "23505"
          ) {
            setError(
              "This username is already taken. Please choose another username."
            );
          } else {
            setError(
              updateError.message ||
                "Unable to save your profile."
            );
          }

          setSaving(false);
          return;
        }

        setProfile(data);

        setUsername(data.username);
        setDisplayName(
          data.display_name || ""
        );
        setBio(data.bio || "");
        setAvatarUrl(
          data.avatar_url || ""
        );
      } else {
        /*
         * Create profile
         */

        const {
          data,
          error: insertError,
        } = await supabase
          .from("Profiles")
          .insert(profileData)
          .select(
            "id, user_id, username, display_name, bio, avatar_url"
          )
          .single();

        if (insertError) {
          console.error(insertError);

          if (
            insertError.code === "23505"
          ) {
            setError(
              "This username is already taken. Please choose another username."
            );
          } else {
            setError(
              insertError.message ||
                "Unable to create your profile."
            );
          }

          setSaving(false);
          return;
        }

        setProfile(data);
      }

      setUsername(cleanUsername);

      setMessage(
        "Profile saved successfully!"
      );
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong while saving your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UPLOAD PROFILE PHOTO
  |--------------------------------------------------------------------------
  */

  const uploadAvatar = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");
    setError("");

    /*
     * Check file type
     */

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please upload a JPG, PNG or WebP image."
      );

      e.target.value = "";
      return;
    }

    /*
     * Maximum 5MB
     */

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Image must be smaller than 5MB."
      );

      e.target.value = "";
      return;
    }

    /*
     * Get logged-in user
     */

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUploading(true);

    try {
      /*
       * File extension
       */

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      /*
       * Unique file path
       */

      const filePath =
        `${user.id}/avatar-${Date.now()}.${extension}`;

      /*
       * Upload to Supabase Storage
       *
       * Bucket:
       * avatars
       */

      const {
        error: uploadError,
      } = await supabase.storage
        .from("avatars")
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: true,
            contentType: file.type,
          }
        );

      if (uploadError) {
        console.error(
          "Avatar upload error:",
          uploadError
        );

        setError(
          uploadError.message ||
            "Unable to upload photo."
        );

        return;
      }

      /*
       * Get public URL
       */

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl =
        publicUrlData.publicUrl;

      /*
       * Update Profiles table
       */

      const {
        data: updatedProfile,
        error: updateError,
      } = await supabase
        .from("Profiles")
        .update({
          avatar_url: publicUrl,
        })
        .eq("user_id", user.id)
        .select(
          "id, user_id, username, display_name, bio, avatar_url"
        )
        .single();

      if (updateError) {
        console.error(
          "Avatar profile update error:",
          updateError
        );

        setError(
          updateError.message ||
            "Photo uploaded but profile could not be updated."
        );

        return;
      }

      /*
       * Update screen immediately
       */

      setAvatarUrl(publicUrl);

      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      setMessage(
        "Profile photo uploaded successfully!"
      );
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong while uploading the photo."
      );
    } finally {
      setUploading(false);

      /*
       * Allow the same file to be
       * selected again.
       */

      e.target.value = "";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ADD LINK
  |--------------------------------------------------------------------------
  */

  const handleAddLink = async () => {
    setError("");
    setMessage("");

    const title =
      linkTitle.trim();

    const url =
      linkUrl.trim();

    if (!title) {
      setError(
        "Please enter a link title."
      );
      return;
    }

    if (!url) {
      setError(
        "Please enter a link URL."
      );
      return;
    }

    /*
     * Automatically add https://
     */

    let finalUrl = url;

    if (
      !finalUrl.startsWith(
        "http://"
      ) &&
      !finalUrl.startsWith(
        "https://"
      )
    ) {
      finalUrl =
        `https://${finalUrl}`;
    }

    /*
     * Validate URL
     */

    try {
      new URL(finalUrl);
    } catch {
      setError(
        "Please enter a valid URL."
      );
      return;
    }

    if (!userId) {
      setError(
        "You are not logged in."
      );
      return;
    }

    setAddingLink(true);

    try {
      const {
        data,
        error: insertError,
      } = await supabase
        .from("Links")
        .insert({
          user_id: userId,
          title,
          url: finalUrl,
        })
        .select(
          "id, user_id, title, url"
        )
        .single();

      if (insertError) {
        console.error(
          insertError
        );

        setError(
          insertError.message ||
            "Unable to add link."
        );

        setAddingLink(false);
        return;
      }

      setLinks((current) => [
        ...current,
        data,
      ]);

      setLinkTitle("");
      setLinkUrl("");

      setMessage(
        "Link added successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to add link."
      );
    } finally {
      setAddingLink(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE LINK
  |--------------------------------------------------------------------------
  */

  const handleDeleteLink = async (
    linkId: string
  ) => {
    setError("");
    setMessage("");

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this link?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        error: deleteError,
      } = await supabase
        .from("Links")
        .delete()
        .eq("id", linkId)
        .eq("user_id", userId);

      if (deleteError) {
        console.error(
          deleteError
        );

        setError(
          deleteError.message ||
            "Unable to delete link."
        );

        return;
      }

      setLinks((current) =>
        current.filter(
          (link) =>
            link.id !== linkId
        )
      );

      setMessage(
        "Link deleted."
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to delete link."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PUBLIC PROFILE URL
  |--------------------------------------------------------------------------
  */

  const getPublicProfileUrl = () => {
    if (!username) {
      return "";
    }

    if (
      typeof window ===
      "undefined"
    ) {
      return "";
    }

    return `${window.location.origin}/${normalizeUsername(
      username
    )}`;
  };

  /*
  |--------------------------------------------------------------------------
  | COPY PROFILE LINK
  |--------------------------------------------------------------------------
  */

  const handleCopyProfileLink =
    async () => {
      const publicUrl =
        getPublicProfileUrl();

      if (!publicUrl) {
        setError(
          "Please save your username first."
        );

        return;
      }

      try {
        await navigator.clipboard.writeText(
          publicUrl
        );

        setMessage(
          "Profile link copied successfully!"
        );
      } catch (err) {
        console.error(err);

        setError(
          "Unable to copy profile link."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const handleLogout =
    async () => {
      await supabase.auth.signOut();

      router.push("/");
    };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />

          <p className="mt-4 text-sm text-slate-500">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PUBLIC PROFILE URL
  |--------------------------------------------------------------------------
  */

  const publicProfileUrl =
    username
      ? `/${normalizeUsername(
          username
        )}`
      : "";

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <header className="bg-white border-b border-slate-200">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              IV
            </div>

            <span className="text-xl font-bold text-slate-900">
              InstaView
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">

            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Dashboard
            </Link>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
            >
              Logout
            </button>

          </div>

        </div>

      </header>


      {/* CONTENT */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* SUCCESS MESSAGE */}

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* BACK */}

        <div className="mb-6 flex flex-wrap items-center gap-3">

          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to Dashboard
          </Link>

        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* =====================================================
              LEFT SIDE
          ===================================================== */}

          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">

            <h1 className="text-2xl font-bold text-slate-900">
              Profile Information
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Edit the information visitors will see on your public profile.
            </p>


            {/* =================================================
                PROFILE PHOTO
            ================================================= */}

            <div className="mt-8">

              <label className="block text-sm font-medium text-slate-700 mb-3">
                Profile Photo
              </label>

              <div className="flex items-center gap-5">

                {/* CURRENT PHOTO */}

                {avatarUrl ? (

                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                  />

                ) : (

                  <div className="w-24 h-24 rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-bold">
                    {(
                      displayName ||
                      username ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                )}


                {/* UPLOAD */}

                <div>

                  <label
                    htmlFor="profile-photo-upload"
                    className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer transition ${
                      uploading
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {uploading
                      ? "Uploading..."
                      : "Upload Photo"}

                    <input
                      id="profile-photo-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={uploadAvatar}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>

                  <p className="mt-2 text-xs text-slate-400">
                    JPG, PNG or WebP. Maximum 5MB.
                  </p>

                </div>

              </div>

            </div>


            {/* =================================================
                PROFILE PHOTO URL
            ================================================= */}

            <div className="mt-6">

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Profile Photo URL
              </label>

              <input
                type="url"
                value={avatarUrl}
                onChange={(e) =>
                  setAvatarUrl(
                    e.target.value
                  )
                }
                placeholder="https://example.com/photo.jpg"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />

              <p className="mt-2 text-xs text-slate-400">
                You can upload a photo above or paste an image URL here.
              </p>

            </div>


            {/* =================================================
                USERNAME
            ================================================= */}

            <div className="mt-6">

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Username
              </label>

              <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-slate-100 focus-within:border-slate-400">

                <div className="px-4 py-3 bg-slate-50 text-slate-400">
                  /
                </div>

                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value
                        .toLowerCase()
                        .replace(/\s/g, "")
                    )
                  }
                  placeholder="yourname"
                  className="flex-1 px-4 py-3 outline-none"
                />

              </div>

              <p className="mt-2 text-xs text-slate-400">
                3–30 characters. Letters, numbers, hyphens and underscores only.
              </p>

              <p className="mt-1 text-xs text-slate-400">

                Your public profile will be available at:

                {" "}

                <span className="font-medium text-slate-500">
                  /
                  {normalizeUsername(
                    username
                  ) ||
                    "username"}
                </span>

              </p>

            </div>


            {/* =================================================
                DISPLAY NAME
            ================================================= */}

            <div className="mt-6">

              <label className="block text-sm font-medium text-slate-700 mb-2">
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
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />

            </div>


            {/* =================================================
                BIO
            ================================================= */}

            <div className="mt-6">

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bio
              </label>

              <textarea
                value={bio}
                onChange={(e) =>
                  setBio(
                    e.target.value
                  )
                }
                placeholder="Tell people about yourself..."
                rows={5}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none resize-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />

            </div>


            {/* =================================================
                SAVE
            ================================================= */}

            <button
              onClick={
                handleSaveProfile
              }
              disabled={saving}
              className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3.5 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "Saving..."
                : "Save Profile"}
            </button>

          </section>


          {/* =====================================================
              RIGHT SIDE
          ===================================================== */}

          <section className="space-y-8">


            {/* =================================================
                PUBLIC PROFILE
            ================================================= */}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">

              <h2 className="text-2xl font-bold text-slate-900">
                Your Public Profile
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                This is how your profile will appear to visitors.
              </p>


              {/* PREVIEW */}

              <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">

                {avatarUrl ? (

                  <img
                    src={avatarUrl}
                    alt="Preview"
                    className="w-24 h-24 mx-auto rounded-full object-cover shadow-sm"
                  />

                ) : (

                  <div className="w-24 h-24 mx-auto rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-bold">
                    {(
                      displayName ||
                      username ||
                      "U"
                    )
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
                  @
                  {normalizeUsername(
                    username
                  ) ||
                    "username"}
                </p>

                {bio && (
                  <p className="mt-3 text-sm text-slate-600">
                    {bio}
                  </p>
                )}

              </div>


              {/* BUTTONS */}

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">

                <Link
                  href={
                    publicProfileUrl ||
                    "/"
                  }
                  target={
                    username
                      ? "_blank"
                      : undefined
                  }
                  className={`rounded-xl px-5 py-3 text-center text-sm font-semibold border ${
                    username
                      ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                      : "border-slate-100 text-slate-300 pointer-events-none"
                  }`}
                >
                  View Public Profile
                </Link>


                <button
                  onClick={
                    handleCopyProfileLink
                  }
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Copy Profile Link
                </button>

              </div>


              {/* PUBLIC URL */}

              {username && (

                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-500 break-all">

                  {typeof window !==
                  "undefined"
                    ? `${window.location.origin}/${normalizeUsername(
                        username
                      )}`
                    : `/${normalizeUsername(
                        username
                      )}`}

                </div>

              )}

            </div>


            {/* =================================================
                LINKS
            ================================================= */}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">

              <h2 className="text-2xl font-bold text-slate-900">
                Profile Links
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Add websites and social media links to your public profile.
              </p>


              {/* EXISTING LINKS */}

              <div className="mt-6 space-y-3">

                {links.length === 0 ? (

                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                    No links added yet.
                  </div>

                ) : (

                  links.map(
                    (link) => (

                      <div
                        key={link.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"
                      >

                        <div className="flex-1 min-w-0">

                          <p className="font-semibold text-slate-800 truncate">
                            {link.title}
                          </p>

                          <p className="text-xs text-slate-400 truncate mt-1">
                            {link.url}
                          </p>

                        </div>


                        <a
                          href={
                            link.url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          View
                        </a>


                        <button
                          onClick={() =>
                            handleDeleteLink(
                              link.id
                            )
                          }
                          className="px-3 py-2 rounded-lg border border-red-100 text-xs font-medium text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>

                      </div>

                    )
                  )

                )}

              </div>


              {/* ADD LINK */}

              <div className="mt-6 border-t border-slate-100 pt-6">

                <h3 className="font-semibold text-slate-900">
                  Add New Link
                </h3>

                <div className="mt-4 space-y-3">

                  <input
                    type="text"
                    value={
                      linkTitle
                    }
                    onChange={(e) =>
                      setLinkTitle(
                        e.target.value
                      )
                    }
                    placeholder="Link title e.g. Instagram"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />

                  <input
                    type="url"
                    value={
                      linkUrl
                    }
                    onChange={(e) =>
                      setLinkUrl(
                        e.target.value
                      )
                    }
                    placeholder="https://instagram.com/username"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />

                  <button
                    onClick={
                      handleAddLink
                    }
                    disabled={
                      addingLink
                    }
                    className="w-full rounded-xl bg-slate-900 px-5 py-3 text-white font-semibold hover:bg-slate-800 disabled:opacity-50"
                  >
                    {addingLink
                      ? "Adding..."
                      : "+ Add Link"}
                  </button>

                </div>

              </div>

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}