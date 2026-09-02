type SlaCoverPageProps = {
  clientName: string;
};

export default function SlaCoverPage({ clientName }: SlaCoverPageProps) {
  return (
    <section className="sla-cover-page" aria-label="SLA cover page">
      <div className="sla-cover-title">
        SERVICE LEVEL AGREEMENT <span>(SLA)</span>
      </div>
      <div className="sla-cover-connector">With</div>
      <div className="sla-cover-party">Shomvob Technologies Limited</div>
      <div className="sla-cover-connector">And</div>
      <div className="sla-cover-party">{clientName}</div>
    </section>
  );
}
