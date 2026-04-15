import type { TicketEmailMessage } from '@/types/email.types'
import { parseNumericContractId } from '@/lib/ticketEmailContracts'

interface ResolveReplySourceEmailOptions {
  selectedInboundEmail?: TicketEmailMessage | null
  lastInboundEmail?: TicketEmailMessage | null
}

interface ResolvedReplySourceEmail {
  email: TicketEmailMessage | null
  sourceEventId: number | null
  hasInboundContext: boolean
}

function pickFirstNonNull<T>(...values: Array<T | null | undefined>): T | null {
  for (const value of values) {
    if (value != null) {
      return value
    }
  }

  return null
}

function pickFirstNonEmptyString(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return null
}

function pickPreferredList(primary?: string[] | null, fallback?: string[] | null): string[] {
  if (primary && primary.length > 0) {
    return [...primary]
  }

  if (fallback && fallback.length > 0) {
    return [...fallback]
  }

  return []
}

function resolveNumericSourceEventId(...values: Array<number | string | null | undefined>): number | null {
  for (const value of values) {
    const parsed = parseNumericContractId(value)
    if (parsed != null) {
      return parsed
    }
  }

  return null
}

function buildReplyContext(summary?: TicketEmailMessage | null, detail?: TicketEmailMessage | null) {
  const sourceEventId = resolveNumericSourceEventId(
    summary?.sourceEventId,
    summary?.replyContext?.sourceEventId,
    detail?.sourceEventId,
    detail?.replyContext?.sourceEventId,
  )
  const sourceEmailDocumentId = pickFirstNonEmptyString(
    summary?.replyContext?.sourceEmailDocumentId,
    detail?.replyContext?.sourceEmailDocumentId,
    summary?.emailDocumentId,
    detail?.emailDocumentId,
  )
  const resolvedReplyTarget = pickFirstNonEmptyString(
    summary?.replyContext?.resolvedReplyTarget,
    summary?.resolvedReplyTarget,
    detail?.replyContext?.resolvedReplyTarget,
    detail?.resolvedReplyTarget,
  )

  if (sourceEventId == null && sourceEmailDocumentId == null && resolvedReplyTarget == null) {
    return null
  }

  return {
    sourceEventId,
    sourceEmailDocumentId,
    resolvedReplyTarget,
  }
}

export function mergeSelectedInboundEmail(
  summary?: TicketEmailMessage | null,
  detail?: TicketEmailMessage | null,
): TicketEmailMessage | null {
  const inboundSummary = summary?.direction === 'INBOUND' ? summary : null
  const inboundDetail = detail?.direction === 'INBOUND' ? detail : null

  if (!inboundSummary) {
    return inboundDetail
  }

  if (!inboundDetail) {
    return {
      ...inboundSummary,
      sourceEventId: resolveNumericSourceEventId(inboundSummary.sourceEventId, inboundSummary.replyContext?.sourceEventId),
      replyContext: buildReplyContext(inboundSummary, null),
    }
  }

  return {
    ...inboundSummary,
    ...inboundDetail,
    direction: 'INBOUND',
    emailDocumentId: pickFirstNonEmptyString(inboundSummary.emailDocumentId, inboundDetail.emailDocumentId),
    mailboxId: pickFirstNonEmptyString(inboundSummary.mailboxId, inboundDetail.mailboxId),
    mailboxName: pickFirstNonEmptyString(inboundSummary.mailboxName, inboundDetail.mailboxName),
    mailboxAddress: pickFirstNonEmptyString(inboundSummary.mailboxAddress, inboundDetail.mailboxAddress),
    sourceEventId: resolveNumericSourceEventId(
      inboundSummary.sourceEventId,
      inboundSummary.replyContext?.sourceEventId,
      inboundDetail.sourceEventId,
      inboundDetail.replyContext?.sourceEventId,
    ),
    messageId: pickFirstNonEmptyString(inboundSummary.messageId, inboundDetail.messageId) ?? '',
    threadMessageId: pickFirstNonEmptyString(inboundSummary.threadMessageId, inboundDetail.threadMessageId),
    from: pickFirstNonEmptyString(inboundSummary.from, inboundDetail.from),
    to: pickPreferredList(inboundSummary.to, inboundDetail.to),
    cc: pickPreferredList(inboundSummary.cc, inboundDetail.cc),
    bcc: pickPreferredList(inboundSummary.bcc, inboundDetail.bcc),
    replyTo: pickPreferredList(inboundSummary.replyTo, inboundDetail.replyTo),
    resolvedReplyTarget: pickFirstNonEmptyString(inboundSummary.resolvedReplyTarget, inboundDetail.resolvedReplyTarget),
    detailType: inboundSummary.detailType ?? inboundDetail.detailType,
    detailId: pickFirstNonEmptyString(inboundSummary.detailId, inboundDetail.detailId),
    replyContext: buildReplyContext(inboundSummary, inboundDetail),
  }
}

export function resolveReplySourceEmail({
  selectedInboundEmail = null,
  lastInboundEmail = null,
}: ResolveReplySourceEmailOptions): ResolvedReplySourceEmail {
  const sourceEmail = selectedInboundEmail ?? lastInboundEmail ?? null
  const selectedSourceEventId = resolveNumericSourceEventId(
    selectedInboundEmail?.sourceEventId,
    selectedInboundEmail?.replyContext?.sourceEventId,
  )
  const fallbackSourceEventId = resolveNumericSourceEventId(
    lastInboundEmail?.sourceEventId,
    lastInboundEmail?.replyContext?.sourceEventId,
  )
  const sourceEventId = selectedSourceEventId ?? fallbackSourceEventId

  if (!sourceEmail) {
    return {
      email: null,
      sourceEventId: null,
      hasInboundContext: false,
    }
  }

  return {
    email: {
      ...sourceEmail,
      sourceEventId,
      replyContext: buildReplyContext(sourceEmail, lastInboundEmail),
    },
    sourceEventId,
    hasInboundContext: true,
  }
}