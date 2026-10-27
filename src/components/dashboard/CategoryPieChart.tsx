import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategorySummary } from '../../types/models';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { PieChart as ChartIcon } from 'lucide-react';

interface CategoryPieChartProps {
  categories: CategorySummary[];
}

const COLORS = [
  '#10B981', // Emerald
  '#0EA5E9', // Sky
  '#F59E0B', // Amber
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#8B5CF6', // Purple
  '#F97316', // Orange
];

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ categories }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('bn') ? 'bn' : 'en';

  if (!categories || categories.length === 0) {
    return (
      <div className="card-depth p-6 flex flex-col items-center justify-center min-h-[300px] text-center text-slate-400">
        <ChartIcon size={36} className="text-slate-300 mb-2" />
        <p className="text-xs">{t('categories.noData')}</p>
      </div>
    );
  }

  const chartData = categories.slice(0, 6).map((c) => ({
    name: lang === 'bn' && c.reasonNameBn ? c.reasonNameBn : c.reasonName,
    value: c.totalCost,
    percentage: c.percentage,
  }));

  return (
    <div className="card-depth p-5 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-2">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <ChartIcon size={16} className="text-emerald-600" />
          <span>{t('categories.chartTitle')}</span>
        </h3>
        <span className="text-[11px] font-semibold text-slate-400">
          {categories.length} {lang === 'bn' ? 'টি খাত' : 'categories'}
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [formatCurrency(Number(value), lang), 'খরচ']}
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#FFFFFF',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Items */}
      <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-slate-100 text-[11px]">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5 truncate">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <span className="truncate text-slate-700 font-medium">{item.name}:</span>
            <span className="font-bold text-slate-900 shrink-0">{formatNumber(item.percentage, lang)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
