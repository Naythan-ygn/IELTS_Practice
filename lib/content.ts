export type Skill =
  "Grammar" | "Vocabulary" | "Reading" | "Listening" | "Writing" | "Speaking";
export type Question = {
  id: string;
  text: string;
  options?: string[];
  answer: string;
  explanation: string;
  evidence?: string;
  type: string;
};
export type Activity = {
  id: string;
  title: string;
  skill: Skill;
  minutes: number;
  description: string;
  questions: Question[];
  passage?: string;
  transcript?: string;
  audio?: string;
};
export const dayTitles = [
  "IELTS introduction & your starting point",
  "Build stronger sentences",
  "Listen for the details",
  "Read with a purpose",
  "Your first academic overview",
  "Find your speaking rhythm",
  "Reflect, review & mini mock",
  "Follow conversations & directions",
  "True, false, or not given?",
  "Make the numbers tell a story",
  "The two-minute long turn",
  "Follow an academic discussion",
  "Build your first argument",
  "Your second progress checkpoint",
  "Find the main idea",
  "Develop a convincing argument",
  "Listen beyond the keywords",
  "Think deeper in Part 3",
  "Describe processes & change",
  "Practise against the clock",
  "Full mock 1 & reflection",
  "Turn mistakes into a plan",
  "Writing with clarity",
  "Speak with confidence",
  "Read faster, understand better",
  "Stay focused while listening",
  "Full mock 2 & reflection",
  "Focus on your biggest opportunity",
  "Final readiness checkpoint",
  "You’re ready for test day",
];
const focuses: Skill[] = [
  "Grammar",
  "Grammar",
  "Listening",
  "Reading",
  "Writing",
  "Speaking",
  "Reading",
  "Listening",
  "Reading",
  "Writing",
  "Speaking",
  "Listening",
  "Writing",
  "Reading",
  "Reading",
  "Writing",
  "Listening",
  "Speaking",
  "Writing",
  "Reading",
  "Reading",
  "Grammar",
  "Writing",
  "Speaking",
  "Reading",
  "Listening",
  "Reading",
  "Grammar",
  "Reading",
  "Vocabulary",
];
const concepts = [
  [
    "Know the test",
    "Listening and Academic Reading each contain 40 questions. Reading and Writing each last 60 minutes. Speaking is a separate 11–14 minute interview. Your diagnostic gives learning indicators, not an official band.",
    "Start by reading the instruction. “NO MORE THAN TWO WORDS” means three words will lose the mark.",
    "Before practice, explain the four sections aloud.",
  ],
  [
    "Subject–verb agreement",
    "Find the head noun of the subject before choosing the verb. A phrase between the subject and verb does not change agreement.",
    "The number of students is increasing. A number of students are absent.",
    "Write three sentences about your study routine using different tenses.",
  ],
  [
    "Predict before you listen",
    "Read the form first. Decide whether each gap needs a number, name, date, or place. Corrections in the recording often signal a distractor.",
    "“We first chose Tuesday, but moved it to Thursday.” The final answer is Thursday.",
    "Replay the audio after submission and write down the correction.",
  ],
  [
    "Skim, then scan",
    "Skim for the argument and paragraph purpose. Scan for a name or number, then read the surrounding sentence carefully.",
    "A sentence mentioning trees may discuss costs rather than environmental benefits. Match meaning, not one keyword.",
    "Summarise each paragraph in six words.",
  ],
  [
    "Write an overview",
    "Task 1 needs an introduction, an overview of the most important patterns, and selected supporting details. Avoid explaining causes that the graphic does not show.",
    "Overall, cycling increased in all three cities, with Bristol recording the largest rise.",
    "Write a two-sentence overview before adding numbers.",
  ],
  [
    "Expand a natural answer",
    "Answer the question, give a reason, then add a personal example. Do not memorise an entire script.",
    "I enjoy walking because it helps me relax. I usually take a short walk after dinner.",
    "Record three 30-second answers and listen for repeated words.",
  ],
  [
    "Review the evidence",
    "Check which errors came from language and which came from instructions. A short assessment is useful for practice but cannot establish a full IELTS band.",
    "If the passage never compares two cities, a comparative claim is Not Given.",
    "Choose one mistake and explain why the wrong answer was tempting.",
  ],
  [
    "Follow the speaker’s final choice",
    "In conversations, alternatives may be rejected before a decision. In directions, anchor yourself to the entrance before following left and right.",
    "“The east room is occupied, so use the west room.” West is the final location.",
    "Sketch a simple route while listening to directions.",
  ],
  [
    "Distinguish absence from contradiction",
    "True agrees with the passage. False contradicts it. Not Given means the passage does not supply enough information. Use only the text.",
    "“Some residents cycle” does not establish that most residents cycle: Not Given.",
    "For every answer, underline evidence or identify the missing comparison.",
  ],
  [
    "Select significant data",
    "Group related categories and compare changes. Keep units and dates accurate. Do not describe every number in isolation.",
    "Cycling rose from 20% to 35%, an increase of 15 percentage points.",
    "Write one comparison using “whereas”.",
  ],
  [
    "Use your preparation minute",
    "Make brief notes for who, where, when, what happened, and why it matters. Speak from the notes rather than reading sentences.",
    "For a useful skill: cooking; sister; last year; first meal failed; now independent.",
    "Prepare for one minute and record up to two minutes.",
  ],
  [
    "Track the argument",
    "Academic speakers introduce a claim, give evidence, and qualify it. Watch for however, initially, and more recent evidence.",
    "“Initially we assumed heat was responsible; later measurements pointed to moisture.” The conclusion concerns moisture.",
    "Note a claim and the evidence supporting it.",
  ],
  [
    "State and support a position",
    "Task 2 needs a clear response to every part of the prompt. A body paragraph should develop one main idea with an explanation and a relevant example.",
    "Public transport deserves investment because frequent services can reduce car dependence.",
    "Write a thesis statement and one developed paragraph.",
  ],
  [
    "Compare like with like",
    "Compare results from similar tasks and lengths. A higher score on an easier short task does not prove a higher IELTS band.",
    "Review accuracy and time separately; speed with many errors is not progress.",
    "Write a specific adjustment for next week.",
  ],
  [
    "Match paragraph purpose",
    "A heading summarises the whole paragraph. Examples support the main idea but are usually too narrow to become a heading.",
    "A paragraph listing several failed solutions is about limitations, not just the first solution.",
    "Write your own heading before looking at choices.",
  ],
  [
    "Develop an argument",
    "Explain why your example supports your position. A clear, relevant explanation is more useful than an invented statistic.",
    "Remote study saves travel time. Learners can use this time for revision, making daily practice more manageable.",
    "Add a counterargument and a reasoned response.",
  ],
  [
    "Recognise paraphrases",
    "A speaker can express the same meaning with different words. Listen for a relationship, not an exact repeated phrase.",
    "“Costs went down” can match “a reduction in expenditure”.",
    "Collect five paraphrase pairs from the transcript.",
  ],
  [
    "Discuss the wider issue",
    "Part 3 moves from your experience to broader ideas. Compare groups, explain reasons, and qualify generalisations.",
    "Although online learning is convenient, younger students may need more direct guidance.",
    "Answer an abstract question with a reason and an exception.",
  ],
  [
    "Describe stages and locations",
    "For processes, show the order and use passive structures when the actor is unimportant. For maps, describe positions and changes accurately.",
    "After collection, the material is sorted before it is washed.",
    "Describe a familiar process in five connected sentences.",
  ],
  [
    "Use a pacing plan",
    "For Academic Reading, budget roughly 20 minutes per passage and keep time to check spelling. Move past a difficult question and return if time remains.",
    "At minute 20, reassess your pace rather than spending ten minutes on a single gap.",
    "Complete the timed reading checkpoint without pausing.",
  ],
  [
    "Examination rehearsal",
    "A full mock needs four listening parts, three reading passages, both writing tasks, and a speaking interview. This release includes a timed reading checkpoint; full mock content is pending.",
    "Record incomplete components honestly. Never turn a ten-question score into a 40-question band.",
    "Use the checkpoint, then record your next content needs.",
  ],
  [
    "Repair a repeated error",
    "Prioritise errors that recur. Revisit the explanation, make a new example, and test recall the following day.",
    "If articles recur, practise a/an for first mention and the for a specific shared reference.",
    "Review three items in your mistake notebook.",
  ],
  [
    "Revise with a purpose",
    "First check task coverage and position. Then check paragraph order, sentence boundaries, and precise word choice.",
    "Replace “a lot of good things” with a specific benefit such as “lower commuting costs”.",
    "Rewrite one paragraph and explain each change.",
  ],
  [
    "Practise sustained speech",
    "Use a brief outline and develop connected ideas. Listen to the actual recording for clarity. A typed transcript alone cannot establish pronunciation quality.",
    "Compare your first and second recording for unnecessary repetition.",
    "Record a long turn and manually transcribe a difficult section.",
  ],
  [
    "Read in meaningful chunks",
    "Read noun phrases and linked ideas together. Scan for a specific detail only after identifying the relevant paragraph.",
    "“A reduction in the cost of storage” is one idea; do not translate each word separately.",
    "Time a paragraph summary and check whether it preserves meaning.",
  ],
  [
    "Maintain attention",
    "Use the time before each section to read instructions. If you miss an answer, continue with the next question rather than losing several more.",
    "Write a short placeholder and move on; check word limits at the end.",
    "Listen once before opening the transcript.",
  ],
  [
    "Compare performance carefully",
    "A second full mock must use fresh, complete content. Until that content is available, review your saved practice evidence without claiming a new mock result.",
    "A completed writing response is evidence of practice, not an assessed writing band.",
    "Choose one objective task and one productive-skill review.",
  ],
  [
    "Choose practice from evidence",
    "Use the lowest recent objective accuracy to choose revision. Writing and speaking need criterion feedback; do not infer their bands from grammar quizzes.",
    "Low reading accuracy suggests checking paraphrases and evidence before increasing speed.",
    "Complete the recommended activity and review its mistakes.",
  ],
  [
    "Readiness requires all four skills",
    "An overall estimate needs meaningful scores for Listening, Reading, Writing, and Speaking. Short practice accuracy alone is insufficient.",
    "If speaking has not been assessed, your overall result remains Not assessed.",
    "Review your remaining assessment gaps.",
  ],
  [
    "Prepare calmly",
    "Check the arrangements supplied by your test centre, identification, travel plan, and permitted items. Sleep and a familiar routine support concentration.",
    "Make a checklist: identification, arrival time, route, confirmation, water policy.",
    "Review familiar strategies and plan a calm final evening.",
  ],
];
export const course = dayTitles.map((title, i) => ({
  day: i + 1,
  title,
  skill: focuses[i],
  minutes: [7, 14, 21, 27, 29].includes(i + 1) ? 180 : 180,
  concept: concepts[i][0],
  lesson: concepts[i][1],
  example: concepts[i][2],
  assignment: concepts[i][3],
  activity:
    i === 0
      ? "grammar-diagnostic"
      : focuses[i] === "Writing"
        ? "writing"
        : focuses[i] === "Speaking"
          ? "speaking"
          : focuses[i] === "Listening"
            ? "listening-1"
            : focuses[i] === "Reading"
              ? "reading-1"
              : focuses[i] === "Vocabulary"
                ? "vocabulary-diagnostic"
                : "grammar-diagnostic",
}));
const grammarRows: [string, string[], string, string][] = [
  [
    "The number of applicants ___ increasing.",
    ["is", "are", "be"],
    "is",
    "The head noun “number” is singular.",
  ],
  [
    "She ___ here since 2020.",
    ["lives", "has lived", "is living"],
    "has lived",
    "Use the present perfect for a situation that began in the past and continues now.",
  ],
  [
    "If I had more time, I ___ more.",
    ["will read", "would read", "read"],
    "would read",
    "An unreal present condition uses if + past simple, would + base verb.",
  ],
  [
    "The results ___ yesterday.",
    ["publish", "were published", "have publish"],
    "were published",
    "The passive past simple is was/were + past participle.",
  ],
  [
    "He is interested ___ environmental science.",
    ["on", "at", "in"],
    "in",
    "The adjective interested takes the preposition in.",
  ],
  [
    "___ university opened a new library.",
    ["A", "An", "Any"],
    "A",
    "University begins with a /y/ consonant sound, so use a.",
  ],
  [
    "The students ___ submitted their work may leave.",
    ["which", "who", "whose"],
    "who",
    "Who introduces a relative clause referring to people.",
  ],
  [
    "Despite ___ tired, she finished the essay.",
    ["being", "was", "be"],
    "being",
    "Despite takes a noun or an -ing form, not a finite clause alone.",
  ],
  [
    "There is ___ information in this report.",
    ["many", "a few", "a lot of"],
    "a lot of",
    "Information is uncountable; a lot of works with uncountable nouns.",
  ],
  [
    "This method is ___ effective than the old one.",
    ["most", "more", "much"],
    "more",
    "Use more + a longer adjective + than for comparisons.",
  ],
  [
    "By the time we arrived, the lecture ___.",
    ["had started", "starts", "has start"],
    "had started",
    "The past perfect marks an event before another past event.",
  ],
  [
    "You ___ wear a seat belt; it is compulsory.",
    ["might", "must", "could"],
    "must",
    "Must expresses a strong obligation.",
  ],
  [
    "Neither answer ___ correct.",
    ["are", "is", "were"],
    "is",
    "Neither + singular noun takes a singular verb here.",
  ],
  [
    "I look forward to ___ from you.",
    ["hear", "hearing", "heard"],
    "hearing",
    "To is a preposition in look forward to, so use an -ing form.",
  ],
  [
    "The research, ___ was published in May, is useful.",
    ["that", "what", "which"],
    "which",
    "Use which in a non-defining relative clause about a thing.",
  ],
  [
    "If water reaches 100°C at sea level, it ___.",
    ["boils", "would boil", "boiled"],
    "boils",
    "General truths use the zero conditional: present + present.",
  ],
  [
    "She suggested ___ a different approach.",
    ["try", "trying", "to trying"],
    "trying",
    "Suggest is followed by a noun or an -ing form.",
  ],
  [
    "The equipment ___ expensive.",
    ["are", "is", "have"],
    "is",
    "Equipment is an uncountable noun and takes a singular verb.",
  ],
  [
    "___ the weather was poor, the fieldwork continued.",
    ["Although", "Despite", "Because of"],
    "Although",
    "Although introduces a full clause. Despite and because of take noun phrases.",
  ],
  [
    "The essay needs ___ before submission.",
    ["revise", "revising", "revised"],
    "revising",
    "Needs + -ing has a passive meaning: needs to be revised.",
  ],
];
export const words = [
  [
    "significant",
    "adjective",
    "important or large enough to matter",
    "The study found a significant reduction in energy use.",
    "significant impact",
  ],
  [
    "allocate",
    "verb",
    "to give resources for a particular purpose",
    "The council will allocate more funds to public transport.",
    "allocate resources",
  ],
  [
    "evidence",
    "noun",
    "facts or information supporting a claim",
    "There is little evidence that the treatment works.",
    "strong evidence",
  ],
  [
    "decline",
    "verb",
    "to decrease",
    "Car ownership began to decline after 2018.",
    "decline steadily",
  ],
  [
    "sustainable",
    "adjective",
    "able to continue without exhausting resources",
    "The city is developing a sustainable transport system.",
    "sustainable development",
  ],
  [
    "assess",
    "verb",
    "to judge using relevant evidence",
    "Researchers assess the effects of the new policy.",
    "assess performance",
  ],
  [
    "consequence",
    "noun",
    "a result of an action or situation",
    "One consequence of urban growth is increased traffic.",
    "unintended consequence",
  ],
  [
    "retain",
    "verb",
    "to keep",
    "Short reviews help learners retain new vocabulary.",
    "retain information",
  ],
  [
    "contrast",
    "noun",
    "a noticeable difference",
    "There is a sharp contrast between the two approaches.",
    "in contrast",
  ],
  [
    "facilitate",
    "verb",
    "to make a process easier",
    "Frequent buses facilitate access to employment.",
    "facilitate learning",
  ],
  [
    "reliable",
    "adjective",
    "able to be trusted",
    "The team needs reliable measurements.",
    "reliable source",
  ],
  [
    "approach",
    "noun",
    "a way of dealing with something",
    "This approach combines observation and interviews.",
    "practical approach",
  ],
  [
    "estimate",
    "verb",
    "to calculate approximately",
    "Scientists estimate the age of the forest.",
    "estimate costs",
  ],
  [
    "vary",
    "verb",
    "to be different across cases",
    "Rainfall can vary considerably between regions.",
    "vary considerably",
  ],
  [
    "benefit",
    "noun",
    "a helpful or positive effect",
    "One benefit of exercise is improved sleep.",
    "potential benefit",
  ],
  [
    "restrict",
    "verb",
    "to limit",
    "Some cities restrict vehicle access to central streets.",
    "restrict access",
  ],
  [
    "establish",
    "verb",
    "to show or create firmly",
    "The experiment did not establish a causal link.",
    "establish a link",
  ],
  [
    "consume",
    "verb",
    "to use a resource",
    "Older buildings often consume more energy.",
    "consume energy",
  ],
  [
    "adapt",
    "verb",
    "to change for new conditions",
    "Farmers must adapt to a changing climate.",
    "adapt to change",
  ],
  [
    "proportion",
    "noun",
    "a part or share of a whole",
    "The proportion of cyclists rose to thirty per cent.",
    "a large proportion",
  ],
].map((w, i) => ({
  id: `word-${i}`,
  word: w[0],
  pos: w[1],
  definition: w[2],
  example: w[3],
  collocation: w[4],
}));
export const passage = `A. Urban trees are often valued for their appearance, but researchers increasingly study the services they provide. Tree canopies shade buildings and pavements. Leaves also release water vapour through transpiration, a process that can cool the surrounding air. The amount of cooling varies with species, soil moisture, and the arrangement of nearby buildings. Planting a tree is therefore not a guarantee of an identical temperature reduction in every street.

B. In the fictional city of Northbridge, a university team compared twelve streets over two summers. Six had mature tree cover and six had very little. Sensors were installed two metres above the ground and recorded temperature every fifteen minutes. On clear afternoons, the tree-lined streets were on average 2.1 degrees Celsius cooler. On cloudy mornings, however, the difference was much smaller. The researchers emphasised that these observations demonstrated an association; they did not isolate every possible cause.

C. The team also interviewed shopkeepers. Several welcomed the shade, saying that customers were more willing to pause outside their shops. Others raised concerns about roots damaging pavements and leaves blocking drains. These maintenance costs were real, but their size varied. The researchers did not collect sales figures, so the study could not establish whether trees increased business revenue.

D. Choosing suitable species is essential. A tree that grows quickly may offer early shade, yet it may also need more water or have a shorter lifespan. Native species can support local insects, although being native does not automatically make a species suitable for a narrow pavement. Soil volume, underground pipes, and the space available for roots must all be considered. Diversity can reduce the risk that a single disease will damage a whole neighbourhood’s trees.

E. Community involvement can improve the survival of newly planted trees. In Northbridge, volunteers watered young trees during dry periods and reported broken supports. The council remained responsible for pruning and specialist care. Survival rates were higher in streets with volunteers, but those streets also had larger planting pits. The researchers warned against attributing the entire difference to volunteer effort alone.

F. Urban planting requires long-term planning. The cooling benefits of a mature canopy can take decades to develop, while costs begin immediately. Protecting existing healthy trees may therefore be as valuable as planting new ones. The Northbridge team recommended monitoring both benefits and maintenance needs over time rather than judging a project only by the number of trees planted in its first year.`;
const readRows: [string, string, string, string][] = [
  [
    "All tree species provide exactly the same amount of cooling.",
    "False",
    "Cooling varies with species, soil moisture, and nearby buildings.",
    "A: The amount of cooling varies with species",
  ],
  [
    "The Northbridge team studied twelve streets.",
    "True",
    "The passage explicitly gives twelve streets.",
    "B: compared twelve streets over two summers",
  ],
  [
    "Sensors recorded temperatures every five minutes.",
    "False",
    "The interval was fifteen minutes, not five.",
    "B: recorded temperature every fifteen minutes",
  ],
  [
    "The tree-lined streets were cooler on clear afternoons.",
    "True",
    "They were on average 2.1°C cooler.",
    "B: On clear afternoons … 2.1 degrees Celsius cooler",
  ],
  [
    "Tree-lined shops earned more revenue than other shops.",
    "Not Given",
    "No sales figures were collected. The study cannot establish a revenue comparison.",
    "C: did not collect sales figures",
  ],
  [
    "Every native tree is suitable for a narrow pavement.",
    "False",
    "Native status does not automatically establish suitability.",
    "D: being native does not automatically make a species suitable",
  ],
  [
    "Volunteers were responsible for specialist pruning.",
    "False",
    "The council, not volunteers, retained this responsibility.",
    "E: council remained responsible for pruning and specialist care",
  ],
  [
    "The volunteers were mostly university students.",
    "Not Given",
    "The passage does not identify the volunteers’ occupations.",
    "E identifies volunteers but gives no occupations.",
  ],
  [
    "A mature canopy can take decades to develop.",
    "True",
    "This time frame is explicitly stated.",
    "F: can take decades to develop",
  ],
  [
    "Success should be judged only by the first year’s planting total.",
    "False",
    "The recommendation is to monitor benefits and needs over time instead.",
    "F: rather than judging a project only by the number of trees planted",
  ],
];
export const transcript = `Welcome to the Northbridge community learning centre. I am Maya, the programme coordinator. Here are the details for our Saturday study workshop. We originally planned to start at nine, but the building opens late, so the workshop will begin at nine thirty. Please arrive ten minutes early. The session will take place in the Willow room, not the Oak room, which is being repaired. The centre is on Park Street, opposite the museum. The workshop costs twelve pounds per person. This includes printed materials, but lunch is not provided. Please bring your own notebook. You do not need to bring a laptop because computers are available in the room. To book, contact Daniel at reception. His surname is Carter, spelt C A R T E R. Registration closes on Thursday. There are eighteen places in total. The first activity is a short reading exercise, followed by a discussion. Finally, if you come by bicycle, please leave it in the covered area behind the library. Thank you, and we look forward to seeing you on Saturday.`;
const listenRows: [string, string, string][] = [
  [
    "Which day is the workshop?",
    "Saturday",
    "The coordinator describes a Saturday study workshop.",
  ],
  [
    "What time will the workshop begin? (Use 9:30)",
    "9:30",
    "Nine was the original plan; nine thirty is the corrected time.",
  ],
  [
    "Which room will be used? (ONE WORD)",
    "Willow",
    "The Oak room is a distractor; it is being repaired.",
  ],
  [
    "The centre is opposite which building? (ONE WORD)",
    "museum",
    "The centre is on Park Street, opposite the museum.",
  ],
  [
    "How many pounds does the workshop cost? (NUMBER)",
    "12",
    "The fee is twelve pounds per person.",
  ],
  [
    "What should participants bring? (ONE WORD)",
    "notebook",
    "Participants must bring a notebook; computers are provided.",
  ],
  [
    "What is Daniel’s surname? (ONE WORD)",
    "Carter",
    "The surname is spelled C A R T E R in the recording.",
  ],
  [
    "On which day does registration close? (ONE WORD)",
    "Thursday",
    "Thursday is the registration deadline, not the workshop day.",
  ],
  [
    "How many places are available? (NUMBER)",
    "18",
    "There are eighteen places in total.",
  ],
  [
    "The covered bicycle area is behind the ___. (ONE WORD)",
    "library",
    "The museum locates the centre; the library locates the bicycle area.",
  ],
];
export const activities: Activity[] = [
  {
    id: "grammar-diagnostic",
    title: "Essential grammar diagnostic",
    skill: "Grammar",
    minutes: 20,
    description:
      "20 original questions · agreement, tenses, clauses & accuracy",
    questions: grammarRows.map((q, i) => ({
      id: `g${i}`,
      text: q[0],
      options: q[1],
      answer: q[2],
      explanation: q[3],
      type: "Grammar",
    })),
  },
  {
    id: "vocabulary-diagnostic",
    title: "Academic vocabulary diagnostic",
    skill: "Vocabulary",
    minutes: 15,
    description:
      "20 original questions · meaning in context & academic language",
    questions: words.map((w, i) => ({
      id: `v${i}`,
      text: `In “${w.example}” what does “${w.word}” mean?`,
      options: [
        w.definition,
        words[(i + 7) % 20].definition,
        words[(i + 13) % 20].definition,
      ].sort(),
      answer: w.definition,
      explanation: `${w.word} (${w.pos}): ${w.definition}. Common collocation: ${w.collocation}.`,
      type: "Vocabulary",
    })),
  },
  {
    id: "reading-1",
    title: "The hidden value of urban trees",
    skill: "Reading",
    minutes: 20,
    description: "Academic passage · 10 True / False / Not Given questions",
    passage,
    questions: readRows.map((q, i) => ({
      id: `r${i}`,
      text: q[0],
      options: ["True", "False", "Not Given"],
      answer: q[1],
      explanation: q[2],
      evidence: q[3],
      type: "True / False / Not Given",
    })),
  },
  {
    id: "listening-1",
    title: "A community study workshop",
    skill: "Listening",
    minutes: 12,
    description: "Original audio · 10 short-answer questions · practice mode",
    transcript,
    audio: "/audio/workshop.wav",
    questions: listenRows.map((q, i) => ({
      id: `l${i}`,
      text: q[0],
      answer: q[1],
      explanation: q[2],
      type: "Short answer",
    })),
  },
];
export const writingPrompts = [
  {
    id: "task1-cycling",
    task: 1,
    title: "Cycling to work",
    prompt:
      "The chart shows the percentage of commuters who cycled to work in three cities in 2010 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    data: [
      { city: "Bristol", before: 15, after: 35 },
      { city: "York", before: 20, after: 30 },
      { city: "Leeds", before: 10, after: 18 },
    ],
  },
  {
    id: "task2-transport",
    task: 2,
    title: "Investing in public transport",
    prompt:
      "Some people believe governments should invest more in public transport than in building new roads. To what extent do you agree or disagree? Give reasons for your answer and include relevant examples from your knowledge or experience.",
  },
  {
    id: "task2-online",
    task: 2,
    title: "Learning online",
    prompt:
      "Online education is becoming more common. What are the advantages and disadvantages of this development? Give reasons and relevant examples.",
  },
];
export const speakingSets = [
  {
    title: "A skill you learned",
    part1: [
      "Do you work or study?",
      "What do you enjoy about your daily routine?",
      "Do you prefer studying alone or with others?",
    ],
    cue: "Describe a useful skill you learned. Say what it was, when and how you learned it, and explain why it is useful to you.",
    part3: [
      "How has technology changed the way people learn skills?",
      "Should schools focus more on practical skills? Why?",
    ],
  },
  {
    title: "A place you enjoy",
    part1: [
      "Where do you live?",
      "What do you like about your neighbourhood?",
      "How often do you spend time outdoors?",
    ],
    cue: "Describe a place you enjoy visiting. Say where it is, what you do there, who you go with, and explain why you enjoy it.",
    part3: [
      "Why are public spaces important in cities?",
      "How might city life change in the future?",
    ],
  },
];
export function publicActivities() {
  return activities.map(({ transcript, ...a }) => ({
    ...a,
    questions: a.questions.map(({ answer, explanation, evidence, ...q }) => q),
  }));
}
