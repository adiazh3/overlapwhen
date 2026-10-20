import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Overlap" },
      { name: "description", content: "The rules for using Overlap, the no-account group scheduling tool." },
      { property: "og:title", content: "Terms of Service — Overlap" },
      { property: "og:description", content: "Simple terms for creating and answering Overlap availability polls." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="October 20, 2026">
      <section>
        <p>By using Overlap you agree to these terms. If you don't agree, please don't use the service.</p>
      </section>
      <section>
        <h2>The service</h2>
        <p>Overlap is a free tool for creating availability polls and finding times that work for a group. No account is required. Anyone with a poll link can lock in a proposed time or reopen the poll; closing it early remains organizer-only.</p>
      </section>
      <section>
        <h2>Your responsibilities</h2>
        <ul>
          <li>Only enter content you have the right to share, and don't post anything unlawful, abusive, or misleading.</li>
          <li>Don't impersonate other participants or tamper with polls you don't organize.</li>
          <li>Don't scrape, overload, or attempt to break the service or its security.</li>
          <li>Keep poll links, organizer links, PINs and backup codes private — anyone holding them can use them.</li>
        </ul>
      </section>
      <section>
        <h2>Poll lifetime</h2>
        <p>Polls expire 21 days after they are created and may then be deleted. Organizers can also close polls early. Save any final times you need to your own calendar.</p>
      </section>
      <section>
        <h2>Lost access</h2>
        <p>Because there are no accounts, we can't recover lost organizer links or your "My polls" list if your browser data is cleared.</p>
      </section>
      <section>
        <h2>No warranty</h2>
        <p>Overlap is provided "as is" without warranties of any kind. We don't guarantee it will be uninterrupted, error-free, or that suggested times suit everyone.</p>
      </section>
      <section>
        <h2>Limitation of liability</h2>
        <p>To the fullest extent allowed by law, we're not liable for missed meetings, lost data, or indirect damages arising from your use of the service.</p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>We may update these terms or change or stop the service at any time. Continued use after changes means you accept the updated terms.</p>
      </section>
    </LegalPage>
  );
}
