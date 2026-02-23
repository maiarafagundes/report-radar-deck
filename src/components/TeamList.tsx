import { TeamMember } from '@/types/project';
import { getSeniorityColor } from '@/lib/projectUtils';

interface TeamListProps {
  team: TeamMember[];
  compact?: boolean;
}

const TeamList = ({ team, compact = false }: TeamListProps) => {
  if (compact) {
    return (
      <div className="flex -space-x-2">
        {team.slice(0, 4).map((member) => (
          <div
            key={member.id}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-secondary text-xs font-semibold text-secondary-foreground"
            title={`${member.name} - ${member.role}`}
          >
            {member.name.split(' ').map(n => n[0]).join('')}
          </div>
        ))}
        {team.length > 4 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium text-muted-foreground">
            +{team.length - 4}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {team.map((member) => (
        <div key={member.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
              {member.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{member.name}</p>
              <p className="text-xs text-muted-foreground">{member.role}</p>
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getSeniorityColor(member.seniority)}`}>
            {member.seniority}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TeamList;
