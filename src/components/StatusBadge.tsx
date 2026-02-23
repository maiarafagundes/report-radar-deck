import { ProjectStatus } from '@/types/project';
import { getStatusLabel, getStatusClass } from '@/lib/projectUtils';

interface StatusBadgeProps {
  status: ProjectStatus;
  size?: 'sm' | 'md';
}

const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${getStatusClass(status)} ${sizeClasses}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        status === 'on-track' || status === 'completed' ? 'bg-success animate-pulse-slow' :
        status === 'delayed' ? 'bg-danger animate-pulse-slow' :
        'bg-warning animate-pulse-slow'
      }`} />
      {getStatusLabel(status)}
    </span>
  );
};

export default StatusBadge;
