"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ShareLink = {
  id: string;
  user_id: string;
  title: string | null;
  file_name: string | null;
  file_path: string | null;
  file_url: string | null;
  share_code: string;
  created_at: string;
};

export default function SharePage() {
  const params = useParams();
  const code = params?.code as string;

  const [share, setShare] = useState<ShareLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) {
      setError("Invalid share link.");
      setLoading(false);
      return;
    }

    loadShare();
  }, [code]);

  async function loadShare() {
    try {
      setLoading(true);
      setError("");

      // Find the share link
      const { data, error: shareError } = await supabase
        .from("ShareLinks")
        .select(
          "id, user_id, title, file_name, file_path, file_url, share_code, created_at"
        )
        .eq("share_code", code)
        .maybeSingle();

      if (shareError) {
        console.error("Share link error:", shareError);
        setError("Unable to load this share link.");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("This share link does not exist or is no longer available.");
        setLoading(false);
        return;
      }

      setShare(data);

      // Record the visit
      try {
        await supabase.from("ShareVisits").insert({
          share_id: data.id,
          visitor_user_id: null,
          user_agent:
            typeof navigator !== "undefined"
              ? navigator.userAgent
              : null,
          referrer:
            typeof document !== "undefined"
              ? document.referrer || null
              : null,
        });
      } catch (visitError) {
        // Tracking failure should not prevent the file from opening
        console.error("Visit tracking error:", visitError);
      }

      setLoading(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong while loading this share link.");
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  function openFile() {
    if (!share) return;

    const fileUrl = share.file_url;

    if (!fileUrl) {
      setError("The file associated with this link is unavailable.");
      return;
    }

    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />

          <p className="text-sm text-gray-500">
            Loading shared file...
          </p>
        </div>
      </main>
    );
  }

  if (error || !share) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-7 w-7 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-gray-900">
            Share link unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {error || "This shared file could not be found."}
          </p>

          <a
            href="/"
            className="mt-6 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Go to InstaView
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="flex items-center">
            <img
              src="/logo-full.png"
              alt="InstaView"
              className="h-auto w-[150px] object-contain sm:w-[180px]"
            />
          </a>

          <a
            href="/"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            InstaView
          </a>
        </div>
      </header>

      {/* Main */}
      <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-3xl items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full">
          {/* Shared via */}
          <div className="mb-6 text-center">
            <p className="text-sm font-medium text-gray-500">
              Shared via InstaView
            </p>
          </div>

          {/* Card */}
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            {/* Top section */}
            <div className="border-b border-gray-100 px-6 py-8 sm:px-10">
              <div className="flex flex-col items-center text-center">
                {/* File icon */}
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50">
                  <svg
                    className="h-10 w-10 text-indigo-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 2v6h6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 13h8M8 17h6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <h1 className="max-w-xl break-words text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                  {share.title || share.file_name || "Shared File"}
                </h1>

                {share.file_name && share.title && (
                  <p className="mt-2 max-w-xl break-all text-sm text-gray-500">
                    {share.file_name}
                  </p>
                )}

                <p className="mt-3 text-xs text-gray-400">
                  Shared on{" "}
                  {new Date(share.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-7 sm:px-10">
              <button
                type="button"
                onClick={openFile}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-[0.99]"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M12 3v12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m7 10 5 5 5-5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 21h14"
                    strokeLinecap="round"
                  />
                </svg>

                Open File
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.99]"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect
                    x="9"
                    y="9"
                    width="13"
                    height="13"
                    rx="2"
                  />
                  <path
                    d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                  />
                </svg>

                {copied ? "Link Copied!" : "Copy Share Link"}
              </button>

              {/* Share code */}
              <div className="mt-6 rounded-xl bg-gray-50 px-4 py-3 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Share Code
                </p>

                <p className="mt-1 break-all font-mono text-sm text-gray-700">
                  {share.share_code}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-400">
            Shared securely through InstaView
          </p>
        </div>
      </section>
    </main>
  );
}