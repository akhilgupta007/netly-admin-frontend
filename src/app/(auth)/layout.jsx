import Image from "next/image";

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-page-bg">
      {/* Left — Hero Image */}
      <div className="hidden lg:block lg:w-1/2 relative p-4">
        <div className="relative w-full h-full rounded-3xl overflow-hidden">
          <Image
            src="/login.png"
            alt="Professional cleaning crew at work"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Right — Auth Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="Netly"
            width={170}
            height={170}
            style={{ width: "auto", height: "auto" }}
            priority
          />
        </div>

        {/* Card */}
        <div className="w-full max-w-lg bg-white rounded-4xl shadow-sm p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
