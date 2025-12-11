'use client';

import { useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface PipelineStepperProps {
  currentStage: number;
  onStageChange: (stage: number) => void;
  stages: string[];
}

export default function PipelineStepper({ currentStage, onStageChange, stages }: PipelineStepperProps) {
  const totalStages = stages.length;
  const progress = ((currentStage + 1) / totalStages) * 100;

  const goToPrev = useCallback(() => {
    if (currentStage > 0) {
      onStageChange(currentStage - 1);
    }
  }, [currentStage, onStageChange]);

  const goToNext = useCallback(() => {
    if (currentStage < totalStages - 1) {
      onStageChange(currentStage + 1);
    }
  }, [currentStage, totalStages, onStageChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Stage labels */}
      <div className="flex justify-between mb-3">
        {stages.map((stage, index) => (
          <button
            key={stage}
            onClick={() => onStageChange(index)}
            className={`text-sm font-medium transition-colors duration-300 cursor-pointer ${
              index <= currentStage
                ? 'text-indigo-400'
                : 'text-slate-500'
            } ${index === currentStage ? 'scale-110' : ''}`}
          >
            {stage}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
        {/* Stage markers */}
        <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center px-0">
          {stages.map((_, index) => {
            const position = ((index + 1) / totalStages) * 100;
            return (
              <div
                key={index}
                className={`absolute w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                  index < currentStage
                    ? 'bg-indigo-400 border-indigo-400'
                    : index === currentStage
                    ? 'bg-indigo-500 border-white scale-125'
                    : 'bg-slate-700 border-slate-600'
                }`}
                style={{ left: `calc(${position}% - 6px)` }}
              />
            );
          })}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={goToPrev}
          disabled={currentStage === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 cursor-pointer ${
            currentStage === 0
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Previous
        </button>

        <span className="text-slate-400 text-sm">
          Stage {currentStage + 1} of {totalStages}
        </span>

        <button
          onClick={goToNext}
          disabled={currentStage === totalStages - 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 cursor-pointer ${
            currentStage === totalStages - 1
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Next
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
