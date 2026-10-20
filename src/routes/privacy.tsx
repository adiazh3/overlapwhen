import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Overlap" },
      { name: "description", content: "How Overlap handles the small amount of data needed to run group availability polls." },
      { property: "og:title", content: "Privacy Policy — Overlap" },
      { property: "og:description", content: "No accounts, minimal data, and polls that expire after 21 days." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 20, 2026">
      <section>
        <p>Overlap helps small groups find a time to meet. We designed it to work without accounts, so we collect as little as possible.</p>
      </section>
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Poll details you enter: title, optional description, dates, time window, slot size and timezone.</li>
          <li>Participant display names and the time slots they mark as available.</li>
          <li>An optional 4-digit PIN, stored only in scrambled (hashed) form, never as the PIN itself.</li>
          <li>A private organizer code that lets the poll creator close the poll early. Anyone with the poll link can lock in a time or reopen the poll.</li>
        </ul>
        <p>We don't ask for email addresses, phone numbers, or passwords.</p>
      </section>
      <section>
        <h2>Information saved on your device</h2>
        <p>Your browser remembers your name for each poll, your timezone choice, organizer codes, and your "My polls" list. This stays on your device and can be cleared by clearing your browser's site data. Backup codes you copy contain this list, including organizer access — keep them private.</p>
      </section>
      <section>
        <h2>How we use information</h2>
        <p>Only to run polls: showing group availability, recommending times, and displaying the final time. We do not sell your data, show ads, or share it with advertisers.</p>
      </section>
      <section>
        <h2>Who can see your responses</h2>
        <p>Anyone with a poll's link can see the poll, participant names, and their availability. Only share links with people you trust.</p>
      </section>
      <section>
        <h2>Retention</h2>
        <p>Polls expire 21 days after creation. After that, responses are no longer shown, and expired data may be deleted.</p>
      </section>
      <section>
        <h2>Service providers</h2>
        <p>We use trusted hosting and database providers to store poll data securely. They process data only to provide the service.</p>
      </section>
      <section>
        <h2>Children</h2>
        <p>Overlap is not directed at children under 13, and we don't knowingly collect their information.</p>
      </section>
      <section>
        <h2>Changes and contact</h2>
        <p>We may update this policy; the date above will change when we do. Questions or removal requests can be sent to the site operator.</p>
      </section>
    </LegalPage>
  );
}
