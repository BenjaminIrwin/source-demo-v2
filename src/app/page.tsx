'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center py-20">
      <div className="max-w-4xl mx-auto text-center px-6">
        {/* Source Demo Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Source Demo
          </h1>
        </div>

        {/* Part of Speech Selection */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Claims */}
          <div 
            onClick={() => router.push('/graph')}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer border border-slate-700/50 hover:border-indigo-500/50 p-8 group"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-3">Claims</h2>
            </div>
            <div className="flex items-center justify-center text-indigo-400 font-medium group-hover:text-indigo-300">
              Explore Claims
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>

          {/* Adverbs - Disabled */}
          <div 
            className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-lg shadow-black/20 border border-slate-700/30 p-8 opacity-50 cursor-not-allowed"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-500 mb-3">Adverbs</h2>
            </div>
            <div className="flex items-center justify-center text-slate-600 font-medium">
              Explore Adverbs
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>

          {/* Nouns - Disabled */}
          <div 
            className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-lg shadow-black/20 border border-slate-700/30 p-8 opacity-50 cursor-not-allowed"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-500 mb-3">Nouns</h2>
            </div>
            <div className="flex items-center justify-center text-slate-600 font-medium">
              Explore Nouns
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>

          {/* Adjectives - Disabled */}
          <div 
            className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-lg shadow-black/20 border border-slate-700/30 p-8 opacity-50 cursor-not-allowed"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-500 mb-3">Adjectives</h2>
            </div>
            <div className="flex items-center justify-center text-slate-600 font-medium">
              Explore Adjectives
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-sm text-slate-400">
          Select a part of speech to explore lexical relationships and meanings
        </div>
      </div>
    </div>
  );
}
