import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* Header */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              IV
            </div>

            <span className="text-xl font-bold tracking-tight">
              InstaView
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-4">

            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Get Started
            </Link>

          </div>
        </div>
      </nav>


      {/* Hero Section */}
      <section className="relative overflow-hidden">

        <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-28">

          <div className="mx-auto max-w-4xl text-center">

            {/* Small Label */}
            <div className="mx-auto mb-8 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-medium text-slate-600">
              Understand your social audience
            </div>


            {/* Main Heading */}
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">

              Know who interacts with your

              <span className="block text-slate-500">
                online presence.
              </span>

            </h1>


            {/* Description */}
            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
              Create your personal InstaView link and understand how visitors
              interact with your profile, links and content.
            </p>


            {/* Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">

              {/* Create Profile */}
              <Link
                href="/signup"
                className="rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white transition hover:bg-slate-800"
              >
                Create Your Free Profile
              </Link>


              {/* How It Works */}
              <Link
                href="/login"
                className="rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                See How It Works
              </Link>

            </div>

          </div>


          {/* Feature Preview */}
          <div className="mx-auto mt-20 max-w-5xl">

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-6">

              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">

                <div className="grid gap-6 sm:grid-cols-3">

                  {/* Feature 1 */}
                  <div className="rounded-2xl border border-slate-200 p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                      01
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900">
                      Personal Profile
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Create your own InstaView profile and share one simple
                      link with your audience.
                    </p>
                  </div>


                  {/* Feature 2 */}
                  <div className="rounded-2xl border border-slate-200 p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                      02
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900">
                      Track Interactions
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Understand how visitors interact with your profile and
                      the links you share.
                    </p>
                  </div>


                  {/* Feature 3 */}
                  <div className="rounded-2xl border border-slate-200 p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                      03
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900">
                      View Analytics
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Get useful insights into your audience and profile
                      activity.
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* CTA Section */}
      <section className="border-t border-slate-200 bg-slate-50">

        <div className="mx-auto max-w-4xl px-6 py-20 text-center">

          <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Ready to create your InstaView profile?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Create your free profile and start understanding how people
            interact with your online presence.
          </p>

          <div className="mt-8">

            <Link
              href="/signup"
              className="inline-flex rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white transition hover:bg-slate-800"
            >
              Get Started Free
            </Link>

          </div>

        </div>

      </section>


      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">

          <div className="flex items-center gap-2">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
              IV
            </div>

            <span className="font-semibold text-slate-900">
              InstaView
            </span>

          </div>

          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} InstaView. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}