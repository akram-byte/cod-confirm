import { PlaceholderPage, placeholderMetadata } from "@/components/placeholder-page";

export const generateMetadata = () => placeholderMetadata("stats");

export default function Page() {
  return <PlaceholderPage pageKey="stats" />;
}
