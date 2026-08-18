"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type Link = {
  id: string;
  title: string;
  url: string;
};

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) return;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      const { data: profileData, error: profileError } = await supabase
        .from("Profiles")
        .select("user_id, username, display_name, bio, avatar_url")
        .eq("username", username)
        .single();

      if (profileError || !profileData) {
        setError("Profile not found.");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: linksData, error: linksError } = await supabase
        .from("Links")
        .select("id, title, url")
        .eq("user_id", profileData.user_id)
        .order("id", { ascending: true });

      if (!linksError && linksData) {
        setLinks(linksData);
      }

      setLoading(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.id !== profileData.user_id) {
        await supabase.from("Analytics").insert({
          user_id: profileData.user_id,
          viewer_id: user.id,
          profile_view: true,
        });
      }
    };

    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-slate-600 text-sm">Loading profile...</div>
      </main>
    );
  }

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

          <a
            href="/"
            className="inline-block mt-6 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
          >
            ← Back to Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400" />

          <div className="px-6 pb-8">
            <div className="flex justify-center -mt-14">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.username}
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center text-4xl">
                  👤
                </div>
              )}
            </div>

            <div className="text-center mt-4">
              <h1 className="text-2xl font-bold text-slate-900">
                {profile.display_name || profile.username}
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

            <div className="mt-8 space-y-3">
              {links.length > 0 ? (
                links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
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

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by InstaView
        </p>
      </div>
    </main>
  );
}