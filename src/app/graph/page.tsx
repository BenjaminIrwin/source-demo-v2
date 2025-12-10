'use client';

import { useRouter } from 'next/navigation';

const claims = [
  {
    id: 1,
    text: "Hamas fighters attacked Israel",
    enabled: true,
    href: "/graph/claim/1"
  },
  {
    id: 2,
    text: "Militants fired missiles from the Gaza Strip over Southern Israel to Tel Aviv",
    enabled: false,
    href: "/graph/claim/2"
  },
  {
    id: 3,
    text: "An Egyptian official said \"We have warned them an explosion of the situation is coming, and very soon, and it would be big. But they underestimated such warnings\"",
    enabled: false,
    href: "/graph/claim/3"
  },
  {
    id: 4,
    text: "Benjamin Netanyahu denied that Israel had received prior warning of the October 7th attacks",
    enabled: false,
    href: "/graph/claim/4"
  },
  {
    id: 5,
    text: "Hamas announced the start of Operation Al-Aqsa Flood",
    enabled: false,
    href: "/graph/claim/5"
  },
  {
    id: 6,
    text: "Ten civilians were killed in Kibbutz Kissufim",
    enabled: false,
    href: "/graph/claim/6"
  },
  {
    id: 7,
    text: "Barak Hiram authorized his tank unit to shell an Israeli home",
    enabled: false,
    href: "/graph/claim/7"
  },
];

export default function ClaimsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center py-20">
      <div className="max-w-6xl mx-auto text-center px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Claims
          </h1>
          <p className="text-slate-400 text-lg">
            Select a claim to explore its sources and evidence
          </p>
        </div>

        {/* Claims Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {claims.map((claim) => (
            <div
              key={claim.id}
              onClick={() => claim.enabled && router.push(claim.href)}
              className={`
                backdrop-blur-sm rounded-2xl shadow-lg shadow-black/20 border p-6 flex flex-col justify-between min-h-[200px]
                ${claim.enabled 
                  ? 'bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer group' 
                  : 'bg-slate-800/30 border-slate-700/30 opacity-50 cursor-not-allowed'
                }
              `}
            >
              <div className="mb-4">
                <p className={`text-left text-base leading-relaxed ${claim.enabled ? 'text-white' : 'text-slate-500'}`}>
                  {claim.text}
                </p>
              </div>
              <div className={`flex items-center font-medium ${claim.enabled ? 'text-indigo-400 group-hover:text-indigo-300' : 'text-slate-600'}`}>
                Explore
                <svg className={`w-5 h-5 ml-2 ${claim.enabled ? 'group-hover:translate-x-1 transition-transform' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-12">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-white transition-colors flex items-center justify-center mx-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

