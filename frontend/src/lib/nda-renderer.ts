import { NDAFormData } from './types'

const STANDARD_TERMS = `
<h2>Standard Terms</h2>

<p><strong>1. Introduction.</strong> This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page (defined below)) ("<strong>MNDA</strong>") allows each party ("<strong>Disclosing Party</strong>") to disclose or make available information in connection with the <span class="nda-field">{{PURPOSE}}</span> which (1) the Disclosing Party identifies to the receiving party ("<strong>Receiving Party</strong>") as "confidential", "proprietary", or the like or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances of its disclosure ("<strong>Confidential Information</strong>"). Each party's Confidential Information also includes the existence and status of the parties' discussions and information on the Cover Page. Confidential Information includes technical or business information, product designs or roadmaps, requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use this MNDA, the parties must complete and sign a cover page incorporating these Standard Terms ("<strong>Cover Page</strong>"). Each party is identified on the Cover Page and capitalized terms have the meanings given herein or on the Cover Page.</p>

<p><strong>2. Use and Protection of Confidential Information.</strong> The Receiving Party shall: (a) use Confidential Information solely for the <span class="nda-field">{{PURPOSE}}</span>; (b) not disclose Confidential Information to third parties without the Disclosing Party's prior written approval, except that the Receiving Party may disclose Confidential Information to its employees, agents, advisors, contractors and other representatives having a reasonable need to know for the <span class="nda-field">{{PURPOSE}}</span>, provided these representatives are bound by confidentiality obligations no less protective of the Disclosing Party than the applicable terms in this MNDA and the Receiving Party remains responsible for their compliance with this MNDA; and (c) protect Confidential Information using at least the same protections the Receiving Party uses for its own similar information but no less than a reasonable standard of care.</p>

<p><strong>3. Exceptions.</strong> The Receiving Party's obligations in this MNDA do not apply to information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it independently developed without using or referencing the Confidential Information.</p>

<p><strong>4. Disclosures Required by Law.</strong> The Receiving Party may disclose Confidential Information to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required disclosure and reasonably cooperates, at the Disclosing Party's expense, with the Disclosing Party's efforts to obtain confidential treatment for the Confidential Information.</p>

<p><strong>5. Term and Termination.</strong> This MNDA commences on the <span class="nda-field">{{EFFECTIVE_DATE}}</span> and expires at the end of the <span class="nda-field">{{MNDA_TERM}}</span>. Either party may terminate this MNDA for any or no reason upon written notice to the other party. The Receiving Party's obligations relating to Confidential Information will survive for the <span class="nda-field">{{CONFIDENTIALITY_TERM}}</span>, despite any expiration or termination of this MNDA.</p>

<p><strong>6. Return or Destruction of Confidential Information.</strong> Upon expiration or termination of this MNDA or upon the Disclosing Party's earlier request, the Receiving Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing Party's written request, destroy all Confidential Information in the Receiving Party's possession or control or return it to the Disclosing Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in writing.</p>

<p><strong>7. Proprietary Rights.</strong> The Disclosing Party retains all of its intellectual property and other rights in its Confidential Information and its disclosure to the Receiving Party grants no license under such rights.</p>

<p><strong>8. Disclaimer.</strong> ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS", WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.</p>

<p><strong>9. Governing Law and Jurisdiction.</strong> This MNDA is governed by the laws of the State of <span class="nda-field">{{GOVERNING_LAW}}</span>. Any legal suit must be instituted in the courts located in <span class="nda-field">{{JURISDICTION}}</span>.</p>

<p><strong>10. General.</strong> Neither party may assign this MNDA without the prior written consent of the other party. This MNDA constitutes the entire agreement of the parties with respect to its subject matter.</p>

<p style="margin-top: 2rem; font-size: 0.75rem; color: #94a3b8;">Common Paper Mutual Non-Disclosure Agreement Version 1.0, free to use under CC BY 4.0.</p>
`

export function renderNDA(data: NDAFormData): string {
  const mndaTermText =
    data.mndaTerm === 'expires'
      ? `${data.mndaTermYears} year(s) from the Effective Date`
      : 'until terminated in accordance with the terms of the MNDA'

  const confidentialityTermText =
    data.termOfConfidentiality === 'years'
      ? `${data.confidentialityYears} year(s) from the Effective Date`
      : 'in perpetuity'

  return STANDARD_TERMS
    .split('{{PURPOSE}}').join(escapeHtml(data.purpose))
    .split('{{EFFECTIVE_DATE}}').join(escapeHtml(formatDate(data.effectiveDate)))
    .split('{{MNDA_TERM}}').join(escapeHtml(mndaTermText))
    .split('{{CONFIDENTIALITY_TERM}}').join(escapeHtml(confidentialityTermText))
    .split('{{GOVERNING_LAW}}').join(escapeHtml(data.governingLaw))
    .split('{{JURISDICTION}}').join(escapeHtml(data.jurisdiction))
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
