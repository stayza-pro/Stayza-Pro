const trustStatements = [
  "Loved by residential agencies",
  "Trusted by serviced apartment brands",
  "Adopted by corporate housing teams",
  "Accelerating vacation rental collectives",
];

export function TrustBar() {
  return (
    <section className="bg-marketing-surface py-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-4 text-sm font-medium text-marketing-muted sm:px-6 lg:px-8">
        <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
          Trusted by teams modernising their booking ops
        </span>
        <div
          className="hidden h-8 w-px sm:block"
          style={{ backgroundColor: "var(--marketing-divider)" }}
          aria-hidden="true"
        />
        {trustStatements.map((statement) => (
          <span key={statement}>{statement}</span>
        ))}
      </div>
    </section>
  );
}
