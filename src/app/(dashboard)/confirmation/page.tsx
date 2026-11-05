import { PlaceholderPage, placeholderMetadata } from "@/components/placeholder-page";

export const generateMetadata = () => placeholderMetadata("confirmation");

export default function Page() {
  return <PlaceholderPage pageKey="confirmation" />;
}
