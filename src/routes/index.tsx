import { createFileRoute } from "@tanstack/react-router";
import { SafeSphereApp } from "@/components/safesphere/SafeSphereApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafeSphere — Campus Safety" },
      { name: "description", content: "College campus safety demo with simulated alerts, student requests, notices and acknowledgement tracking." },
      { property: "og:title", content: "SafeSphere — Campus Safety" },
      { property: "og:description", content: "A professional college safety demo with simulated emergency alerts, campus notices and student requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <SafeSphereApp />;
}
