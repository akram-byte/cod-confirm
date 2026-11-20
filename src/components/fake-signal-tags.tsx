import { Smartphone, Zap } from "lucide-react";
import { fill } from "@/i18n/config";

type Labels = { fastFill: string; fastFillHint: string; sharedDevice: string; sharedDeviceHint: string };

const PILL =
  "inline-flex h-6 items-center gap-1 rounded-full bg-[var(--pill-warning-bg)] px-2.5 text-xs font-medium text-[var(--pill-warning-ink)]";

/** Fake-order warnings from the public form: sent too fast, or one browser for many phones. */
export function FakeSignalTags({
  fastFill,
  sharedDevice,
  fillSeconds,
  labels,
}: {
  fastFill: boolean;
  sharedDevice: boolean;
  fillSeconds: number | null;
  labels: Labels;
}) {
  return (
    <>
      {fastFill && (
        <span className={PILL} title={fill(labels.fastFillHint, { seconds: fillSeconds ?? 0 })}>
          <Zap className="size-3" />
          {labels.fastFill}
        </span>
      )}
      {sharedDevice && (
        <span className={PILL} title={labels.sharedDeviceHint}>
          <Smartphone className="size-3" />
          {labels.sharedDevice}
        </span>
      )}
    </>
  );
}
