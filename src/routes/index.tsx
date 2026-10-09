import { createFileRoute } from "@tanstack/react-router";
import { SafeSphereApp } from "@/components/safesphere/SafeSphereApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafeSphere — Emergency Command Center" },
      { name: "description", content: "Emergency alerts, notices and response tracking for colleges, offices, factories, hospitals and homes." },
      { property: "og:title", content: "SafeSphere — Emergency Command Center" },
      { property: "og:description", content: "Professional emergency alert platform with admin notices and instant notifications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <SafeSphereApp />;
}
