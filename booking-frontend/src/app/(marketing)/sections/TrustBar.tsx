const trustStatements = [
  "Independent realtor teams",
  "Serviced apartment brands",
  "Vacation rental agencies",
  "Corporate housing partners",
];

export function TrustBar() {
  return (
    <section className="bg-marketing-surface py-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-4 text-sm font-medium text-marketing-muted sm:px-6 lg:px-8">
        <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
          Trusted by property professionals worldwide
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
