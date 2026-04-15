export interface HelpCopy {
  key: string
  defaultMessage: string
}

export interface HelpSectionContent {
  title: HelpCopy
  description: HelpCopy
}

export interface HelpNote {
  id: string
  title: HelpCopy
  description: HelpCopy
}

export interface HelpFaqItem {
  id: string
  question: HelpCopy
  answer: HelpCopy
}

export interface PageHelpConfig {
  id: string
  title: HelpCopy
  summary: HelpCopy[]
  sections: Record<string, HelpSectionContent>
  fieldHints: Record<string, HelpCopy>
  faqs: HelpFaqItem[]
  recommendations: HelpNote[]
  warnings: HelpNote[]
}

export function helpText(key: string, defaultMessage: string): HelpCopy {
  return { key, defaultMessage }
}

export function getHelpText(value?: HelpCopy | string | null): string {
  if (!value) return ''
  return typeof value === 'string' ? value : value.defaultMessage
}
