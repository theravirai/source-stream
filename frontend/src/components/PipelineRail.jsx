import React from 'react'
import { CheckCircle2, Lock, ArrowRightCircle, CircleDashed } from 'lucide-react'

function PipelineRail({ activeStep, setActiveStep, steps, earliestIncompleteStep }) {
  return (
    <div role="tablist" className="grid grid-cols-1 md:grid-cols-4 border border-slate-200 dark:border-border-hairline bg-white dark:bg-ink-surface font-sans transition-colors duration-200">
      {steps.map((step, idx) => {
        const isActive = activeStep === idx
        const isDone = step.status === 'done'
        const isLocked = idx > earliestIncompleteStep
        const isNext = idx === earliestIncompleteStep && !isActive

        let Icon = CircleDashed
        let iconColor = "text-slate-400 dark:text-slate-600"
        let animate = ""

        if (isLocked) {
          Icon = Lock
          iconColor = "text-slate-300 dark:text-slate-600"
        } else if (isActive) {
          Icon = ArrowRightCircle
          iconColor = "text-accent"
        } else if (isDone) {
          Icon = CheckCircle2
          iconColor = "text-emerald-500"
        } else if (isNext) {
          Icon = ArrowRightCircle
          iconColor = "text-amber-500"
        }
        
        return (
          <button
            key={idx}
            role="tab"
            aria-selected={isActive}
            aria-controls={`step-panel-${idx}`}
            onClick={() => setActiveStep(idx)}
            disabled={isLocked}
            className={`flex flex-col p-3 text-left border-b md:border-b-0 md:border-r border-slate-200 dark:border-border-hairline last:border-0 transition-colors duration-200 focus:outline-none relative ${
              isActive ? 'bg-slate-100 dark:bg-ink-hover' : isLocked ? 'bg-slate-50/50 dark:bg-ink-bg cursor-not-allowed opacity-60' : 'hover:bg-slate-50 dark:hover:bg-ink-hover/50 cursor-pointer'
            }`}
          >
            {/* Active Amber Indicator Bar (Top of step button) */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent" />
            )}
            
            <div className="flex items-center gap-2 mb-1">
              <div className="relative flex items-center justify-center">
                {isNext && (
                  <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-75" />
                )}
                <Icon size={14} className={`${iconColor} relative z-10`} />
              </div>
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
