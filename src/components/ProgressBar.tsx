import type { ProjectStatus } from '@/types/project';

interface ProgressBarProps {
  progress: number;
  timelinePercent: number;
  showLabels?: boolean;
  status?: ProjectStatus;
}

const ProgressBar = ({ progress, timelinePercent, showLabels = true, status }: ProgressBarProps) => {
  let barColor: string;
  if (status) {
    barColor =
      status === 'completed' ? 'bg-muted-foreground' :
      status === 'delayed' ? 'bg-danger' :
      status === 'at-risk' ? 'bg-warning' :
      'bg-success';
  } else {
    const isDelayed = timelinePercent > progress + 15;
    const isAtRisk = timelinePercent > progress + 5 && !isDelayed;
    barColor = isDelayed ? 'bg-danger' : isAtRisk ? 'bg-warning' : 'bg-success';
  }

  return (
    <div className="space-y-1.5">
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progresso: {progress}%</span>
          <span>Tempo: {timelinePercent}%</span>
        </div>
      )}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-foreground/40"
          style={{ left: `${timelinePercent}%` }}
          title={`Timeline: ${timelinePercent}%`}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
