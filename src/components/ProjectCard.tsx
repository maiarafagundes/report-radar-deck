import { Project } from '@/types/project';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';
import TeamList from './TeamList';
import { formatDate, getDaysRemaining, getProjectTimelinePercent } from '@/lib/projectUtils';
import { Calendar, Clock, Tag } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: (id: string) => void;
}

const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const timelinePercent = getProjectTimelinePercent(project.startDate, project.endDate);
  const daysRemaining = getDaysRemaining(project.endDate);

  return (
    <div
      onClick={() => onClick(project.id)}
      className="glass-card p-5 cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 animate-slide-in"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-primary uppercase tracking-wider">
              {project.category}
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground truncate">{project.name}</h3>
        </div>
        <StatusBadge status={project.status} size="sm" />
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

      <ProgressBar progress={project.progress} timelinePercent={timelinePercent} />

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(project.startDate)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {daysRemaining > 0 ? `${daysRemaining}d restantes` : 'Encerrado'}
          </span>
        </div>
        <TeamList team={project.team} compact />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            <Tag className="h-2.5 w-2.5" />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProjectCard;
