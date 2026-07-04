// All 23 lawyer interview questions, organized into 5 sections.
// Skip logic: Section 3 (Digilawyer) only shows if the lawyer answers "yes" to Q11 ("Have you used Digilawyer?")

export interface Question {
  id: string;
  section: number;
  sectionTitle: string;
  sectionSubtitle: string;
  prompt: string;
  // Optional follow-up nudge shown under the prompt
  hint?: string;
  // If "skipIf" returns true from the answers map, this question is hidden
  skipIf?: (answers: Record<string, string>) => boolean;
  // Minimum recommended length (chars) for the answer to be considered "substantial"
  minLength?: number;
}

export const QUESTIONS: Question[] = [
  // ---------- Section 1: Day-to-day (baseline) ----------
  {
    id: "q1",
    section: 1,
    sectionTitle: "Your day-to-day",
    sectionSubtitle: "Establishing the baseline — how you actually spend your time.",
    prompt: "Walk me through your typical week — what do you spend the most hours on that isn't actually 'practicing law' (arguing, advising, negotiating)?",
    hint: "Think admin, research, drafting, client calls, court runs, billing.",
    minLength: 80,
  },
  {
    id: "q2",
    section: 1,
    sectionTitle: "Your day-to-day",
    sectionSubtitle: "Establishing the baseline — how you actually spend your time.",
    prompt: "What's the last task you did that felt like a total waste of your time as a lawyer?",
    hint: "Be specific. Name the task, not the category.",
    minLength: 60,
  },
  {
    id: "q3",
    section: 1,
    sectionTitle: "Your day-to-day",
    sectionSubtitle: "Establishing the baseline — how you actually spend your time.",
    prompt: "How do you currently do legal research — for a case, a statute, a precedent? Walk me through the actual steps.",
    hint: "From the moment you realize you need to look something up, to the moment you have your answer.",
    minLength: 120,
  },
  {
    id: "q4",
    section: 1,
    sectionTitle: "Your day-to-day",
    sectionSubtitle: "Establishing the baseline — how you actually spend your time.",
    prompt: "How long did your last 'find the relevant case law / statute' task take you, start to finish?",
    hint: "A rough estimate is fine — minutes or hours.",
    minLength: 30,
  },
  {
    id: "q5",
    section: 1,
    sectionTitle: "Your day-to-day",
    sectionSubtitle: "Establishing the baseline — how you actually spend your time.",
    prompt: "What do you use PakistanLawSite / PLD / other legal databases for, and where do they fall short?",
    hint: "Name the tool, then tell me the moment it frustrates you.",
    minLength: 80,
  },

  // ---------- Section 2: Pain points (the money section) ----------
  {
    id: "q6",
    section: 2,
    sectionTitle: "Pain points",
    sectionSubtitle: "The money section — this is where the real product insights live.",
    prompt: "What's the most frustrating, repetitive part of your job that you wish someone would just automate for you?",
    hint: "If you could wave a wand and make one task disappear, what is it?",
    minLength: 80,
  },
  {
    id: "q7",
    section: 2,
    sectionTitle: "Pain points",
    sectionSubtitle: "The money section — this is where the real product insights live.",
    prompt: "Tell me about a time you missed something important (a precedent, a deadline, a clause) because you didn't have time to check thoroughly.",
    hint: "What happened? What was the consequence?",
    minLength: 120,
  },
  {
    id: "q8",
    section: 2,
    sectionTitle: "Pain points",
    sectionSubtitle: "The money section — this is where the real product insights live.",
    prompt: "What tasks do you currently pay a junior associate or clerk to do that you wish were faster or cheaper?",
    hint: "Be specific about the task and roughly what it costs you.",
    minLength: 80,
  },
  {
    id: "q9",
    section: 2,
    sectionTitle: "Pain points",
    sectionSubtitle: "The money section — this is where the real product insights live.",
    prompt: "When drafting contracts / pleadings / notices, what do you copy-paste from old documents versus write fresh — and why?",
    hint: "Walk me through your last drafting session.",
    minLength: 100,
  },
  {
    id: "q10",
    section: 2,
    sectionTitle: "Pain points",
    sectionSubtitle: "The money section — this is where the real product insights live.",
    prompt: "What's something a client asks you that takes you way longer to answer than it should?",
    hint: "The question itself is simple. The work behind it is not.",
    minLength: 80,
  },

  // ---------- Section 3: Digilawyer specifically ----------
  // Q11 is the gate. If "no", Q12–Q17 are skipped.
  {
    id: "q11",
    section: 3,
    sectionTitle: "Digilawyer & competitive intel",
    sectionSubtitle: "Critical — this tells us where existing tools win and where they break.",
    prompt: "Have you used Digilawyer? If yes — what for, and how often?",
    hint: "If you've never used it, just say 'no' and we'll skip ahead.",
    minLength: 10,
  },
  {
    id: "q12",
    section: 3,
    sectionTitle: "Digilawyer & competitive intel",
    sectionSubtitle: "Critical — this tells us where existing tools win and where they break.",
    prompt: "What's the one thing Digilawyer does that actually saves you time?",
    skipIf: (a) => !a.q11 || /^no\b/i.test(a.q11.trim()),
    minLength: 40,
  },
  {
    id: "q13",
    section: 3,
    sectionTitle: "Digilawyer & competitive intel",
    sectionSubtitle: "Critical — this tells us where existing tools win and where they break.",
    prompt: "What's the one thing you tried to do with Digilawyer that it couldn't handle, or got wrong?",
    skipIf: (a) => !a.q11 || /^no\b/i.test(a.q11.trim()),
    minLength: 40,
  },
  {
    id: "q14",
    section: 3,
    sectionTitle: "Digilawyer & competitive intel",
    sectionSubtitle: "Critical — this tells us where existing tools win and where they break.",
    prompt: "Has Digilawyer (or any legal AI tool) ever given you an answer you couldn't trust or had to double-check yourself? What happened?",
    skipIf: (a) => !a.q11 || /^no\b/i.test(a.q11.trim()),
    minLength: 80,
  },
  {
    id: "q15",
    section: 3,
    sectionTitle: "Digilawyer & competitive intel",
    sectionSubtitle: "Critical — this tells us where existing tools win and where they break.",
    prompt: "What do you pay for Digilawyer (or would you pay), and does it feel worth it?",
    skipIf: (a) => !a.q11 || /^no\b/i.test(a.q11.trim()),
    minLength: 30,
  },
  {
    id: "q16",
    section: 3,
    sectionTitle: "Digilawyer & competitive intel",
    sectionSubtitle: "Critical — this tells us where existing tools win and where they break.",
    prompt: "If you stopped using Digilawyer tomorrow, what would you miss — and what wouldn't you miss at all?",
    skipIf: (a) => !a.q11 || /^no\b/i.test(a.q11.trim()),
    minLength: 60,
  },
  {
    id: "q17",
    section: 3,
    sectionTitle: "Digilawyer & competitive intel",
    sectionSubtitle: "Critical — this tells us where existing tools win and where they break.",
    prompt: "Who else on your team uses it, and who refuses to? Why?",
    skipIf: (a) => !a.q11 || /^no\b/i.test(a.q11.trim()),
    minLength: 40,
  },

  // ---------- Section 4: The gap ----------
  {
    id: "q18",
    section: 4,
    sectionTitle: "The gap — what to build",
    sectionSubtitle: "If you could have anything, what would it be?",
    prompt: "If you had a magic legal assistant that could do ONE thing perfectly for you, what would it be?",
    hint: "One thing. Not five.",
    minLength: 60,
  },
  {
    id: "q19",
    section: 4,
    sectionTitle: "The gap — what to build",
    sectionSubtitle: "If you could have anything, what would it be?",
    prompt: "Is there a specific area of Pakistani law (provincial law, a particular court's procedure, a specific practice area) where good tools just don't exist?",
    hint: "Be as specific as you can — court name, statute, province, anything.",
    minLength: 60,
  },
  {
    id: "q20",
    section: 4,
    sectionTitle: "The gap — what to build",
    sectionSubtitle: "If you could have anything, what would it be?",
    prompt: "Would you trust an AI tool more if it showed you the exact statute / case it pulled an answer from, versus just giving you an answer? Why or why not?",
    minLength: 80,
  },
  {
    id: "q21",
    section: 4,
    sectionTitle: "The gap — what to build",
    sectionSubtitle: "If you could have anything, what would it be?",
    prompt: "What would it take for you to actually pay for a new legal AI tool instead of your current workflow? (price, accuracy, integration with something you already use)",
    minLength: 80,
  },

  // ---------- Section 5: Closing ----------
  {
    id: "q22",
    section: 5,
    sectionTitle: "Closing",
    sectionSubtitle: "Never skip this section.",
    prompt: "Is there anything I haven't asked about that's a real problem in your practice?",
    hint: "This is your chance to tell me what I missed.",
    minLength: 40,
  },
  {
    id: "q23",
    section: 5,
    sectionTitle: "Closing",
    sectionSubtitle: "Never skip this section.",
    prompt: "Would you be open to trying an early version of something I'm building, in exchange for feedback?",
    hint: "Yes / no / maybe — and what would you want to try first?",
    minLength: 10,
  },
];

// Compute the visible question list given current answers (applies skip logic)
export function getVisibleQuestions(answers: Record<string, string>): Question[] {
  return QUESTIONS.filter((q) => !q.skipIf || !q.skipIf(answers));
}

export const PRACTICE_AREAS = [
  "Litigation",
  "Corporate / Commercial",
  "Family",
  "Criminal",
  "Constitutional",
  "Tax",
  "Property / Real Estate",
  "Banking & Finance",
  "Intellectual Property",
  "Labor & Employment",
  "Cyber / Technology",
  "Other",
];

export const SECTIONS = [
  { id: 1, title: "Your day-to-day", subtitle: "Establishing the baseline." },
  { id: 2, title: "Pain points", subtitle: "The money section." },
  { id: 3, title: "Digilawyer & competitive intel", subtitle: "Where existing tools win and break." },
  { id: 4, title: "The gap", subtitle: "What to actually build." },
  { id: 5, title: "Closing", subtitle: "Never skip." },
];
