import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowRight className="size-4 ltr:rotate-180" />
      {label}
    </Link>
  );
}
