"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check whether the user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/profile");
        return;
      }

      setCheckingUser(false);
    };

    checkUser();
  }, [router]);

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your name.");
      return;
    }

    if (!cleanUsername) {
      setError("Please choose a username.");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setError(
        "Username can only contain lowercase letters, numbers and underscores."
      );
      return;
    }

    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      // Check whether username already exists
      const { data: existingProfile, error: usernameCheckError } =
        await supabase
          .from("Profiles")
          .select("user_id")
          .eq("username", cleanUsername)
          .maybeSingle();

      if (usernameCheckError) {
        console.error(usernameCheckError);
        setError("Unable to check username. Please try again.");
        return;
      }

      if (existingProfile) {
        setError("This username is already taken. Please choose another.");
        return;
      }

      // Create Supabase account
      const {
        data: signupData,
        error: signupError,
      } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName,
            username: cleanUsername,
          },
        },
      });

      if (signupError) {
        console.error(signupError);

        if (
          signupError.message.toLowerCase().includes("already registered")
        ) {
          setError(
            "An account with this email already exists. Please log in."
          );
        } else {
          setError(signupError.message);
        }

        return;
      }

      const user = signupData.user;

      if (!user) {
        setError("Account could not be created. Please try again.");
        return;
      }

      /*
       * If Supabase email confirmation is disabled,
       * a session will normally exist immediately.
       *
       * If email confirmation is enabled, Supabase may
       * return a user without an active session.
       */
      if (signupData.session) {
        const { error: profileError } = await supabase
          .from("Profiles")
          .insert({
            user_id: user.id,
            username: cleanUsername,
            display_name: cleanName,
            bio: "",
            avatar_url: null,
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);

          // If the profile wasn't created, delete the auth session
          await supabase.auth.signOut();

          if (
            profileError.message
              .toLowerCase()
              .includes("duplicate")
          ) {
            setError(
              "This username is already taken. Please choose another."
            );
          } else {
            setError(
              "Your account was created, but your profile could not be created. Please try again."
            );
          }

          return;
        }

        // Successful signup
        router.push("/profile");
        router.refresh();
        return;
      }

      /*
       * Email confirmation is probably enabled.
       * The account exists, but we don't have a session yet.
       *
       * The user needs to verify their email before
       * we can create the profile using normal RLS.
       */
      setSuccess(
        "Account created successfully. Please check your email and verify your account, then log in to complete your profile."
      );
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-sm text-slate-500">
          Checking your account...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              IV
            </div>

            <span className="text-xl font-bold tracking-tight text-slate-900">
              InstaView
            </span>
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Login
          </Link>
        </nav>
      </header>

      {/* Signup */}
      <section className="px-4 py-12 sm:py-20">
        <div className="mx-auto max-w-md">
          <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-lg sm:p-9">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
                IV
              </div>

              <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950">
                Create your InstaView
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Create your profile and get your own InstaView link.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSignup} className="mt-8 space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Username
                </label>

                <div className="flex overflow-hidden rounded-xl border border-slate-200 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10">
                  <span className="flex items-center bg-slate-50 px-3 text-sm text-slate-500">
                    @
                  </span>

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, "")
                      )
                    }
                    placeholder="yourusername"
                    autoComplete="username"
                    required
                    className="min-w-0 flex-1 border-0 bg-white px-3 py-3 text-sm text-slate-900 outline-none"
                  />
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Your public InstaView link will be:
                </p>

                <p className="mt-1 break-all text-xs font-medium text-slate-600">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/${username || "username"}`
                    : `/${username || "username"}`}
                </p>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            {/* Login */}
            <div className="mt-7 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-slate-900 hover:underline"
              >
                Login
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            By creating an account, you agree to use InstaView responsibly.
          </p>
        </div>
      </section>
    </main>
  );
}