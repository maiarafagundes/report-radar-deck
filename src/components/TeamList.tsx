import { TeamMember } from '@/types/project';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

interface TeamListProps {
  team: TeamMember[];
  compact?: boolean;
  onMemberClick?: (name: string) => void;
  onUpdateAllocation?: (memberId: string, percent: number) => Promise<void> | void;
  onUpdateBillable?: (memberId: string, isBillable: boolean) => Promise<void> | void;
}

const TeamList = ({ team, compact = false, onMemberClick, onUpdateAllocation, onUpdateBillable }: TeamListProps) => {
  if (compact) {
    return (
      <div className="flex -space-x-2">
        {team.slice(0, 4).map((member) => (
          <div
            key={member.id}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-secondary text-xs font-semibold text-secondary-foreground cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            title={`${member.name} - ${member.role}`}
            onClick={(e) => { e.stopPropagation(); onMemberClick?.(member.name); }}
          >
            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
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
      {team.map((member) => {
        const alloc = member.allocationPercent ?? 100;
        const billable = member.isBillable !== false;
        return (
          <div
            key={member.id}
            className={`flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2 ${onMemberClick ? 'cursor-pointer hover:bg-secondary transition-colors' : ''}`}
            onClick={() => onMemberClick?.(member.name)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary shrink-0">
                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                <p className="text-xs text-muted-foreground truncate">{member.role || member.seniority}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Alocação</span>
                {onUpdateAllocation ? (
                  <>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={alloc}
                      onBlur={async (e) => {
                        const next = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                        if (next === alloc) return;
                        try {
                          await onUpdateAllocation(member.id, next);
                        } catch {
                          e.target.value = String(alloc);
                        }
                      }}
                      className="h-7 w-16 text-xs px-2"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </>
                ) : (
                  <span className="text-sm font-semibold text-foreground">{alloc}%</span>
                )}
              </div>

              {onUpdateBillable ? (
                <label className="inline-flex items-center gap-1.5 cursor-pointer" title={billable ? 'Faturável' : 'Não faturável'}>
                  <Checkbox
                    checked={billable}
                    onCheckedChange={(v) => {
                      onUpdateBillable(member.id, !!v);
                      if (!v) toast({ title: 'Marcado como não faturável' });
                    }}
                    className="h-4 w-4"
                  />
                  <span className="text-[11px] font-medium text-muted-foreground">Billing</span>
                </label>
              ) : (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${billable ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                  {billable ? 'Billing' : 'Sem billing'}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TeamList;
