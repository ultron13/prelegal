export interface PartyInfo {
  name: string
  title: string
  company: string
  email: string
}

export interface NDAFormData {
  purpose: string
  effectiveDate: string
  mndaTerm: 'expires' | 'until_terminated'
  mndaTermYears: string
  termOfConfidentiality: 'years' | 'perpetuity'
  confidentialityYears: string
  governingLaw: string
  jurisdiction: string
  party1: PartyInfo
  party2: PartyInfo
}

export type DocumentFields = Record<string, unknown>

export interface DocumentFormData extends DocumentFields {
  documentType: string
}
