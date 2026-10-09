import { createFileRoute } from "@tanstack/react-router";
import { SafeSphereApp } from "@/components/safesphere/SafeSphereApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafeSphere — Emergency Command Center" },
      { name: "description", content: "Colleges, offices, factories, hospitals aur homes ke liye simulated emergency alert aur response dashboard." },
      { property: "og:title", content: "SafeSphere — Emergency Command Center" },
      { property: "og:description", content: "Professional simulated emergency alert, acknowledgement aur response dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <SafeSphereApp />;
}
