interface ProgressBarProps {
  pledged: number;
  received: number;
  required: number;
  showLabels?: boolean;
}

export function ProgressBar({ pledged, received, required, showLabels = true }: ProgressBarProps) {
  const pledgedPct = required > 0 ? Math.min(100, (pledged / required) * 100) : 0;
  const receivedPct = required > 0 ? Math.min(100, (received / required) * 100) : 0;
  const remaining = Math.max(0, required - received);
  const isComplete = received >= required && required > 0;

  return (
    <div className="w-full">
      <div className="relative h-9 w-full overflow-hidden rounded-xl bg-slate-200 shadow-inner dark:bg-navy-700">
        {/* Pledged layer (orange, behind) */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cta-300 to-cta-400 transition-all duration-700 ease-out"
          style={{ width: `${pledgedPct}%` }}
        >
          {pledgedPct > 0 && (
            <div className="h-full w-full bg-[length:16px_16px] bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%)]" />
          )}
        </div>
        {/* Received layer (green, on top) */}
        <div
          className="absolute inset-y-0 left-0 bg-success-500 transition-all duration-700 ease-out"
          style={{ width: `${receivedPct}%` }}
        >
          {receivedPct > 0 && (
            <div className="h-full w-full bg-[length:16px_16px] bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%)]" />
          )}
        </div>

        {/* Percentage badge centered on bar */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`rounded-md px-2.5 py-0.5 text-sm font-bold ${
              isComplete
                ? 'bg-success-600 text-white'
                : receivedPct > 15
                  ? 'text-white drop-shadow'
                  : pledgedPct > 15
                    ? 'text-navy-900 font-bold'
                    : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {Math.round(receivedPct)}% received
          </span>
        </div>
      </div>

      {showLabels && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-semibold text-success-800 dark:text-success-400">
              <span className="inline-block h-3.5 w-3.5 rounded-sm bg-success-500 shadow-sm" />
              {received} received
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-cta-800 dark:text-cta-400">
              <span className="inline-block h-3.5 w-3.5 rounded-sm bg-gradient-to-r from-cta-300 to-cta-400 shadow-sm" />
              {pledged} pledged
            </span>
          </div>
          <span
            className={`rounded-md px-2.5 py-0.5 text-sm font-bold ${
              isComplete
                ? 'bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-300'
                : remaining > 0
                  ? 'bg-cta-100 text-cta-800 dark:bg-cta-900/40 dark:text-cta-300'
                  : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {isComplete ? 'Fully received' : `${remaining} still needed`}
          </span>
        </div>
      )}
    </div>
  );
}
