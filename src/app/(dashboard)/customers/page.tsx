import { PlaceholderPage, placeholderMetadata } from "@/components/placeholder-page";

export const generateMetadata = () => placeholderMetadata("customers");

export default function Page() {
  return <PlaceholderPage pageKey="customers" />;
}
