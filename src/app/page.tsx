'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center py-20">
      <div className="max-w-4xl mx-auto text-center px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Source Demo 2025
          </h1>
        </div>

        {/* Start Button */}
        <div 
          onClick={() => router.push('/pipeline')}
          className="mb-8 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 cursor-pointer border border-indigo-500/30 hover:border-indigo-400/50 p-8 group max-w-md mx-auto"
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center text-indigo-400 font-medium group-hover:text-indigo-300 text-xl">
              <span className="mr-3">Start</span>
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
