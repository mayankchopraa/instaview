"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const trackVisit = async () => {
      try {
        await supabase.from("Visits").insert({
          visitor_id: crypto.randomUUID(),
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });
      } catch (error) {
        console.error("Visit tracking error:", error);
      }
    };

    trackVisit();

    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        if (user) {
          const { data: profile } = await supabase
            .from("Profiles")
            .select("username")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profile?.username) {
            setUsername(profile.username);
          }
        }
      } catch (error) {
        console.error("User loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profile } = await supabase
          .from("Profiles")
          .select("username")
          .eq("user_id", session.user.id)
          .maybeSingle();

        setUsername(profile?.username || "");
      } else {
        setUsername("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsername("");
  };

  return (
    <main className="min-h-screen bg-white text-[#0B1026]">

      {/* Navigation */}
      <nav className="border-b border-[#EEEAFD] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <Link href="/" className="flex items-center">
            <img
              src="/logo-full.png"
              alt="InstaView"
              className="h-auto w-[150px] object-contain sm:w-[180px]"
            />
          </Link>

          <div className="flex items-center gap-3">

            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-lg bg-[#F3F0FF]" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#475569] transition hover:bg-[#F7F6FF] hover:text-[#6C5CE7]"
                >
                  Dashboard
                </Link>

                <Link
                  href="/profile"
                  className="hidden rounded-lg px-4 py-2 text-sm font-medium text-[#475569] transition hover:bg-[#F7F6FF] hover:text-[#6C5CE7] sm:block"
                >
                  Edit Profile
                </Link>

                {username && (
                  <Link
                    href={`/${username}`}
                    target="_blank"
                    className="hidden rounded-lg border border-[#E5E1FA] px-4 py-2 text-sm font-medium text-[#475569] transition hover:border-[#6C5CE7] hover:bg-[#F7F6FF] hover:text-[#6C5CE7] md:block"
                  >
                    View Profile
                  </Link>
                )}

                <button
                  onClick={logout}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#475569] transition hover:bg-[#F7F6FF] hover:text-[#6C5CE7]"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#475569] transition hover:text-[#6C5CE7]"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  className="rounded-lg bg-[#6C5CE7] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#5848D6]"
                >
                  Get Started
                </Link>
              </>
            )}

          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-20 text-center sm:pt-28">

          <div className="mx-auto mb-6 inline-flex items-center rounded-full border border-[#E5E1FA] bg-[#F7F6FF] px-4 py-2 text-sm font-medium text-[#6C5CE7]">
            Understand your social audience
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-[#0B1026] sm:text-6xl lg:text-7xl">
            Know who interacts with your
            <span className="block text-[#6C5CE7]">
              online presence.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#64748B]">
            Create your personal InstaView link and understand how visitors
            interact with your profile, links and content.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">

            {loading ? (
              <div className="h-14 w-56 animate-pulse rounded-xl bg-[#F3F0FF]" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-[#6C5CE7] px-8 py-4 font-semibold text-white transition hover:bg-[#5848D6]"
                >
                  Dashboard
                </Link>

                {username && (
                  <Link
                    href={`/${username}`}
                    target="_blank"
                    className="rounded-xl border border-[#E5E1FA] px-8 py-4 font-semibold text-[#18213A] transition hover:border-[#6C5CE7] hover:bg-[#F7F6FF] hover:text-[#6C5CE7]"
                  >
                    View Profile
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="rounded-xl border border-[#E5E1FA] px-4 py-3 font-semibold text-[#18213A] transition hover:border-[#6C5CE7] hover:bg-[#F7F6FF] hover:text-[#6C5CE7]"
                >
                  Edit Profile
                </Link>
              </>
            ) : (
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">

                <a
                  href="/signup"
                  className="flex h-14 w-full max-w-[320px] items-center justify-center rounded-xl bg-[#6C5CE7] px-8 text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#5848D6] hover:shadow-lg"
                >
                  Create Your Free Profile
                </a>

                <a
                  href="#how-it-works"
                  className="flex h-14 w-full max-w-[220px] items-center justify-center rounded-xl border border-[#E5E1FA] bg-white px-8 text-base font-semibold text-[#18213A] transition-all duration-200 hover:border-[#6C5CE7] hover:text-[#6C5CE7]"
                >
                  See How It Works
                </a>

              </div>
            )}

          </div>

          {/* Example Link */}
          <div className="mx-auto mt-14 max-w-xl rounded-2xl border border-[#E5E1FA] bg-[#F7F6FF] p-5 text-left shadow-sm">

            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#8B84AA]">
              Your InstaView link
            </p>

            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">

              <span className="text-sm font-medium text-[#475569]">
                instaview.app/mayank
              </span>

              <span className="rounded-lg bg-[#EEEAFE] px-3 py-1.5 text-xs font-semibold text-[#6C5CE7]">
                Copy
              </span>

            </div>

          </div>

        </div>
      </section>

      {/* Features */}
      <section className="border-y border-[#E5E1FA] bg-[#F7F6FF]">

        <div className="mx-auto max-w-6xl px-6 py-20">

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-sm font-semibold uppercase tracking-wider text-[#6C5CE7]">
              Simple insights
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0B1026] sm:text-4xl">
              Turn profile traffic into useful information.
            </h2>

            <p className="mt-4 text-[#64748B]">
              See what people do after they arrive through your InstaView
              profile.
            </p>

          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">

            <Feature
              number="01"
              title="Track visits"
              description="Understand how many people are visiting your InstaView profile."
            />

            <Feature
              number="02"
              title="Understand activity"
              description="See which links and sections visitors interact with."
            />

            <Feature
              number="03"
              title="Identify interest"
              description="Recognize returning visitors and stronger engagement patterns."
            />

          </div>

        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="bg-white"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">

          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

            <div>

              <p className="text-sm font-semibold uppercase tracking-wider text-[#6C5CE7]">
                How it works
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0B1026] sm:text-4xl">
                One link. Better understanding.
              </h2>

              <p className="mt-5 leading-7 text-[#64748B]">
                Add your InstaView link to your Instagram bio or anywhere you
                want people to discover you.
              </p>

              <div className="mt-8 space-y-5">

                <Step
                  number="1"
                  title="Create your profile"
                  description="Set up your personal InstaView page."
                />

                <Step
                  number="2"
                  title="Share your link"
                  description="Add it to your Instagram bio or social profiles."
                />

                <Step
                  number="3"
                  title="Understand interactions"
                  description="See visits and activity through your dashboard."
                />

              </div>

            </div>

            {/* Dashboard Mockup */}
            <div className="rounded-3xl border border-[#E5E1FA] bg-[#F7F6FF] p-5 shadow-xl shadow-[#EEEAFE]">

              <div className="rounded-2xl bg-white p-6">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-[#8B84AA]">
                      Profile visits
                    </p>

                    <p className="mt-1 text-3xl font-bold text-[#0B1026]">
                      1,248
                    </p>

                  </div>

                  <div className="rounded-xl bg-[#EEEAFE] px-3 py-2 text-xs font-semibold text-[#6C5CE7]">
                    +18.4%
                  </div>

                </div>

                <div className="mt-8 flex h-32 items-end gap-2">

                  {[
                    35,
                    52,
                    45,
                    68,
                    58,
                    78,
                    92,
                    70,
                    84,
                    100,
                    88,
                    108,
                  ].map((height, index) => (

                    <div
                      key={index}
                      className="flex-1 rounded-t-md bg-[#6C5CE7]"
                      style={{
                        height: `${height}%`,
                      }}
                    />

                  ))}

                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">

                  <div className="rounded-xl bg-[#F7F6FF] p-4">

                    <p className="text-xs text-[#8B84AA]">
                      Returning visitors
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#0B1026]">
                      284
                    </p>

                  </div>

                  <div className="rounded-xl bg-[#F7F6FF] p-4">

                    <p className="text-xs text-[#8B84AA]">
                      Link interactions
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#0B1026]">
                      436
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0B1026]">

        <div className="mx-auto max-w-4xl px-6 py-20 text-center">

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Start understanding your audience.
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-[#C8C5E1]">
            Create your free InstaView profile and start learning how people
            interact with your online presence.
          </p>

          {!loading && user ? (

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">

              <Link
                href="/dashboard"
                className="rounded-xl bg-[#6C5CE7] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#5848D6]"
              >
                Go to Dashboard
              </Link>

              {username && (
                <Link
                  href={`/${username}`}
                  target="_blank"
                  className="rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-[#6C5CE7] hover:bg-white/5"
                >
                  View Profile
                </Link>
              )}

            </div>

          ) : (

            <Link
              href="/signup"
              className="mt-8 inline-block rounded-xl bg-[#6C5CE7] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#5848D6]"
            >
              Create Your Free Profile
            </Link>

          )}

        </div>

      </section>

      {/* Footer */}
      <footer className="bg-[#6C5CE7] pb-8">

        <div className="mx-auto flex max-w-6xl flex-col gap-3 border-t border-white/20 px-6 pt-8 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between">

          <span>
            © 2026 InstaView
          </span>

          <span>
            Track. Analyze. Engage.
          </span>

        </div>

      </footer>

    </main>
  );
}

/* Feature Component */
function Feature({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E1FA] bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6C5CE7] text-xs font-bold text-white">
        {number}
      </div>

      <h3 className="mt-6 text-lg font-bold text-[#0B1026]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-[#64748B]">
        {description}
      </p>

    </div>
  );
}

/* Step Component */
function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6C5CE7] text-sm font-bold text-white">
        {number}
      </div>

      <div>

        <h3 className="font-semibold text-[#0B1026]">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-[#64748B]">
          {description}
        </p>

      </div>

    </div>
  );
}