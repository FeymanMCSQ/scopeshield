export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Privacy Policy</h1>

        <p className="text-gray-700 mb-4">
          ScopeShield respects your privacy. This application only collects
          information necessary to provide its core functionality.
        </p>

        <p className="text-gray-700 mb-4">
          Data collected may include basic account information, change request
          details, and payment-related metadata processed securely via Stripe.
          Payment information is never stored directly on our servers.
        </p>

        <p className="text-gray-700 mb-4">
          No data is sold or shared with third parties outside of required
          service providers used to operate the application.
        </p>

        <p className="text-gray-700 mb-4">
          If you have any questions about this policy, contact:
        </p>

        <p className="text-gray-800 font-medium">yourname@email.com</p>
      </div>
    </main>
  );
}
