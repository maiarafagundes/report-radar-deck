import { Professional } from '@/types/project';
import { X, Award, Brain, History, Star } from 'lucide-react';
import { getSeniorityColor } from '@/lib/projectUtils';

interface ProfessionalModalProps {
  professional: Professional | null;
  onClose: () => void;
}

const ProfessionalModal = ({ professional, onClose }: ProfessionalModalProps) => {
  if (!professional) return null;

  const initials = professional.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{professional.name}</h2>
              <p className="text-sm text-muted-foreground">{professional.role}</p>
              <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getSeniorityColor(professional.seniority)}`}>
                {professional.seniority}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Resumo / Soft Skills */}
        <div className="mb-5">
          <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-primary" /> Perfil & Soft Skills
          </h3>
          <p className="text-sm text-muted-foreground mb-3">{professional.resumo}</p>
          <div className="flex flex-wrap gap-1.5">
            {professional.softSkills.map(skill => (
              <span key={skill} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Certificações */}
        <div className="mb-5">
          <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-warning" /> Certificações
          </h3>
          <div className="space-y-1">
            {professional.certifications.map(cert => (
              <div key={cert} className="flex items-center gap-2 text-sm text-foreground">
                <Star className="h-3 w-3 text-warning shrink-0" />
                {cert}
              </div>
            ))}
            {professional.certifications.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma certificação cadastrada</p>
            )}
          </div>
        </div>

        {/* Histórico de Projetos */}
        <div>
          <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-primary" /> Histórico de Projetos
          </h3>
          <div className="space-y-2">
            {professional.projectHistory.map((ph, i) => (
              <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 ${ph.current ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50'}`}>
                <div>
                  <p className="text-sm font-medium text-foreground">{ph.projectName}</p>
                  <p className="text-xs text-muted-foreground">{ph.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{ph.period}</p>
                  {ph.current && <span className="text-[10px] font-bold text-primary">ATUAL</span>}
                </div>
              </div>
            ))}
            {professional.projectHistory.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum histórico cadastrado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalModal;
