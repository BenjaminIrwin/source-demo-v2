'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SemanticLabeling, { SemanticRole } from '@/components/SemanticLabeling';

interface TestCase {
  sentence: string;
  roles: SemanticRole[];
}

const testCases: TestCase[] = [
  {
    sentence: "Hamas militants attacked Israel",
    roles: [
      { word: "Hamas militants", role: "Agent" },
      { word: "attacked", role: "Action", isAction: true },
      { word: "Israel", role: "Patient" },
    ],
  },
  {
    sentence: "The protesters marched",
    roles: [
      { word: "The protesters", role: "Agent" },
      { word: "marched", role: "Action", isAction: true },
    ],
  },
  {
    sentence: "The government officials secretly transferred funds to offshore accounts",
    roles: [
      { word: "The government officials", role: "Agent" },
      { word: "secretly", role: "Manner" },
      { word: "transferred", role: "Action", isAction: true },
      { word: "funds", role: "Theme" },
      { word: "to offshore accounts", role: "Destination" },
    ],
  },
  {
    sentence: "Russian hackers allegedly compromised election systems in multiple states during 2020",
    roles: [
      { word: "Russian hackers", role: "Agent" },
      { word: "allegedly", role: "Evidentiality" },
      { word: "compromised", role: "Action", isAction: true },
      { word: "election systems", role: "Patient" },
      { word: "in multiple states", role: "Location" },
      { word: "during 2020", role: "Time" },
    ],
  },
  {
    sentence: "The CEO gave employees bonuses for their performance",
    roles: [
      { word: "The CEO", role: "Agent" },
      { word: "gave", role: "Action", isAction: true },
      { word: "employees", role: "Recipient" },
      { word: "bonuses", role: "Theme" },
      { word: "for their performance", role: "Reason" },
    ],
  },
  {
    sentence: "Scientists discovered a new species in the Amazon rainforest last year using advanced DNA techniques",
    roles: [
      { word: "Scientists", role: "Agent" },
      { word: "discovered", role: "Action", isAction: true },
      { word: "a new species", role: "Theme" },
      { word: "in the Amazon rainforest", role: "Location" },
      { word: "last year", role: "Time" },
      { word: "using advanced DNA techniques", role: "Instrument" },
    ],
  },
];

export default function ClaimDetailPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentCase = testCases[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? testCases.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === testCases.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col">
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <button
          onClick={() => router.push('/graph')}
          className="text-slate-400 hover:text-white transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Back to Claims
        </button>

        {/* Test Case Navigator */}
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevious}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Previous
          </button>
          <span className="text-slate-400">
            Test {currentIndex + 1} of {testCases.length}
            <span className="text-slate-500 ml-2">({currentCase.roles.length} roles)</span>
          </span>
          <button
            onClick={goToNext}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="max-w-5xl w-full">
          <SemanticLabeling 
            key={currentIndex} 
            sentence={currentCase.sentence} 
            roles={currentCase.roles} 
          />
        </div>
      </div>
    </div>
  );
}
