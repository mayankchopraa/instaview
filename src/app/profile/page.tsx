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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("Profiles")
      .select("username, display_name, bio, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      setMessage(profileError.message);
    }

    if (profile) {
      setUsername(profile.username || "");
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
    }

    const { data: linksData, error: linksError } = await supabase
      .from("Links")
      .select("id, title, url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (linksError) {
      setMessage(linksError.message);
    }

    setLinks(linksData || []);
    setLoading(false);
  };


  /* SAVE PROFILE */
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setMessage("Username is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");

    const { error } = await supabase
      .from("Profiles")
      .upsert(
        {
          user_id: user.id,
          username: cleanUsername,
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl || null,
        },
        {
          onConflict: "user_id",
        }
      );

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setUsername(cleanUsername);
    setMessage("Profile saved successfully!");
    setSaving(false);
  };


  /* UPLOAD PHOTO */
  const uploadAvatar = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image must be smaller than 5MB.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setUploading(true);
    setMessage("");

    const extension = file.name.split(".").pop() || "jpg";

    const filePath =
      `${user.id}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      setMessage(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from("Profiles")
      .update({
        avatar_url: publicUrl,
      })
      .eq("user_id", user.id);

    if (updateError) {
      setMessage(updateError.message);
      setUploading(false);
      return;
    }

    setAvatarUrl(publicUrl);
    setMessage("Profile photo updated successfully!");
    setUploading(false);
  };


  /* ADD LINK */
  const addLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!linkTitle.trim() || !linkUrl.trim()) {
      setMessage("Please enter both the link title and URL.");
      return;
    }

    let validUrl = linkUrl.trim();

    if (
      !validUrl.startsWith("http://") &&
      !validUrl.startsWith("https://")
    ) {
      validUrl = `https://${validUrl}`;
    }

    setLinkSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("Links")
      .insert({
        user_id: user.id,
        title: linkTitle.trim(),
        url: validUrl,
      })
      .select("id, title, url")
      .single();

    if (error) {
      setMessage(error.message);
      setLinkSaving(false);
      return;
    }

    if (data) {
      setLinks((current) => [...current, data]);
    }

    setLinkTitle("");
    setLinkUrl("");
    setMessage("Link added successfully!");
    setLinkSaving(false);
  };


  /* EDIT LINK */
  const editLink = async (
    id: string,
    currentTitle: string,
    currentUrl: string
  ) => {
    const newTitle = window.prompt(
      "Enter link title:",
      currentTitle
    );

    if (newTitle === null) return;

    const newUrlInput = window.prompt(
      "Enter link URL:",
      currentUrl
    );

    if (newUrlInput === null) return;

    if (!newTitle.trim() || !newUrlInput.trim()) {
      setMessage("Both fields are required.");
      return;
    }

    let newUrl = newUrlInput.trim();

    if (
      !newUrl.startsWith("http://") &&
      !newUrl.startsWith("https://")
    ) {
      newUrl = `https://${newUrl}`;
    }

    const { data, error } = await supabase
      .from("Links")
      .update({
        title: newTitle.trim(),
        url: newUrl,
      })
      .eq("id", id)
      .select("id, title, url")
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data) {
      setLinks((current) =>
        current.map((link) =>
          link.id === id ? data : link
        )
      );
    }

    setMessage("Link updated successfully!");
  };


  /* DELETE LINK */
  const deleteLink = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this link?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("Links")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setLinks((current) =>
      current.filter((link) => link.id !== id)
    );

    setMessage("Link deleted successfully!");
  };


  /* COPY PUBLIC PROFILE URL */
  const copyProfileUrl = async () => {
    if (!username) {
      setMessage("Please save your username first.");
      return;
    }

    const url =
      `${window.location.origin}/${username}`;

    await navigator.clipboard.writeText(url);

    setMessage("Profile link copied!");
  };


  /* LOGOUT */
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };


  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Loading your profile...
        </p>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-slate-100">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <Link
            href="/"
            className="text-xl font-bold text-slate-900"
          >
            InstaView
          </Link>

          <div className="flex items-center gap-3">

            {username && (
              <Link
                href={`/${username}`}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View Public Profile
              </Link>
            )}

            <button
              onClick={logout}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>

          </div>

        </div>
      </header>


      {/* PAGE */}
      <div className="mx-auto max-w-6xl px-6 py-10">

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-slate-900">
            Edit Your Profile
          </h1>

          <p className="mt-2 text-slate-500">
            Manage your profile, photo and links.
          </p>

        </div>


        {/* MESSAGE */}
        {message && (
          <div className="mb-6 rounded-xl bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
            {message}
          </div>
        )}


        <div className="grid gap-8 lg:grid-cols-3">


          {/* LEFT */}
          <div className="space-y-8 lg:col-span-2">


            {/* PROFILE */}
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
                    {(displayName || username || "U")
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


              {/* FORM */}
              <form
                onSubmit={saveProfile}
                className="mt-8 space-y-5"
              >

                {/* USERNAME */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Username
                  </label>

                  <div className="flex items-center rounded-xl border border-slate-200">

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
                            .replace(/\s+/g, "-")
                            .replace(/[^a-z0-9-_]/g, "")
                        )
                      }
                      placeholder="yourname"
                      className="w-full rounded-xl px-2 py-3 outline-none"
                    />

                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Your public profile will be available at /{username || "username"}
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
                      setDisplayName(e.target.value)
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
                      setBio(e.target.value)
                    }
                    rows={4}
                    placeholder="Tell people about yourself..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
                  />

                </div>


                {/* SAVE */}
                <button
                  type="submit"
                  disabled={saving}
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
                onSubmit={addLink}
                className="mt-6 space-y-4"
              >

                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) =>
                    setLinkTitle(e.target.value)
                  }
                  placeholder="Link title e.g. Instagram"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
                />

                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) =>
                    setLinkUrl(e.target.value)
                  }
                  placeholder="https://example.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
                />

                <button
                  type="submit"
                  disabled={linkSaving}
                  className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {linkSaving
                    ? "Adding..."
                    : "Add Link"}
                </button>

              </form>


              {/* EXISTING LINKS */}
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
                          onClick={() =>
                            deleteLink(link.id)
                          }
                          className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
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


          {/* RIGHT - PUBLIC PROFILE PREVIEW */}
          <aside className="lg:sticky lg:top-8 lg:self-start">

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Your Public Profile
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                This is how your profile will appear to visitors.
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
                    {(displayName || username || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}


                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  {displayName || username || "Your Name"}
                </h3>

                <p className="text-sm text-slate-500">
                  @{username || "username"}
                </p>


                {bio && (
                  <p className="mt-3 text-sm text-slate-600">
                    {bio}
                  </p>
                )}


                <div className="mt-5 space-y-2">

                  {links.slice(0, 3).map((link) => (
                    <div
                      key={link.id}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
                    >
                      {link.title}
                    </div>
                  ))}

                </div>

              </div>


              {/* ACTIONS */}
              <div className="mt-5 grid grid-cols-1 gap-3">

                {username && (
                  <Link
                    href={`/${username}`}
                    target="_blank"
                    className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    View Public Profile
                  </Link>
                )}

                <button
                  onClick={copyProfileUrl}
                  disabled={!username}
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