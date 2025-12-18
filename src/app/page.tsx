import Link from 'next/link';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('ss_uid')?.value;

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-semibold text-[#14a800] mb-4">
          ScopeShield
        </h1>

        <p className="text-gray-700 text-lg mb-8">
          A lightweight tool for freelancers to turn informal change requests
          into clear, paid work — without awkward conversations.
        </p>

        <div className="border border-gray-200 rounded-xl p-6 text-left mb-6">
          <p className="text-sm text-gray-600 mb-2">What it does</p>
          <p className="text-gray-800">
            ScopeShield helps freelancers formalize extra work requested in chat
            by creating priced change requests and handling approval and
            payment.
          </p>
        </div>

        {/* Optional: show it temporarily to verify cookie works */}
        <p className="text-xs text-gray-500 mb-4">
          Session: <span className="font-mono">{userId ?? 'none'}</span>
        </p>

        <p className="text-sm text-gray-600">
          Contact:{' '}
          <a
            href="mailto:sssafiullahhh@gmail.com"
            className="text-[#14a800] underline"
          >
            sssafiullahhh@gmail.com
          </a>
        </p>

        <div className="mt-6">
          <Link href="/privacy" className="text-sm text-gray-500 underline">
            Privacy Policy
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-10">
          © {new Date().getFullYear()} ScopeShield
        </p>
      </div>
    </main>
  );
}
