import {
  formatBdt,
  netPrice,
  perEmployeeCost,
  trackingTotal,
} from "@/lib/sla-fees";
import type { SlaDetails } from "@/lib/sla-session";

type SlaDocumentProps = {
  details: SlaDetails;
};

/**
 * Total signature lines (both sides combined) past which Article 13 gets a
 * page of its own in print, instead of trailing whatever fits at the bottom of
 * the previous page. The rule itself lives in app/sla-preview/sla-print.css.
 */
const SIGNATORIES_BEFORE_OWN_PAGE = 4;

function formatAgreementDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function SlaDocument({ details }: SlaDocumentProps) {
  const employeeRate = perEmployeeCost(details.monthlyFee, details.employeeCount);
  const employeeTrackingTotal = details.includeEmployeeTracking
    ? trackingTotal(details.employeeCount, details.trackingFeePerEmployee)
    : 0;
  const signatoryCount =
    details.clientSignatories.length + details.shomvobSignatories.length;
  const executionOnOwnPage = signatoryCount > SIGNATORIES_BEFORE_OWN_PAGE;
  const total = netPrice({
    monthlyFee: details.monthlyFee,
    oneTimeFee: details.oneTimeFee,
    employeeCount: details.employeeCount,
    trackingFeePerEmployee: details.includeEmployeeTracking
      ? details.trackingFeePerEmployee
      : undefined,
  });

  return (
    <article className="sla-doc">
      <h1 className="sla-doc-heading">SERVICE LEVEL AGREEMENT</h1>

      <div className="sla-preamble">
        <p>
          This Service Level Agreement (“SLA”) is entered into on{" "}
          <strong>{formatAgreementDate(details.agreementDate)}</strong> at Dhaka,
          Bangladesh by and between:
        </p>
        <p>
          <strong>Shomvob Technologies Ltd</strong>, a company incorporated under
          the Companies Act of Bangladesh, with company registration number
          TRAD/DSCC/045324/2021, and having its operational headquarters at House
          486, Road 08, Baridhara DOHS, Dhaka-1206, Bangladesh, represented by its
          Managing Director, hereinafter referred to as the “First Party,” which
          expression shall, where the context admits, include its successors and
          assigns, OF THE ONE PART.
        </p>
        <p className="sla-and-line">AND</p>
        <p>
          <strong>{details.clientName}</strong>, a company incorporated under the
          Companies Act of Bangladesh, having its operational headquarters at{" "}
          <strong>{details.clientAddress}</strong>, hereinafter referred to as the
          “Second Party,” which expression shall, where the context admits, include
          its successors and assigns, OF THE OTHER PART.
        </p>
      </div>

      <section className="sla-article">
        <h2><span>1.</span> Scope of Services</h2>
        <p>Shomvob Technologies Limited will provide the following services:</p>
        <ul className="sla-clauses">
          <li>
            <strong>System Access</strong> — the Client will be granted access to
            the cloud-based HRIS platform, scoped to the HR functions selected
            under <em>System Features</em> below.
          </li>
          <li>
            <strong>Deployment</strong> — the SaaS HRIS system will be deployed
            and configured according to the agreed-upon specifications.
          </li>
          <li>
            <strong>System Features</strong> — the following modules are included
            for this Client:
            <ul>
              {details.selectedFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </li>
          <li>
            <strong>Updates &amp; Enhancements</strong> — the Provider will
            regularly update the system, adding new features and security patches
            as required.
          </li>
        </ul>
      </section>

      <section className="sla-article">
        <h2><span>2.</span> Service Availability</h2>
        <ul className="sla-clauses">
          <li>
            <strong>System Uptime</strong> — the SaaS HRIS system will be
            available 99.5% of the time per calendar month, excluding scheduled
            maintenance periods.
          </li>
          <li>
            <strong>Scheduled Maintenance</strong> — performed during non-business
            hours; the Provider will notify the Client at least 48 hours in
            advance.
          </li>
        </ul>
      </section>

      <section className="sla-article">
        <h2><span>3.</span> Performance Metrics</h2>
        <h3>Response Time</h3>
        <ul className="sla-clauses">
          <li>Critical issues (e.g., system downtime) will be addressed within 2 hours.</li>
          <li>Non-critical issues (e.g., minor bugs) will be addressed within 24 hours.</li>
        </ul>
        <h3>Resolution Time</h3>
        <ul className="sla-clauses">
          <li>For critical issues, the system will be restored to normal functionality within 12 hours.</li>
          <li>For non-critical issues, resolution will occur within 48 hours.</li>
        </ul>
      </section>

      <section className="sla-article">
        <h2><span>4.</span> Data Security &amp; Compliance</h2>
        <ul className="sla-clauses">
          <li><strong>Data Encryption</strong> — all sensitive data stored in the system will be encrypted both in transit and at rest.</li>
          <li><strong>Compliance</strong> — the system will comply with applicable data protection laws, including GDPR where applicable.</li>
          <li><strong>Hosting</strong> — the Provider&apos;s solution is hosted on AWS under standard security protocols; no on-premises servers are used for data storage.</li>
          <li><strong>Access Control</strong> — the Provider will not access Client accounts without the Client&apos;s permission.</li>
          <li><strong>Data Retention on Exit</strong> — data is deleted per the Client&apos;s instruction, or automatically after 6 months if no instruction is given.</li>
          <li><strong>Backup Schedule</strong> — scheduled backups occur twice daily for data recovery purposes.</li>
          <li><strong>Data Portability</strong> — following discontinuation of service, the Client may request a data transfer within 2 months, free of charge.</li>
          <li><strong>Liability</strong> — the Client may pursue legal action against the Provider if data is lost as a result of the Provider&apos;s operational negligence.</li>
          <li><strong>Transport Security</strong> — data transfers are secured using SSL/TLS (HTTPS) with a DV certificate reissued every 90 days; passwords are protected using the Provider&apos;s proprietary encryption mechanism.</li>
        </ul>
      </section>

      <section className="sla-article">
        <h2><span>5.</span> Support Services</h2>
        <p><strong>Helpdesk Support</strong> — available 9:00 AM to 11:00 PM, Saturday to Thursday.</p>
        <h3>Support Response Time</h3>
        <ul className="sla-clauses">
          <li>Critical issues will be responded to within 2 hours.</li>
          <li>Non-critical issues will be responded to within 1 business day.</li>
        </ul>
        <p><strong>Support Channels</strong> — email, phone, or an online ticketing system.</p>
      </section>

      <section className="sla-article">
        <h2><span>6.</span> Client Responsibilities</h2>
        <ul className="sla-clauses">
          <li><strong>User Training</strong> — the Client will ensure relevant personnel are trained on the SaaS HRIS system.</li>
          <li><strong>User Access</strong> — the Client is responsible for managing user access so that only authorized personnel reach sensitive HR data.</li>
          <li><strong>Infrastructure Requirements</strong> — the Client must maintain an internet connection and any necessary hardware.</li>
        </ul>
      </section>

      <section className="sla-article">
        <h2><span>7.</span> Fees &amp; Payment Terms</h2>
        <p>The Client will pay a recurring subscription fee for the SaaS HRIS system, as set out below:</p>
        <table className="sla-fees">
          <thead>
            <tr>
              <th>Sl.&nbsp;No</th>
              <th>Item Description</th>
              <th className="sla-number">Per Employee Cost</th>
              <th className="sla-number">Monthly Costing</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>HRMS software for {details.employeeCount} employees</td>
              <td className="sla-number">{formatBdt(employeeRate)}</td>
              <td className="sla-number">{formatBdt(details.monthlyFee)}</td>
            </tr>
            {details.includeEmployeeTracking ? (
              <tr>
                <td>2</td>
                <td>Employee Tracking</td>
                <td className="sla-number">{formatBdt(details.trackingFeePerEmployee ?? 0)}</td>
                <td className="sla-number">{formatBdt(employeeTrackingTotal)}</td>
              </tr>
            ) : null}
            <tr>
              <td>{details.includeEmployeeTracking ? 3 : 2}</td>
              <td>One-time charges for software rollout &amp; training</td>
              <td className="sla-number" colSpan={2}>{formatBdt(details.oneTimeFee)}</td>
            </tr>
            <tr className="sla-total-row">
              <td>{details.includeEmployeeTracking ? 4 : 3}</td>
              <td>Net price (VAT excluded)</td>
              <td className="sla-number">—</td>
              <td className="sla-number">{formatBdt(total)}</td>
            </tr>
          </tbody>
        </table>
        <p className="sla-inline-note">
          VAT of {details.vatPercent}% applies in addition to the amounts above.
          If the number of employees increases beyond the contracted tier, the
          package must be upgraded accordingly.
        </p>
        <h3>Payment Terms</h3>
        <ul className="sla-clauses">
          <li>Payment is due on an annual or monthly basis, as agreed in this contract.</li>
          <li>All payments must be made within 30 days of the invoice date.</li>
        </ul>
      </section>

      <section className="sla-article">
        <h2><span>8.</span> Confidentiality</h2>
        <p>Both parties agree to maintain the confidentiality of any proprietary information or data shared during the course of this Agreement, including but not limited to employee data and business operations.</p>
      </section>

      <section className="sla-article">
        <h2><span>9.</span> Dispute Resolution</h2>
        <p>In the event of a dispute, both parties agree to attempt to resolve the issue through negotiation or mediation. If the issue cannot be resolved through these methods, it will be resolved through arbitration in accordance with the laws of Bangladesh.</p>
      </section>

      <section className="sla-article">
        <h2><span>10.</span> Limitation of Liability</h2>
        <p>The liability of the Provider will be limited to the amount paid by the Client for the SaaS HRIS solution over the preceding 12-month period. The Provider will not be liable for any indirect, incidental, or consequential damages, including but not limited to loss of profits, revenue, or data.</p>
      </section>

      <section className="sla-article">
        <h2><span>11.</span> Termination &amp; Renewal</h2>
        <ul className="sla-clauses">
          <li><strong>Termination</strong> — either party may terminate this Agreement by providing 30 days&apos; written notice.</li>
          <li><strong>Renewal</strong> — this Agreement will automatically renew unless either party provides written notice of non-renewal at least 30 days before the end of the current term.</li>
        </ul>
      </section>

      <section className="sla-article">
        <h2><span>12.</span> Entire Agreement &amp; Authorization</h2>
        <p>This Agreement contains the full understanding between both parties regarding the matters covered in it and supersedes all previous discussions, agreements, or understandings, whether written or verbal. Any changes to this Agreement will only be valid if made in writing and signed by authorized representatives of both parties.</p>
      </section>

      <section
        className={`sla-article sla-execution${
          executionOnOwnPage ? " sla-execution-own-page" : ""
        }`}
      >
        <h2><span>13.</span> Execution</h2>
        <p>IN WITNESS WHEREOF, the parties hereto have executed this Agreement on the dates set forth below. Each individual signing this Agreement hereby represents and warrants that they are duly authorized to execute and deliver this Agreement on behalf of the respective organization and to bind such organization to its terms and conditions.</p>
        <div className="sla-sign-grid">
          <div className="sla-sign-column">
            <div className="sla-sign-party">For the Client</div>
            {details.clientSignatories.map((signatory, index) => (
              <div key={`client-${index}`} className="sla-sign-line">
                {signatory.name}
                <div>{signatory.title}</div>
              </div>
            ))}
          </div>
          <div className="sla-sign-column">
            <div className="sla-sign-party">For Shomvob Technologies Ltd</div>
            {details.shomvobSignatories.map((signatory, index) => (
              <div key={`shomvob-${index}`} className="sla-sign-line">
                {signatory.name}
                <div>{signatory.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="sla-doc-footer">
        Shomvob Technologies Limited · House 486, Road 08, Baridhara DOHS,
        Dhaka-1206, Bangladesh
      </footer>
    </article>
  );
}
