"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ProfileLink = {
  id: string;
  title: string;
  url: string;
};

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linkSaving, setLinkSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  /*
   * LOAD PROFILE
   */
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

      /*
       * FIND EXISTING PROFILE
       */
      const {
        data: existingProfile,
        error: profileError,
      } = await supabase
        .from("Profiles")
        .select(
          "user_id, username, display_name, bio, avatar_url"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Profile loading error:",
          profileError
        );

        setError(profileError.message);
      }

      /*
       * EXISTING PROFILE
       */
      if (existingProfile) {
        setUsername(
          existingProfile.username || ""
        );

        setDisplayName(
          existingProfile.display_name || ""
        );

        setBio(
          existingProfile.bio || ""
        );

        setAvatarUrl(
          existingProfile.avatar_url || ""
        );
      } else {
        /*
         * NEW USER
         *
         * Works for:
         * Google
         * Facebook
         * GitHub
         * Email signup
         */
        const metadata =
          user.user_metadata || {};

        const providerName =
          metadata.full_name ||
          metadata.name ||
          "";

        const providerAvatar =
          metadata.avatar_url ||
          metadata.picture ||
          "";

        /*
         * Create empty profile.
         *
         * Username remains empty until
         * user chooses one.
         */
        const {
          error: createError,
        } = await supabase
          .from("Profiles")
          .insert({
            user_id: user.id,
            username: null,
            display_name:
              providerName || null,
            bio: null,
            avatar_url:
              providerAvatar || null,
          });

        if (createError) {
          console.error(
            "Profile creation error:",
            createError
          );

          setError(
            createError.message
          );
        } else {
          setDisplayName(
            providerName
          );

          setAvatarUrl(
            providerAvatar
          );
        }
      }

      /*
       * LOAD LINKS
       */
      const {
        data: linksData,
        error: linksError,
      } = await supabase
        .from("Links")
        .select("id, title, url")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: true,
        });

      if (linksError) {
        console.error(
          "Links loading error:",
          linksError
        );

        setError(
          linksError.message
        );
      }

      setLinks(
        linksData || []
      );
    } catch (error) {
      console.error(
        "Profile loading error:",
        error
      );

      setError(
        "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * SAVE PROFILE
   */
  const saveProfile = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setMessage("");
    setError("");

    /*
     * USERNAME REQUIRED
     */
    if (!username.trim()) {
      setError(
        "Username is required."
      );
      return;
    }

    /*
     * CLEAN USERNAME
     */
    const cleanUsername =
      username
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(
          /[^a-z0-9-_]/g,
          ""
        );

    /*
     * MINIMUM USERNAME LENGTH
     */
    if (cleanUsername.length < 3) {
      setError(
        "Username must be at least 3 characters."
      );
      return;
    }

    /*
     * MAXIMUM USERNAME LENGTH
     */
    if (cleanUsername.length > 30) {
      setError(
        "Username cannot be longer than 30 characters."
      );
      return;
    }

    /*
     * USERNAME FORMAT
     */
    if (
      !/^[a-z0-9][a-z0-9-_]*$/.test(
        cleanUsername
      )
    ) {
      setError(
        "Username can only contain letters, numbers, hyphens and underscores."
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href =
          "/login";
        return;
      }

      /*
       * CHECK IF USERNAME IS ALREADY
       * USED BY ANOTHER USER
       */
      const {
        data: usernameOwner,
        error: usernameCheckError,
      } = await supabase
        .from("Profiles")
        .select("user_id")
        .eq(
          "username",
          cleanUsername
        )
        .neq(
          "user_id",
          user.id
        )
        .maybeSingle();

      if (usernameCheckError) {
        console.error(
          "Username check error:",
          usernameCheckError
        );

        setError(
          "Unable to check username availability. Please try again."
        );

        return;
      }

      if (usernameOwner) {
        setError(
          "This username is already taken. Please choose another."
        );

        return;
      }

      /*
       * CHECK RESERVED USERNAME
       *
       * Prevent users from using
       * application routes as usernames.
       *
       * Example:
       * /login
       * /signup
       * /dashboard
       * /profile
       * /settings
       */
      const {
        data: reservedUsername,
        error: reservedUsernameError,
      } = await supabase
        .from("ReservedUsernames")
        .select("username")
        .eq(
          "username",
          cleanUsername
        )
        .maybeSingle();

      if (reservedUsernameError) {
        console.error(
          "Reserved username check error:",
          reservedUsernameError
        );

        setError(
          "Unable to check reserved usernames. Please try again."
        );

        return;
      }

      if (reservedUsername) {
        setError(
          `"${cleanUsername}" is reserved. Please choose another username.`
        );

        return;
      }

      /*
       * SAVE PROFILE
       */
      const {
        error: saveError,
      } = await supabase
        .from("Profiles")
        .upsert(
          {
            user_id: user.id,
            username:
              cleanUsername,
            display_name:
              displayName.trim() ||
              null,
            bio:
              bio.trim() ||
              null,
            avatar_url:
              avatarUrl ||
              null,
          },
          {
            onConflict:
              "user_id",
          }
        );

      if (saveError) {
        console.error(
          "Save profile error:",
          saveError
        );

        setError(
          saveError.message
        );

        return;
      }

      setUsername(
        cleanUsername
      );

      setMessage(
        "Profile saved successfully!"
      );
    } catch (error) {
      console.error(
        "Save profile error:",
        error
      );

      setError(
        "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * UPLOAD PROFILE PHOTO
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
     * CHECK FILE TYPE
     */
    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Please select an image file."
      );

      return;
    }

    /*
     * MAX 5MB
     */
    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Image must be smaller than 5MB."
      );

      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href =
        "/login";

      return;
    }

    setUploading(true);

    try {
      const extension =
        file.name
          .split(".")
          .pop() ||
        "jpg";

      const filePath =
        `${user.id}/avatar-${Date.now()}.${extension}`;

      /*
       * UPLOAD
       */
      const {
        error: uploadError,
      } = await supabase.storage
        .from("avatars")
        .upload(
          filePath,
          file,
          {
            upsert: true,
          }
        );

      if (uploadError) {
        console.error(
          "Avatar upload error:",
          uploadError
        );

        setError(
          uploadError.message
        );

        return;
      }

      /*
       * GET PUBLIC URL
       */
      const {
        data,
      } =
        supabase.storage
          .from("avatars")
          .getPublicUrl(
            filePath
          );

      const publicUrl =
        data.publicUrl;

      /*
       * SAVE URL TO PROFILE
       */
      const {
        error: updateError,
      } = await supabase
        .from("Profiles")
        .upsert(
          {
            user_id: user.id,
            avatar_url:
              publicUrl,
          },
          {
            onConflict:
              "user_id",
          }
        );

      if (updateError) {
        console.error(
          "Avatar profile update error:",
          updateError
        );

        setError(
          updateError.message
        );

        return;
      }

      setAvatarUrl(
        publicUrl
      );

      setMessage(
        "Profile photo updated successfully!"
      );
    } catch (error) {
      console.error(
        "Avatar upload error:",
        error
      );

      setError(
        "Unable to upload the photo."
      );
    } finally {
      setUploading(false);
    }
  };

  /*
   * ADD LINK
   */
  const addLink = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setMessage("");
    setError("");

    /*
     * REQUIRED FIELDS
     */
    if (
      !linkTitle.trim() ||
      !linkUrl.trim()
    ) {
      setError(
        "Please enter both the link title and URL."
      );

      return;
    }

    let validUrl =
      linkUrl.trim();

    /*
     * ADD HTTPS IF NEEDED
     */
    if (
      !validUrl.startsWith(
        "http://"
      ) &&
      !validUrl.startsWith(
        "https://"
      )
    ) {
      validUrl =
        `https://${validUrl}`;
    }

    /*
     * BASIC URL VALIDATION
     */
    try {
      new URL(validUrl);
    } catch {
      setError(
        "Please enter a valid URL."
      );

      return;
    }

    setLinkSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href =
          "/login";

        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("Links")
        .insert({
          user_id:
            user.id,
          title:
            linkTitle.trim(),
          url: validUrl,
        })
        .select(
          "id, title, url"
        )
        .single();

      if (error) {
        console.error(
          "Add link error:",
          error
        );

        setError(
          error.message
        );

        return;
      }

      if (data) {
        setLinks(
          (current) => [
            ...current,
            data,
          ]
        );
      }

      setLinkTitle("");
      setLinkUrl("");

      setMessage(
        "Link added successfully!"
      );
    } catch (error) {
      console.error(
        "Add link error:",
        error
      );

      setError(
        "Unable to add link."
      );
    } finally {
      setLinkSaving(false);
    }
  };

  /*
   * EDIT LINK
   */
  const editLink = async (
    id: string,
    currentTitle: string,
    currentUrl: string
  ) => {
    const newTitle =
      window.prompt(
        "Enter link title:",
        currentTitle
      );

    if (
      newTitle === null
    ) {
      return;
    }

    const newUrlInput =
      window.prompt(
        "Enter link URL:",
        currentUrl
      );

    if (
      newUrlInput === null
    ) {
      return;
    }

    if (
      !newTitle.trim() ||
      !newUrlInput.trim()
    ) {
      setError(
        "Both fields are required."
      );

      return;
    }

    let newUrl =
      newUrlInput.trim();

    if (
      !newUrl.startsWith(
        "http://"
      ) &&
      !newUrl.startsWith(
        "https://"
      )
    ) {
      newUrl =
        `https://${newUrl}`;
    }

    /*
     * VALIDATE URL
     */
    try {
      new URL(newUrl);
    } catch {
      setError(
        "Please enter a valid URL."
      );

      return;
    }

    setMessage("");
    setError("");

    try {
      const {
        data,
        error,
      } = await supabase
        .from("Links")
        .update({
          title:
            newTitle.trim(),
          url: newUrl,
        })
        .eq(
          "id",
          id
        )
        .select(
          "id, title, url"
        )
        .single();

      if (error) {
        console.error(
          "Edit link error:",
          error
        );

        setError(
          error.message
        );

        return;
      }

      if (data) {
        setLinks(
          (current) =>
            current.map(
              (link) =>
                link.id === id
                  ? data
                  : link
            )
        );
      }

      setMessage(
        "Link updated successfully!"
      );
    } catch (error) {
      console.error(
        "Edit link error:",
        error
      );

      setError(
        "Unable to update link."
      );
    }
  };

  /*
   * DELETE LINK
   */
  const deleteLink = async (
    id: string
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this link?"
      );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const {
        error,
      } = await supabase
        .from("Links")
        .delete()
        .eq(
          "id",
          id
        );

      if (error) {
        console.error(
          "Delete link error:",
          error
        );

        setError(
          error.message
        );

        return;
      }

      setLinks(
        (current) =>
          current.filter(
            (link) =>
              link.id !== id
          )
      );

      setMessage(
        "Link deleted successfully!"
      );
    } catch (error) {
      console.error(
        "Delete link error:",
        error
      );

      setError(
        "Unable to delete link."
      );
    }
  };

  /*
   * COPY PUBLIC PROFILE URL
   */
  const copyProfileUrl =
    async () => {
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
      } catch (error) {
        console.error(
          "Copy link error:",
          error
        );

        setError(
          "Unable to copy profile link."
        );
      }
    };

  /*
   * LOGOUT
   */
  const logout = async () => {
    await supabase.auth.signOut();

    window.location.href =
      "/";
  };

  /*
   * LOADING
   */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm text-slate-500">
            Loading your profile...
          </p>

        </div>
      </main>
    );
  }

  /*
   * PAGE
   */
  return (
    <main className="min-h-screen bg-slate-100">

      {/* HEADER */}
      <header className="border-b bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">

          {/* LOGO */}
          <Link
            href="/"
            className="text-xl font-bold text-slate-900"
          >
            InstaView
          </Link>

          {/* HEADER ACTIONS */}
          <div className="flex items-center gap-3">

            {/* DASHBOARD */}
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Dashboard
            </Link>

            {/* PUBLIC PROFILE */}
            {username && (
              <Link
                href={`/${username}`}
                target="_blank"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View Public Profile
              </Link>
            )}

            {/* LOGOUT */}
            <button
              onClick={logout}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Logout
            </button>

          </div>

        </div>

      </header>


      {/* PAGE CONTENT */}
      <div className="mx-auto max-w-6xl px-6 py-10">

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-slate-900">
            Edit Your Profile
          </h1>

          <p className="mt-2 text-slate-500">
            Manage your profile, photo and links.
          </p>

        </div>


        {/* SUCCESS MESSAGE */}
        {message && (
          <div className="mb-4 rounded-xl border border-green-100 bg-green-50 px-5 py-4 text-sm text-green-700">
            {message}
          </div>
        )}


        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}


        <div className="grid gap-8 lg:grid-cols-3">

          {/* LEFT SIDE */}
          <div className="space-y-8 lg:col-span-2">

            {/* PROFILE INFORMATION */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Profile Information
              </h2>


              {/* PHOTO */}
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

                  <label className="inline-block cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">

                    {uploading
                      ? "Uploading..."
                      : "Change Photo"}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        uploadAvatar
                      }
                      disabled={
                        uploading
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
                onSubmit={
                  saveProfile
                }
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
                      value={
                        username
                      }
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
                      placeholder="yourname"
                      maxLength={30}
                      className="w-full rounded-xl px-2 py-3 outline-none"
                    />

                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Your public profile will be available at /
                    {username ||
                      "username"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    3–30 characters. Letters, numbers, hyphens and underscores only.
                  </p>

                </div>


                {/* DISPLAY NAME */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Display Name
                  </label>

                  <input
                    type="text"
                    value={
                      displayName
                    }
                    onChange={(e) =>
                      setDisplayName(
                        e.target.value
                      )
                    }
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    {bio.length}/300
                  </p>

                </div>


                {/* SAVE */}
                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Profile"}
                </button>

              </form>

            </section>


            {/* LINKS */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                My Links
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Add the links you want visitors to see on your public profile.
              </p>


              {/* ADD LINK */}
              <form
                onSubmit={
                  addLink
                }
                className="mt-6 space-y-4"
              >

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
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
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
                  placeholder="https://example.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
                />

                <button
                  type="submit"
                  disabled={
                    linkSaving
                  }
                  className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {linkSaving
                    ? "Adding..."
                    : "Add Link"}
                </button>

              </form>


              {/* EXISTING LINKS */}
              <div className="mt-8 space-y-3">

                {links.length ===
                0 ? (

                  <p className="text-sm text-slate-400">
                    No links added yet.
                  </p>

                ) : (

                  links.map(
                    (link) => (

                      <div
                        key={
                          link.id
                        }
                        className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >

                        <div className="min-w-0">

                          <p className="font-medium text-slate-900">
                            {
                              link.title
                            }
                          </p>

                          <p className="mt-1 break-all text-sm text-slate-500">
                            {
                              link.url
                            }
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
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
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
                            className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                          >
                            Delete
                          </button>

                        </div>

                      </div>

                    )
                  )

                )}

              </div>

            </section>

          </div>


          {/* RIGHT SIDE - PREVIEW */}
          <aside className="lg:sticky lg:top-8 lg:self-start">

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
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


                <div className="mt-5 space-y-2">

                  {links
                    .slice(0, 3)
                    .map(
                      (link) => (

                        <div
                          key={
                            link.id
                          }
                          className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
                        >
                          {
                            link.title
                          }
                        </div>

                      )
                    )}

                </div>

              </div>


              {/* ACTIONS */}
              <div className="mt-5 grid grid-cols-1 gap-3">

                {/* VIEW PROFILE */}
                {username && (
                  <Link
                    href={`/${username}`}
                    target="_blank"
                    className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    View Public Profile
                  </Link>
                )}


                {/* COPY LINK */}
                <button
                  type="button"
                  onClick={
                    copyProfileUrl
                  }
                  disabled={
                    !username
                  }
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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