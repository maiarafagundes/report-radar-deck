import { WeeklyReport } from '@/types/project';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface ProjectChartsProps {
  reports: WeeklyReport[];
}

const CHART_COLORS = [
  'hsl(213, 94%, 58%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(0, 72%, 51%)',
];

const ProjectCharts = ({ reports }: ProjectChartsProps) => {
  const sortedReports = [...reports].reverse();

  const taskData = sortedReports.map(r => ({
    week: r.weekStart.slice(5),
    concluídas: r.metrics.tasksCompleted,
    total: r.metrics.tasksTotal,
    pendentes: r.metrics.tasksTotal - r.metrics.tasksCompleted,
  }));

  const metricsData = sortedReports.map(r => ({
    week: r.weekStart.slice(5),
    deploys: r.metrics.deploymentsCount,
    incidentes: r.metrics.incidentsResolved,
    uptime: r.metrics.uptimePercent,
  }));

  const latestReport = reports[0];
  const pieData = latestReport ? [
    { name: 'Concluídas', value: latestReport.metrics.tasksCompleted },
    { name: 'Pendentes', value: latestReport.metrics.tasksTotal - latestReport.metrics.tasksCompleted },
  ] : [];

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: 'hsl(222, 44%, 8%)',
      border: '1px solid hsl(222, 30%, 16%)',
      borderRadius: '8px',
      fontSize: '12px',
      color: 'hsl(210, 40%, 96%)',
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Tasks por Semana</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={taskData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
            <XAxis dataKey="week" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="concluídas" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
            <Bar dataKey="pendentes" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Deploys & Incidentes</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={metricsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
            <XAxis dataKey="week" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="deploys" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="incidentes" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {latestReport && (
        <div className="glass-card p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Status Atual das Tasks</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {pieData.map((_, index) => (
                  <Cell key={index} fill={index === 0 ? CHART_COLORS[1] : CHART_COLORS[4]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Concluídas</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger" /> Pendentes</span>
          </div>
        </div>
      )}

      {latestReport && (
        <div className="glass-card p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Métricas Chave</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{latestReport.metrics.deploymentsCount}</p>
              <p className="text-xs text-muted-foreground">Deploys</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3 text-center">
              <p className="text-2xl font-bold text-success">{latestReport.metrics.uptimePercent}%</p>
              <p className="text-xs text-muted-foreground">Uptime</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3 text-center">
              <p className="text-2xl font-bold text-warning">{latestReport.metrics.incidentsResolved}</p>
              <p className="text-xs text-muted-foreground">Incidentes</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{latestReport.metrics.tasksCompleted}/{latestReport.metrics.tasksTotal}</p>
              <p className="text-xs text-muted-foreground">Tasks</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCharts;
