import { useState, type ReactNode } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Info, Lightbulb } from 'lucide-react'
import { clsx } from 'clsx'
import { Drawer } from '@/components/shared/Drawer'
import { getHelpText, type HelpCopy, type HelpFaqItem, type HelpNote, type PageHelpConfig } from '@/help/types'

type HelpTone = 'info' | 'warning' | 'recommendation'

interface InlineCalloutProps {
  tone?: HelpTone
  title?: HelpCopy | string
  children: ReactNode
  className?: string
}

interface PageIntroProps {
  summary: Array<HelpCopy | string>
  className?: string
  tone?: 'page' | 'neutral'
}

interface SectionHelpProps {
  title?: HelpCopy | string
  description: HelpCopy | string
  className?: string
}

interface FieldHintProps {
  text?: HelpCopy | string | null
  className?: string
}

interface RecommendationCardProps {
  title: HelpCopy | string
  description: HelpCopy | string
}

interface FaqAccordionProps {
  items: HelpFaqItem[]
}

interface HelpDrawerProps {
  isOpen: boolean
  onClose: () => void
  config: PageHelpConfig
}

const toneClasses: Record<HelpTone, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  recommendation: 'border-emerald-200 bg-emerald-50 text-emerald-950',
}

function toneIcon(tone: HelpTone) {
  switch (tone) {
    case 'warning':
      return <AlertTriangle size={16} className="mt-0.5 shrink-0" />
    case 'recommendation':
      return <Lightbulb size={16} className="mt-0.5 shrink-0" />
    default:
      return <Info size={16} className="mt-0.5 shrink-0" />
  }
}

export function PageIntro({ summary, className, tone = 'page' }: PageIntroProps) {
  if (summary.length === 0) return null

  return (
    <div className={clsx('admin-panel-soft relative z-10 px-5 py-4', className)}>
      <div className={clsx('max-w-4xl space-y-2 text-sm leading-6', tone === 'page' ? 'text-blue-50/88' : 'text-slate-700')}>
        {summary.map((item, index) => (
          <p key={`${getHelpText(item)}-${index}`}>{getHelpText(item)}</p>
        ))}
      </div>
    </div>
  )
}

export function SectionHelp({ title, description, className }: SectionHelpProps) {
  return (
    <div className={clsx('rounded-xl border border-slate-200 bg-slate-50 px-4 py-3', className)}>
      {title ? <div className="text-sm font-semibold text-slate-900">{getHelpText(title)}</div> : null}
      <p className={clsx('text-sm leading-6 text-slate-700', title && 'mt-1')}>{getHelpText(description)}</p>
    </div>
  )
}

export function FieldHint({ text, className }: FieldHintProps) {
  const value = getHelpText(text)
  if (!value) return null

  return <p className={clsx('mt-1 text-xs leading-5 text-slate-500', className)}>{value}</p>
}

export function InlineCallout({ tone = 'info', title, children, className }: InlineCalloutProps) {
  return (
    <div className={clsx('rounded-xl border px-4 py-3', toneClasses[tone], className)}>
      <div className="flex items-start gap-2.5">
        {toneIcon(tone)}
        <div className="min-w-0">
          {title ? <div className="text-sm font-semibold">{getHelpText(title)}</div> : null}
          <div className={clsx('text-sm leading-6', title && 'mt-1')}>{children}</div>
        </div>
      </div>
    </div>
  )
}

export function WarningCallout({ title, children, className }: Omit<InlineCalloutProps, 'tone'>) {
  return (
    <InlineCallout tone="warning" title={title} className={className}>
      {children}
    </InlineCallout>
  )
}

export function RecommendationCard({ title, description }: RecommendationCardProps) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">{getHelpText(title)}</div>
      <p className="mt-1 text-sm leading-6 text-slate-700">{getHelpText(description)}</p>
    </div>
  )
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIds, setOpenIds] = useState<string[]>(items.length > 0 ? [items[0].id] : [])

  if (items.length === 0) return null

  const toggleItem = (id: string) => {
    setOpenIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id)

        return (
          <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold text-slate-900">{getHelpText(item.question)}</span>
              {isOpen ? <ChevronUp size={16} className="shrink-0 text-slate-500" /> : <ChevronDown size={16} className="shrink-0 text-slate-500" />}
            </button>
            {isOpen ? <div className="border-t border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700">{getHelpText(item.answer)}</div> : null}
          </div>
        )
      })}
    </div>
  )
}

function HelpNoteList({ items, tone }: { items: HelpNote[]; tone: 'recommendation' | 'warning' }) {
  if (items.length === 0) return null

  if (tone === 'recommendation') {
    return (
      <div className="space-y-3">
        {items.map((item) => (
          <RecommendationCard key={item.id} title={item.title} description={item.description} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <WarningCallout key={item.id} title={item.title}>
          {getHelpText(item.description)}
        </WarningCallout>
      ))}
    </div>
  )
}

export function HelpDrawer({ isOpen, onClose, config }: HelpDrawerProps) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`${getHelpText(config.title)} Help`} width="w-full max-w-2xl">
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Overview</h3>
          <PageIntro summary={config.summary} tone="neutral" className="border border-slate-200 bg-slate-50 px-4 py-4 text-inherit" />
        </section>

        {config.recommendations.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recommended Setup</h3>
            <HelpNoteList items={config.recommendations} tone="recommendation" />
          </section>
        ) : null}

        {config.warnings.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Warnings</h3>
            <HelpNoteList items={config.warnings} tone="warning" />
          </section>
        ) : null}

        {config.faqs.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">FAQ</h3>
            <FaqAccordion items={config.faqs} />
          </section>
        ) : null}
      </div>
    </Drawer>
  )
}
