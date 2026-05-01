import React from 'react'

function PipelineRail({ activeStep, setActiveStep, steps }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 border border-slate-200 dark:border-border-hairline bg-white dark:bg-ink-surface font-sans transition-colors duration-200">
      {steps.map((step, idx) => {
        const isActive = activeStep === idx
        const isDone = step.status === 'done'
        const isProgress = step.status === 'active'
        
        return (
          <button
            key={idx}
            onClick={() => setActiveStep(idx)}
            className={`flex flex-col p-3 text-left border-b md:border-b-0 md:border-r border-slate-200 dark:border-border-hairline last:border-0 transition-colors duration-200 focus:outline-none relative ${
              isActive ? 'bg-slate-100 dark:bg-ink-hover' : 'hover:bg-slate-50 dark:hover:bg-ink-hover/50'
            }`}
          >
            {/* Active Amber Indicator Bar (Top of step button) */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent" />
            )}
            
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-1.5 h-1.5 rounded-full ${
                isDone ? 'bg-emerald-500' : isProgress ? 'bg-amber-500' : 'bg-slate-400 dark:bg-slate-600'
              }`} />
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                {`0${idx + 1}`}
              </span>
              <span className={`text-xs font-semibold uppercase tracking-wider ${
                isActive ? 'text-accent' : 'text-slate-700 dark:text-slate-300'
              }`}>
                {step.title}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pl-3.5 truncate">
              {step.summary || 'Idle'}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default PipelineRail
