'use client';

import SemanticLabeling, { SemanticRole } from '@/components/SemanticLabeling';

// Test data with varying sentence lengths and role configurations
const testCases: { sentence: string; roles: SemanticRole[] }[] = [
  // 1. Simple 3-role sentence
  {
    sentence: "Hamas fighters attacked Israel",
    roles: [
      { word: "Hamas fighters", role: "Agent" },
      { word: "attacked", role: "Action", isAction: true },
      { word: "Israel", role: "Patient" },
    ],
  },
  // 2. Short sentence with 2 roles
  {
    sentence: "The dog barked",
    roles: [
      { word: "The dog", role: "Agent" },
      { word: "barked", role: "Action", isAction: true },
    ],
  },
  // 3. 4-role sentence with location
  {
    sentence: "Scientists discovered water on Mars",
    roles: [
      { word: "Scientists", role: "Agent" },
      { word: "discovered", role: "Action", isAction: true },
      { word: "water", role: "Theme" },
      { word: "on Mars", role: "Location" },
    ],
  },
  // 4. 5-role sentence
  {
    sentence: "The CEO announced layoffs to employees yesterday",
    roles: [
      { word: "The CEO", role: "Agent" },
      { word: "announced", role: "Action", isAction: true },
      { word: "layoffs", role: "Theme" },
      { word: "to employees", role: "Recipient" },
      { word: "yesterday", role: "Time" },
    ],
  },
  // 5. Longer sentence with 3 roles
  {
    sentence: "The United Nations condemned the military intervention",
    roles: [
      { word: "The United Nations", role: "Agent" },
      { word: "condemned", role: "Action", isAction: true },
      { word: "the military intervention", role: "Theme" },
    ],
  },
  // 6. Passive-like construction
  {
    sentence: "The building was destroyed by the earthquake",
    roles: [
      { word: "The building", role: "Patient" },
      { word: "was destroyed", role: "Action", isAction: true },
      { word: "by the earthquake", role: "Cause" },
    ],
  },
  // 7. Communication verb with 4 roles
  {
    sentence: "The president told reporters about the deal",
    roles: [
      { word: "The president", role: "Agent" },
      { word: "told", role: "Action", isAction: true },
      { word: "reporters", role: "Recipient" },
      { word: "about the deal", role: "Topic" },
    ],
  },
  // 8. Movement verb
  {
    sentence: "Refugees fled from Syria to Turkey",
    roles: [
      { word: "Refugees", role: "Agent" },
      { word: "fled", role: "Action", isAction: true },
      { word: "from Syria", role: "Source" },
      { word: "to Turkey", role: "Goal" },
    ],
  },
  // 9. Longer complex sentence
  {
    sentence: "Local authorities evacuated residents before the storm",
    roles: [
      { word: "Local authorities", role: "Agent" },
      { word: "evacuated", role: "Action", isAction: true },
      { word: "residents", role: "Patient" },
      { word: "before the storm", role: "Time" },
    ],
  },
  // 10. Short with instrument
  {
    sentence: "She cut the paper with scissors",
    roles: [
      { word: "She", role: "Agent" },
      { word: "cut", role: "Action", isAction: true },
      { word: "the paper", role: "Patient" },
      { word: "with scissors", role: "Instrument" },
    ],
  },
];

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-4">
          Semantic Labeling Test Page
        </h1>
        <p className="text-slate-400 text-center mb-16">
          10 examples with varying sentence lengths and role configurations
        </p>

        <div className="space-y-24">
          {testCases.map((testCase, index) => (
            <div key={index} className="border-b border-slate-700/50 pb-16 last:border-b-0">
              <div className="text-slate-500 text-sm mb-8">
                Example {index + 1} — {testCase.roles.length} roles
              </div>
              <SemanticLabeling 
                sentence={testCase.sentence} 
                roles={testCase.roles} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

