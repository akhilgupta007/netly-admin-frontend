import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="space-y-8 text-center">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-lg font-medium text-text-primary">
          Check your email
        </h1>
        <p className="text-xs text-text-muted">
          If this email is registered, you&apos;ll receive a reset link shortly.
          <br />
          Please check your inbox and follow the instructions to reset your
          password.
        </p>
      </div>

      <div className="space-y-6">
        {/* Open Email App */}
        <a
          href="mailto:"
          className="block w-full rounded-xl bg-primary-bg py-2.5 text-sm font-medium text-white hover:opacity-90 transition text-center"
        >
          Open Email App
        </a>

        {/* Back to login */}
        <div>
          <Link
            href="/login"
            className="text-xs text-primary-bg hover:underline font-medium"
          >
            Back to Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
