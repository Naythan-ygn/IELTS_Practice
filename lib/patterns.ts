import type {
  Pattern,
  WorkedExample,
  Visual,
  Strategy,
} from "./strategy-types";
const example = (
  source: string,
  question: string,
  answer: string,
  ...steps: string[]
): WorkedExample => ({ source, question, answer, steps });
const rows: [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  WorkedExample,
  WorkedExample,
][] = [
  [
    "listening-multiple-choice",
    "Listening",
    "Multiple Choice",
    "Identify the speaker’s intended reason, view or detail.",
    "A question with three choices; some tasks require more than one selection.",
    "Listen to the complete reason and reject options the speaker mentions but dismisses.",
    "Word matching without checking who holds the opinion.",
    example(
      "We considered the central hall, but its rent was too high. The riverside room was affordable, so we chose it.",
      "Why was the riverside room chosen?",
      "It cost less.",
      "Identify the final choice.",
      "Link affordable to cost less.",
      "The central hall was rejected.",
    ),
    example(
      "The survey was delayed because too few people replied, not because the software failed.",
      "Why was the survey delayed?",
      "Insufficient responses.",
      "Follow because to the stated cause.",
      "Reject the explicitly denied software problem.",
    ),
  ],
  [
    "listening-matching",
    "Listening",
    "Matching",
    "Connect people, items or places with the correct features.",
    "A list of speakers/items and a separate option list; options may be reusable if instructions allow.",
    "Track each named item and summarise the speaker’s final description.",
    "Assigning the first familiar option before hearing the complete comment.",
    example(
      "Mina preferred the workshop for beginners. Alex chose the advanced seminar.",
      "Who selected the beginner workshop?",
      "Mina",
      "Keep names separate.",
      "Match beginners to beginner workshop.",
    ),
    example(
      "The coast trip is scenic but strenuous. The forest walk is suitable for families.",
      "Which trip suits families?",
      "The forest walk",
      "Attach each feature to its own trip.",
      "Scenic does not mean suitable for children.",
    ),
  ],
  [
    "listening-map",
    "Listening",
    "Map and Plan Labelling",
    "Follow directions relative to a fixed viewpoint.",
    "A plan with numbered locations and landmarks.",
    "Locate the starting point; follow orientation changes and fixed landmarks.",
    "Treating the speaker’s left as the map’s left after a turn.",
    example(
      "From the entrance, walk straight past reception. The café is the first room on your right.",
      "Which location is the café?",
      "First room on the right after reception.",
      "Anchor at the entrance.",
      "Pass reception before looking right.",
    ),
    example(
      "Facing north at the gate, the studio is west of the pond.",
      "Which side of the pond is the studio?",
      "West",
      "Establish north first.",
      "Convert west to the map orientation.",
    ),
  ],
  [
    "listening-diagram",
    "Listening",
    "Diagram Labelling",
    "Connect spoken descriptions to parts of an object.",
    "An illustration with arrows and empty labels.",
    "Use shape, position and function to identify the indicated part.",
    "Choosing a nearby part because its name appears in the recording.",
    example(
      "Water enters through the upper pipe and leaves through the lower outlet.",
      "Label the lower opening.",
      "Outlet",
      "Contrast the two directions.",
      "Lower and leaves identify the outlet.",
    ),
    example(
      "The sensor is mounted above the display, beneath the protective cover.",
      "What is above the display?",
      "Sensor",
      "Trace the vertical relationships.",
      "The cover is above the sensor, not the answer location.",
    ),
  ],
  [
    "listening-form",
    "Listening",
    "Form Completion",
    "Capture practical details such as names, dates and reference numbers.",
    "A registration or booking form with gaps.",
    "Predict the information class, listen for corrections, and check spelling and limits.",
    "Writing an initial date that the speaker later changes.",
    example(
      "Book me for Thursday—sorry, I mean Friday.",
      "Booking day: ____",
      "Friday",
      "Predict a weekday.",
      "Treat sorry, I mean as a correction.",
      "Write the final date.",
    ),
    example(
      "My surname is Hale, H A L E.",
      "Surname: ____",
      "Hale",
      "Use the spelling rather than a similar-sounding word.",
      "Check every letter.",
    ),
  ],
  [
    "listening-note",
    "Listening",
    "Note Completion",
    "Extract key facts from condensed notes.",
    "Headings and bullet points with missing words.",
    "Follow the heading’s topic and the grammatical shape of each gap.",
    "Copying an interesting detail from the wrong heading.",
    example(
      "For the field visit, bring a notebook. The worksheets will be supplied.",
      "Students must bring a ____.",
      "notebook",
      "Predict a singular countable noun after a.",
      "Separate required items from supplied ones.",
    ),
    example(
      "The lecture focuses on soil erosion, especially the loss of topsoil.",
      "Main topic: soil ____.",
      "erosion",
      "Use the stated topic.",
      "Topsoil is an example of what is lost.",
    ),
  ],
  [
    "listening-table",
    "Listening",
    "Table Completion",
    "Compare parallel categories without mixing rows or units.",
    "Rows for items and columns for features, prices or times.",
    "Track the current row label before filling its column.",
    "Putting a correct number in the wrong row.",
    example(
      "The weekday pass costs eight pounds; the weekend pass is twelve.",
      "Weekend pass (£): ____",
      "12",
      "Identify the weekend row.",
      "Do not use the weekday price.",
    ),
    example(
      "The morning session lasts forty minutes and the afternoon session lasts fifty.",
      "Afternoon duration (minutes): ____",
      "50",
      "Read the row label.",
      "Use the correct unit already supplied by the column.",
    ),
  ],
  [
    "listening-flow",
    "Listening",
    "Flow-chart Completion",
    "Follow the order of actions in a procedure.",
    "Boxes connected by arrows, with gaps in stages.",
    "Listen for sequencing signals and distinguish preparation from the next action.",
    "Reversing two stages mentioned close together.",
    example(
      "First rinse the samples, then dry them before weighing.",
      "After rinsing, the samples are ____.",
      "dried",
      "Follow first, then, before.",
      "Drying precedes weighing.",
    ),
    example(
      "Applications are checked before an interview is arranged.",
      "After checking applications, arrange an ____.",
      "interview",
      "Identify the next stage.",
      "Do not repeat the checking step.",
    ),
  ],
  [
    "listening-summary",
    "Listening",
    "Summary Completion",
    "Follow the meaning of a compressed account.",
    "A short paragraph paraphrasing part of the recording.",
    "Use sentence grammar and meaning to align the summary with the speaker’s account.",
    "Choosing the same word from a different part of the recording.",
    example(
      "Using insulation reduced the building’s energy consumption.",
      "Insulation lowered energy ____.",
      "consumption",
      "Map reduced to lowered.",
      "Keep the noun after energy.",
    ),
    example(
      "The project was successful because residents volunteered regularly.",
      "Regular help from ____ contributed to success.",
      "residents",
      "Identify who helped.",
      "Volunteered maps to help.",
    ),
  ],
  [
    "listening-sentence",
    "Listening",
    "Sentence Completion",
    "Supply a detail that completes a grammatical statement.",
    "A complete sentence with one or more gaps.",
    "Predict a word class and fit the exact spoken detail within the word limit.",
    "Adding words already printed in the sentence.",
    example(
      "Participants should meet at the museum entrance.",
      "The meeting point is the museum ____.",
      "entrance",
      "Museum is already printed.",
      "Write only the missing noun.",
    ),
    example(
      "The grant covers travel but excludes accommodation.",
      "The grant does not pay for ____.",
      "accommodation",
      "Track the negative does not.",
      "Excludes matches does not pay for.",
    ),
  ],
  [
    "listening-short",
    "Listening",
    "Short-answer Questions",
    "Retrieve a precise answer to a direct question.",
    "A question followed by a short response field and a word limit.",
    "Identify what the question asks and answer only that information.",
    "Writing a full sentence that breaks the word limit.",
    example(
      "Registration closes on Tuesday at noon.",
      "On what day does registration close? ONE WORD",
      "Tuesday",
      "The question asks for the day.",
      "Noon is not needed.",
    ),
    example(
      "The guide asks visitors to leave bags in the lockers.",
      "Where should visitors leave their bags? ONE WORD",
      "lockers",
      "Listen for the location.",
      "Omit words already implied by the question.",
    ),
  ],
  [
    "reading-tfng",
    "Reading",
    "True / False / Not Given",
    "Distinguish support, contradiction and missing information.",
    "Statements about factual information in the passage.",
    "Find the relevant idea and compare its scope, qualifiers and relationships.",
    "Calling missing information False.",
    example(
      "The centre opens at 8 am on weekdays. Weekend hours are not stated.",
      "The centre opens at 8 am on Sunday.",
      "Not Given",
      "Find the stated scope: weekdays.",
      "Sunday is outside that scope.",
      "No weekend fact supports or contradicts the claim.",
    ),
    example(
      "All participants completed the first survey, but only half completed the follow-up.",
      "Every participant completed the follow-up.",
      "False",
      "Compare every with only half.",
      "The passage explicitly contradicts the statement.",
    ),
  ],
  [
    "reading-ynng",
    "Reading",
    "Yes / No / Not Given",
    "Identify whether a claim matches the writer’s view.",
    "Statements about claims or opinions; answer Yes, No or Not Given.",
    "Determine the writer’s own position, separating it from quoted views.",
    "Using True/False labels or assuming a quoted opinion belongs to the writer.",
    example(
      "Some commentators call the scheme wasteful. In my view, its long-term benefits justify its cost.",
      "The writer thinks the scheme is worth its cost.",
      "Yes",
      "Separate commentators from the writer.",
      "Justify its cost supports the statement.",
    ),
    example(
      "The author supports remote work but does not discuss its effect on salaries.",
      "The writer believes remote work raises salaries.",
      "Not Given",
      "Support for remote work is stated.",
      "No salary opinion is supplied.",
    ),
  ],
  [
    "reading-headings",
    "Reading",
    "Matching Headings",
    "Identify a paragraph’s main purpose rather than a single example.",
    "A list of headings matched to paragraphs or sections.",
    "Summarise each paragraph in your own words, then compare the full heading.",
    "Selecting a heading because it repeats one vivid detail.",
    example(
      "A trial used solar lamps, but batteries failed, repair costs rose and volunteers withdrew. The project was discontinued.",
      "Choose: a solar breakthrough / obstacles to a pilot project",
      "Obstacles to a pilot project",
      "Solar lamps are the topic, not the purpose.",
      "The paragraph develops a series of obstacles.",
    ),
    example(
      "An archive once required visits. Digitisation now lets readers search from home, widening access.",
      "Choose: damage to old records / improved access to archives",
      "Improved access to archives",
      "Identify the before/after relationship.",
      "Search from home supports improved access.",
    ),
  ],
  [
    "reading-information",
    "Reading",
    "Matching Information",
    "Locate a specific example, reason, description or comparison.",
    "Statements matched to paragraph letters; letters may repeat if allowed.",
    "Scan for the requested relationship and verify the exact detail in its paragraph.",
    "Choosing a paragraph’s general topic when the required detail is elsewhere.",
    example(
      "A: The project began in 2018. B: Costs rose because transport became more expensive.",
      "Which paragraph explains rising costs?",
      "B",
      "Look for a cause, not a date.",
      "Because supplies the reason.",
    ),
    example(
      "A: Most materials were recycled. B: The two designs differed in weight but not strength.",
      "Which paragraph contains a comparison?",
      "B",
      "Find two items compared on shared properties.",
      "A gives one property only.",
    ),
  ],
  [
    "reading-features",
    "Reading",
    "Matching Features",
    "Connect statements to people, groups, dates or categories.",
    "A set of statements and a list of named features.",
    "Track attribution carefully; match who said or found each idea.",
    "Assigning one researcher’s finding to another mentioned nearby.",
    example(
      "Liu studied night noise; Patel measured daytime air quality.",
      "Who investigated noise?",
      "Liu",
      "Attach studied night noise to Liu.",
      "Do not match by the order of names alone.",
    ),
    example(
      "The 2015 report measured costs; the 2020 report examined access.",
      "Which report investigated access?",
      "2020",
      "Identify the feature category: year.",
      "Match the topic access.",
    ),
  ],
  [
    "reading-endings",
    "Reading",
    "Matching Sentence Endings",
    "Join ideas while preserving meaning and grammar.",
    "Sentence beginnings with more endings than needed.",
    "Locate the beginning’s idea in the text, then test both meaning and grammatical fit.",
    "Choosing a grammatically possible ending unsupported by the passage.",
    example(
      "Insulation kept rooms warmer and reduced heating demand.",
      "Insulation was installed to…",
      "reduce heating demand.",
      "Find the purpose of insulation.",
      "Do not add a claim about construction costs.",
    ),
    example(
      "The experiment was repeated because the first sample was contaminated.",
      "Researchers repeated the experiment because…",
      "the original sample was contaminated.",
      "Match the reason.",
      "Do not confuse repetition with a new research aim.",
    ),
  ],
  [
    "reading-multiple-choice",
    "Reading",
    "Multiple Choice",
    "Interpret detail, purpose, inference or the main idea.",
    "A question with several answer options.",
    "Locate the relevant text and eliminate contradicted, exaggerated or unsupported choices.",
    "Selecting a plausible real-world claim without passage support.",
    example(
      "The new bus route improved access, though journeys were not faster.",
      "Main benefit: faster journeys / better access",
      "Better access",
      "The text denies greater speed.",
      "Access is the explicitly stated benefit.",
    ),
    example(
      "A study found an association between reading and wellbeing, but did not test causation.",
      "The study established: a link / proof that reading causes wellbeing",
      "A link",
      "Association is a link.",
      "The causal option is stronger than the evidence.",
    ),
  ],
  [
    "reading-sentence",
    "Reading",
    "Sentence Completion",
    "Find exact details to complete statements.",
    "Sentences with gaps and a word limit.",
    "Locate the paraphrased statement and select words that fit grammar and instructions.",
    "Writing an extra adjective beyond the allowed limit.",
    example(
      "The seeds were stored in sealed containers.",
      "Seeds were kept in sealed ____. ONE WORD",
      "containers",
      "Stored maps to kept.",
      "Sealed is already supplied.",
    ),
    example(
      "The instrument measured humidity every hour.",
      "The instrument recorded ____ hourly. ONE WORD",
      "humidity",
      "Measured maps to recorded.",
      "Every hour maps to hourly.",
    ),
  ],
  [
    "reading-summary",
    "Reading",
    "Summary Completion",
    "Reconstruct the meaning of part of a passage.",
    "A short summary with gaps; use passage words or a supplied word bank as instructed.",
    "Find the relevant section and use grammar plus meaning to choose each gap.",
    "Assuming a synonym may replace passage words when exact extraction is required.",
    example(
      "Farmers planted hedges to reduce soil loss.",
      "Hedges were planted to prevent loss of ____. ONE WORD",
      "soil",
      "Match reduce soil loss to prevent loss of.",
      "Use the passage noun.",
    ),
    example(
      "The system stores excess electricity in batteries.",
      "Surplus electricity is kept in ____. ONE WORD",
      "batteries",
      "Excess maps to surplus.",
      "Stores maps to kept.",
    ),
  ],
  [
    "reading-note",
    "Reading",
    "Note Completion",
    "Retrieve key details from condensed notes.",
    "Headings or bullet points with gaps.",
    "Use headings to find the relevant section, then extract precisely.",
    "Answering from the wrong subsection.",
    example(
      "Equipment: visitors need a torch and waterproof boots. Food is provided.",
      "Required footwear: waterproof ____.",
      "boots",
      "Use the equipment section.",
      "Torch is equipment but not footwear.",
    ),
    example(
      "The archive accepts photographs but not audio tapes.",
      "Accepted material: ____. ONE WORD",
      "photographs",
      "Track the contrast accepts / not.",
      "Do not copy the rejected item.",
    ),
  ],
  [
    "reading-table",
    "Reading",
    "Table Completion",
    "Organise parallel facts accurately.",
    "A table with categories, dates or measurements.",
    "Match both the row and the column; retain units and word limits.",
    "Switching a value between categories.",
    example(
      "Copper expanded by 2 mm; steel expanded by 1 mm.",
      "Steel expansion (mm): ____",
      "1",
      "Find the steel row.",
      "The copper value belongs elsewhere.",
    ),
    example(
      "The trial in May used 80 samples; June used 95.",
      "June sample total: ____",
      "95",
      "Identify June.",
      "Do not copy the earlier month’s value.",
    ),
  ],
  [
    "reading-flow",
    "Reading",
    "Flow-chart Completion",
    "Understand the order of a process.",
    "Ordered boxes representing a sequence.",
    "Trace the stages in the passage and check passive verbs and temporal links.",
    "Skipping a small intermediate stage.",
    example(
      "After washing comes inspection, before packing.",
      "Washing → ____ → packing",
      "inspection",
      "After and before place inspection between the other stages.",
      "Use the noun form if the instructions provide a word bank.",
    ),
    example(
      "The three stages are crushing, heating, then cooling.",
      "Crushing → heating → ____",
      "cooling",
      "Follow the explicit sequence.",
      "Do not introduce an unstated filtering stage.",
    ),
  ],
  [
    "reading-diagram",
    "Reading",
    "Diagram Labelling",
    "Map a written description onto a diagram.",
    "An image with arrows pointing to parts.",
    "Use spatial relationships and function to identify each labelled part.",
    "Naming a nearby part instead of the one indicated.",
    example(
      "The filter sits above the pump and below the inlet.",
      "Label the part between pump and inlet.",
      "filter",
      "Establish the vertical order.",
      "The middle item is the filter.",
    ),
    example(
      "A valve at the end of the pipe controls the outflow.",
      "Which part controls the outflow?",
      "valve",
      "Match the functional description.",
      "Pipe carries flow; valve controls it.",
    ),
  ],
  [
    "reading-short",
    "Reading",
    "Short-answer Questions",
    "Locate a concise, exact response.",
    "Direct questions with word/number limits.",
    "Identify the requested information and extract only what answers it.",
    "Including context that exceeds the word limit.",
    example(
      "The workshop was held at the science museum in March.",
      "Where was it held? TWO WORDS",
      "science museum",
      "The question asks for place.",
      "March answers when, not where.",
    ),
    example(
      "The research was funded by the council.",
      "Who funded the research? ONE WORD",
      "council",
      "Find the agent of the passive construction.",
      "Omit the when the limit requires one word.",
    ),
  ],
];
const visualRows = [
  { label: "Bristol", before: 15, after: 35 },
  { label: "York", before: 20, after: 30 },
  { label: "Leeds", before: 10, after: 18 },
];
const writing1: [string, string, string, string][] = [
  [
    "line",
    "Line Graph",
    "Identify the overall direction, turning points and significant comparisons over time.",
    "Use past tense for past periods; describe a projection as a projection.",
  ],
  [
    "bar",
    "Bar Chart",
    "Compare categories on the same scale and select the largest differences.",
    "Distinguish percentage points from percentage change.",
  ],
  [
    "pie",
    "Pie Chart",
    "Compare shares of a whole and identify the largest and smallest segments.",
    "A share is not an absolute count; check whether totals differ.",
  ],
  [
    "table",
    "Table",
    "Group significant numbers rather than listing every cell.",
    "Keep dates, categories and units attached to the right figures.",
  ],
  [
    "map",
    "Map Comparison",
    "Select major changes in location, access and land use.",
    "Use relative position and change verbs; do not invent reasons.",
  ],
  [
    "process",
    "Process Diagram",
    "Describe the main stages, beginning and end in a logical sequence.",
    "Use passive structures when the actor is unimportant; identify cycles accurately.",
  ],
  [
    "mixed",
    "Combined Visuals",
    "Explain the relationship between the visuals without assuming causation.",
    "Compare compatible measures and keep distinct units separate.",
  ],
];
for (const [id, name, purpose, trap] of writing1) {
  const visual: Visual = {
    kind: id as Visual["kind"],
    title:
      id === "process"
        ? "Paper recycling"
        : id === "map"
          ? "Library layout: before and after"
          : "Cycling commuters (%)",
    rows: visualRows,
    labels:
      id === "process"
        ? ["Collect paper", "Sort", "Wash", "Pulp", "Dry into sheets"]
        : id === "map"
          ? [
              "Entrance",
              "Reading room → expanded reading room",
              "Storage → study room",
            ]
          : undefined,
  };
  rows.push([
    `writing1-${id}`,
    "Writing",
    `${name} · Task 1`,
    purpose,
    "An actual visual stimulus followed by a summary task.",
    "Select an overview, group details, and make accurate comparisons.",
    trap,
    {
      ...example(
        id === "process"
          ? "Paper is collected, sorted, washed, pulped, and dried into sheets."
          : id === "map"
            ? "Storage becomes a study room; the entrance stays in place."
            : "Bristol: 15% → 35%; York: 20% → 30%; Leeds: 10% → 18%.",
        "What belongs in the overview?",
        id === "process"
          ? "The process converts waste paper into new sheets through five main stages."
          : id === "map"
            ? "The library gains more space for study while retaining its entrance."
            : "Cycling increases in all three cities, with Bristol recording the largest rise.",
        "Identify the main changes.",
        "Keep specific data for the detail paragraphs.",
        "Four paragraphs are a flexible planning method, not an official requirement.",
      ),
      visual,
    },
    {
      ...example(
        "Task 1 planning: introduction, overview, grouped details, remaining significant details.",
        "What should you check before finalising a description?",
        "Every comparison must match the displayed information.",
        "Read labels and units again.",
        "Remove explanations of causes that the visual does not supply.",
      ),
      visual,
    },
  ]);
}
const essayRows: [string, string, string, string][] = [
  [
    "opinion",
    "Opinion",
    "To what extent do you agree or disagree?",
    "State a clear degree of agreement and support it consistently.",
  ],
  [
    "discussion",
    "Discussion",
    "Discuss both views and give your own opinion.",
    "Explain both positions fairly and make your own view clear.",
  ],
  [
    "advantages",
    "Advantages and Disadvantages",
    "What are the advantages and disadvantages?",
    "Develop both benefits and drawbacks; answer any outweigh requirement explicitly.",
  ],
  [
    "problem",
    "Problem and Solution",
    "What problems does this cause and what solutions can you suggest?",
    "Link each practical solution to a stated problem.",
  ],
  [
    "two-part",
    "Two-part Questions",
    "Why is this happening? Is it a positive or negative development?",
    "Answer both questions and develop reasons for each judgement.",
  ],
];
for (const [id, name, wording, method] of essayRows)
  rows.push([
    `writing2-${id}`,
    "Writing",
    `${name} Essay · Task 2`,
    "Respond precisely to every instruction in an academic argument.",
    wording,
    method,
    "Using a memorised essay that answers a different question.",
    example(
      `Prompt: ${wording} Topic: online education.`,
      "What should a plan do?",
      method,
      "Underline the instruction verbs.",
      "List each requirement.",
      "Choose relevant supporting ideas before drafting.",
    ),
    example(
      "A body paragraph claims online courses improve access, then only lists software brands.",
      "How could the paragraph improve?",
      "Explain how flexible access helps a particular group and develop a relevant example.",
      "The current example does not explain access.",
      "Connect the evidence to the claim.",
    ),
  ]);
const speakingRows: [string, string, string, string][] = [
  [
    "part1",
    "Part 1: Answer → Reason → Detail",
    "Familiar topics such as study, home and hobbies.",
    "Give a direct answer, a genuine reason and one specific detail.",
  ],
  [
    "part2",
    "Part 2: Plan a Long Turn",
    "A cue card, one minute to prepare, and up to two minutes to speak.",
    "Use WHEN, WHERE, WHO, WHAT and WHY/FEELING as flexible note prompts.",
  ],
  [
    "part3",
    "Part 3: Develop an Opinion",
    "Broader discussion questions linked to the Part 2 theme.",
    "Try point, explanation, example and extension; consider another perspective.",
  ],
];
for (const [id, name, appearance, method] of speakingRows)
  rows.push([
    `speaking-${id}`,
    "Speaking",
    name,
    "Develop relevant, coherent spoken responses.",
    appearance,
    method,
    "Memorising an answer or using a particular accent as a score guarantee.",
    example(
      "Question: Do you enjoy reading?",
      "How could you develop a natural response?",
      "Yes, because reading helps me relax. I often read science articles after dinner.",
      "Answer the actual question.",
      "Give a reason, then a personal detail.",
      "Treat this as an illustration, not a script to memorise.",
    ),
    example(
      "Question: How might public transport change in the future?",
      "How could you qualify a prediction?",
      "Electric buses may become more common as cities try to reduce pollution, although cost could slow adoption.",
      "State a possibility.",
      "Explain a reason.",
      "Add a limitation rather than claiming certainty.",
    ),
  ]);
const strategyIds: Record<string, string> = {
  "listening-form": "L02",
  "listening-multiple-choice": "L03",
  "reading-tfng": "R01",
  "reading-headings": "R03",
  "reading-multiple-choice": "R05",
  "writing1-bar": "W01",
  "writing2-opinion": "W02",
  "speaking-part1": "S01",
};
export const patterns: Pattern[] = rows.map(
  ([id, skill, name, purpose, appearance, locate, trap, a, b], i) => ({
    id,
    skill: skill as Pattern["skill"],
    name,
    purpose,
    assesses:
      skill === "Writing"
        ? "Relevant task coverage, coherent organisation, lexical resource and grammatical control."
        : skill === "Speaking"
          ? "Relevant development, coherence and accurate spoken language; pronunciation requires audio evidence."
          : `${purpose} Meaning and relationships matter more than isolated repeated words.`,
    appearance,
    locate,
    wording: appearance,
    trap,
    beginner:
      skill === "Listening"
        ? "Answering before a correction or ignoring the printed instruction."
        : skill === "Reading"
          ? "Using outside knowledge instead of the passage, or matching a single word."
          : skill === "Writing"
            ? "Writing before analysing all task requirements."
            : "Giving an underdeveloped response or reciting a rehearsed script.",
    steps: [
      `Read the task: ${appearance}`,
      locate,
      "Check the complete meaning, instructions and relevant evidence.",
    ],
    timing:
      skill === "Listening"
        ? "Use the reading time to predict; continue with the recording if an answer is missed."
        : skill === "Reading"
          ? "Move on when stuck; 15/20/25 minutes across three passages is an adjustable practice heuristic, not an official rule."
          : skill === "Writing"
            ? "Task 1: about 20 minutes; Task 2: about 40 minutes. Reserve time to plan and check."
            : "Part 2: one minute of preparation, up to two minutes speaking. Develop ideas naturally in Parts 1 and 3.",
    advice:
      "For a 6.5 goal, prioritise accurate understanding and clear language. This technique cannot guarantee a score; review errors before increasing speed.",
    examples: [a, b].map((e, j) => ({
      ...e,
      ...(skill === "Listening"
        ? { audio: `/audio/strategy/example-${i}-${j}.wav` }
        : {}),
    })),
    strategyId: strategyIds[id] || `DEC-${id}`,
  }),
);
// Visuals are part of the source, not decorative approximations.
const pie = patterns.find((p) => p.id === "writing1-pie")!;
pie.examples = pie.examples.map((e, i) => ({
  ...e,
  source:
    "Household spending: housing 45% → 35%; food 30% → 25%; travel 25% → 40%.",
  question: i
    ? "Which details support the overview?"
    : "What is the main change in spending shares?",
  answer: i
    ? "Housing and food fell by 10 and 5 percentage points respectively, while travel rose by 15 points."
    : "Travel replaced housing as the largest spending category.",
  steps: [
    "Check that each period totals 100%.",
    "Compare the ranking and the size of each change.",
    "Report shares, not invented absolute spending totals.",
  ],
  visual: {
    kind: "pie",
    title: "Household spending shares (%)",
    rows: [
      { label: "Housing", before: 45, after: 35 },
      { label: "Food", before: 30, after: 25 },
      { label: "Travel", before: 25, after: 40 },
    ],
  },
}));
const plans = patterns.find((p) => p.id === "listening-map")!;
plans.examples[0].visual = {
  kind: "plan",
  title: "Learning centre plan (north at top)",
  rows: [],
  labels: ["Entrance", "Reception", "Café"],
};
plans.examples[1].visual = {
  kind: "plan",
  title: "Garden site plan (north at top)",
  rows: [],
  labels: ["Gate", "Pond", "", "Studio"],
};
const diagrams = patterns.find((p) => p.id === "listening-diagram")!;
diagrams.examples[0].visual = {
  kind: "diagram",
  title: "Water flow through the device",
  rows: [],
  labels: [
    "Upper pipe: water enters",
    "Container",
    "Lower outlet: water leaves",
  ],
};
diagrams.examples[1].visual = {
  kind: "diagram",
  title: "Device: vertical arrangement",
  rows: [],
  labels: ["Protective cover", "Sensor", "Display"],
};
const readingDiagram = patterns.find((p) => p.id === "reading-diagram")!;
readingDiagram.examples[0].visual = {
  kind: "diagram",
  title: "Filter assembly: vertical arrangement",
  rows: [],
  labels: ["Inlet", "Filter", "Pump"],
};
readingDiagram.examples[1].visual = {
  kind: "diagram",
  title: "Pipe outlet assembly",
  rows: [],
  labels: ["Pipe", "Valve at pipe end", "Controlled outflow"],
};
export const strategies: Strategy[] = patterns.map((p) => ({
  id: p.strategyId,
  name:
    p.id === "listening-form"
      ? "Detect corrections"
      : p.id === "listening-multiple-choice"
        ? "Recognise spoken paraphrases"
        : p.id === "reading-tfng"
          ? "Prove it, contradict it, or leave it open"
          : p.id === "reading-headings"
            ? "Read for paragraph purpose"
            : p.id === "reading-multiple-choice"
              ? "Eliminate unsupported answers"
              : p.id === "writing1-bar"
                ? "Build an accurate overview"
                : p.id === "writing2-opinion"
                  ? "Answer the whole essay task"
                  : p.id === "speaking-part1"
                    ? "Answer, reason, detail"
                    : p.name,
  skill: p.skill,
  category:
    p.skill === "Writing"
      ? "Writing Frameworks"
      : p.skill === "Speaking"
        ? "Speaking Frameworks"
        : `${p.skill} Shortcuts`,
  patternId: p.id,
  explanation: p.locate,
  when: p.appearance,
  limits: `${p.trap} The strategy narrows your reasoning; it does not replace understanding.`,
  steps: p.steps,
  tags: ["Foundation Skill", ...(p.skill === "Reading" ? ["Time Saver"] : [])],
  minutes: 15,
}));
for (const [id, skill, name, explanation] of [
  [
    "G01",
    "Grammar",
    "Find the head noun",
    "Locate the subject’s head noun, then check agreement, tense and clause boundaries.",
  ],
  [
    "V01",
    "Vocabulary",
    "Paraphrase the whole meaning",
    "Compare the whole proposition and its degree of certainty, not just a similar-looking word.",
  ],
] as const) {
  const p: Pattern = {
    id: skill === "Grammar" ? "grammar-accuracy" : "vocabulary-paraphrase",
    skill,
    name,
    purpose: explanation,
    assesses:
      "Accurate language reasoning, not a separate IELTS component band.",
    appearance: "A contextual sentence with language choices.",
    locate: explanation,
    wording: "Choose the accurate form or closest meaning.",
    trap: "Replacing a precise meaning with an exaggerated or grammatically incompatible alternative.",
    beginner: "Selecting a familiar form without checking the full sentence.",
    steps: [
      explanation,
      "Check context, qualifiers and grammar.",
      "Explain why each alternative fails.",
    ],
    timing: "Accuracy before speed. Use short reviews of 5–15 minutes.",
    advice:
      "Reliable sentence control and precise meaning support preparation; they do not guarantee a band.",
    examples:
      skill === "Grammar"
        ? [
            example(
              "The number of cyclists is rising.",
              "Why is “is” appropriate?",
              "Number is the singular head noun.",
              "Ignore the plural noun inside the of-phrase.",
              "Match the verb to number.",
            ),
            example(
              "If the service improves, more people will use it.",
              "What pattern is used?",
              "A realistic future conditional.",
              "Use present after if.",
              "Use will + base verb for the predicted result.",
            ),
          ]
        : [
            example(
              "Attendance rose sharply.",
              "What is a close paraphrase?",
              "The number of visitors increased rapidly.",
              "Attendance refers to visitor numbers.",
              "Rose sharply expresses increased rapidly.",
            ),
            example(
              "The study suggests a link.",
              "Does this prove a cause?",
              "No. A suggested association is weaker than causal proof.",
              "Retain the original level of certainty.",
              "Do not strengthen suggests into proves.",
            ),
          ],
    strategyId: id,
  };
  patterns.push(p);
  strategies.push({
    id,
    name,
    skill,
    patternId: p.id,
    category:
      skill === "Grammar"
        ? "Grammar Accuracy Techniques"
        : "Academic Vocabulary Techniques",
    explanation,
    when: p.appearance,
    limits: p.trap,
    steps: p.steps,
    tags: ["Foundation Skill"],
    minutes: 12,
  });
}
export const strategyNotes = [
  {
    id: "L01",
    name: "Predict the answer type",
    text: "In “contact the manager at ___”, context suggests a contact detail. It cannot determine which number or address is spoken. Predict grammar and information class, then verify the actual audio.",
  },
  {
    id: "L04",
    name: "Follow the sequence carefully",
    text: "Many Listening completion tasks follow the recording, but matching needs attention to names and categories. Treat sequence as a useful expectation, never an absolute guarantee.",
  },
  {
    id: "L05",
    name: "Recover after a missed answer",
    text: "Keep following the next question. Losing one detail should not cause several more missed answers. Return to spelling and limits during checking time.",
  },
  {
    id: "L06",
    name: "Respect the word limit",
    text: "NO MORE THAN TWO WORDS allows one or two words, not three. ONE WORD AND/OR A NUMBER allows the permitted word and number combination. Read the exact printed instruction; a correct fact with an invalid response can lose the mark.",
  },
  {
    id: "R02",
    name: "Map keywords to meaning",
    text: "“Attendance rose sharply” can express “the number of visitors increased rapidly”. Match the whole relationship, including who, when and how much; a shared word alone proves nothing.",
  },
  {
    id: "R04",
    name: "Scan, then read closely",
    text: "Scan for a name, year or distinctive concept to locate a candidate sentence. Then read the surrounding text closely. Skimming helps establish structure; it does not validate an answer.",
  },
  {
    id: "R06",
    name: "Budget your reading time",
    text: "15/20/25 minutes is one possible training allocation for three passages. Adjust to the form and your pace. IELTS supplies one 60-minute Reading limit, not a mandatory per-passage allocation.",
  },
];
