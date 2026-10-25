import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HowItWorksTutorial } from "@/components/HowItWorksTutorial";

export const Route = createFileRoute("/preview")({
  head: () => ({
    meta: [
      { title: "How Overlap works — tutorial preview" },
      { name: "description", content: "Preview of the Overlap how-it-works slideshow." },
      { property: "og:title", content: "How Overlap works" },
      { property: "og:description", content: "Five steps from creating a poll to sharing a confirmed meeting time with Overlap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PreviewPage,
});

function PreviewPage() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <h1 className="mb-8 text-center font-display text-3xl font-semibold tracking-tight">How it works</h1>
      <HowItWorksTutorial onFinish={() => navigate({ to: "/", hash: "create-poll" })} />
    </main>
  );
}
