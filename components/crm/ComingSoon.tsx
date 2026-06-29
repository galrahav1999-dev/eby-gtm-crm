import { PageHeader } from "./ui";

export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
        <div className="label-eyebrow">In the build queue</div>
        <p className="max-w-md text-sm text-ink-muted">{note}</p>
        <p className="text-xs text-ink-muted">Being built next, on the same pattern as Organizations and People.</p>
      </div>
    </div>
  );
}
