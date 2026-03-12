export interface ContractInput {
  jobTitle: string;
  estate: string;
  slots: string[];
  durationWeeks: number | null;
  remunerationMin: number | null;
  remunerationMax: number | null;
  description: string;
  creatorName: string;
  jobberName: string;
}

function formatSlot(slot: string): string {
  const [day, period] = slot.split('_');
  const times: Record<string, string> = {
    morning: '9–12pm',
    afternoon: '2–5pm',
    evening: '6–9pm',
  };
  return `${day} ${times[period] ?? period}`;
}

export function generateContract(input: ContractInput): string {
  const {
    jobTitle, estate, slots, durationWeeks,
    remunerationMin, remunerationMax,
    description, creatorName, jobberName,
  } = input;

  const schedule = slots.length > 0 ? slots.map(formatSlot).join(', ') : 'To be confirmed';
  const duration = durationWeeks ? `${durationWeeks} week${durationWeeks !== 1 ? 's' : ''}` : 'Ongoing / as needed';
  const pay =
    remunerationMin != null || remunerationMax != null
      ? `$${remunerationMin ?? '?'}–$${remunerationMax ?? '?'} per hour`
      : 'To be agreed between parties';
  const scope = description.trim() || 'As discussed between parties.';

  return `SERVICE AGREEMENT
════════════════════════════════════

Employer:          ${creatorName}
Service Provider:  ${jobberName}

────────────────────────────────────
ROLE & TERMS
────────────────────────────────────
Position:  ${jobTitle}
Location:  ${estate}
Schedule:  ${schedule}
Duration:  ${duration}
Pay Rate:  ${pay}

────────────────────────────────────
SCOPE OF WORK
────────────────────────────────────
${scope}

────────────────────────────────────
AGREEMENT
────────────────────────────────────
By signing this agreement, both parties confirm they have read and understood the terms above and agree to fulfil their respective obligations for the duration of this engagement. This agreement is entered into in good faith.`;
}
