import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { HelpDrawer, PageIntro } from '@/components/shared/help'
import { helpText, type PageHelpConfig } from '@/help/types'

const sampleHelpConfig: PageHelpConfig = {
  id: 'sample',
  title: helpText('help.sample.title', 'Sample Help'),
  summary: [helpText('help.sample.summary', 'Sample overview text for the help drawer.')],
  sections: {},
  fieldHints: {},
  recommendations: [
    {
      id: 'recommendation-1',
      title: helpText('help.sample.recommendation.title', 'Recommended setup'),
      description: helpText('help.sample.recommendation.description', 'Use the safest default configuration first.'),
    },
  ],
  warnings: [
    {
      id: 'warning-1',
      title: helpText('help.sample.warning.title', 'Risk warning'),
      description: helpText('help.sample.warning.description', 'Changing this setting can affect production behavior.'),
    },
  ],
  faqs: [
    {
      id: 'faq-1',
      question: helpText('help.sample.faq.question', 'What does this setting do?'),
      answer: helpText('help.sample.faq.answer', 'It controls the main sample workflow.'),
    },
  ],
}

describe('HelpSystem', () => {
  it('renders page intro content', () => {
    render(<PageIntro summary={sampleHelpConfig.summary} />)

    expect(screen.getByText('Sample overview text for the help drawer.')).toBeInTheDocument()
  })

  it('renders the help drawer and shows faq content', () => {
    render(<HelpDrawer isOpen onClose={() => {}} config={sampleHelpConfig} />)

    expect(screen.getByText('Sample Help Help')).toBeInTheDocument()
    expect(screen.getByText('What does this setting do?')).toBeInTheDocument()
    expect(screen.getByText('It controls the main sample workflow.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'What does this setting do?' }))

    expect(screen.queryByText('It controls the main sample workflow.')).not.toBeInTheDocument()
  })
})