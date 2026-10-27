import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWork } from '../context/WorkContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CategorySummary } from '../types/models';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { CategoryPieChart } from '../components/dashboard/CategoryPieChart';
import { PieChart, Tag, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';

export const CategoriesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('bn') ? 'bn' : 'en';
  const { activeWork } = useWork();
  const { currentUser } = useAuth();

  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWork || !currentUser) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getDashboardData(activeWork.workId, currentUser);
        setCategories(data.categorySummaries || []);
      } catch (err: any) {
        toast.error(err.message || t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeWork?.workId]);

  const totalExpense = categories.reduce((sum, c) => sum + c.totalCost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('categories.title')}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{t('categories.subtitle')}</p>
      </div>

      {/* Grid: Visual Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CategoryPieChart categories={categories} />
        </div>

        <div className="lg:col-span-2">
          <div className="card-depth overflow-hidden">
            <div className="p-4 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">খাতভিত্তিক বিস্তারিত পরিসংখ্যান</span>
              <span className="text-xs font-black text-emerald-700">
                মোট: {formatCurrency(totalExpense, lang)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-slate-200 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    <th className="p-4">{t('categories.reason')}</th>
                    <th className="p-4 text-center">{t('categories.count')}</th>
                    <th className="p-4 text-right">{t('categories.percentage')}</th>
                    <th className="p-4 text-right">{t('categories.amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        {t('categories.noData')}
                      </td>
                    </tr>
                  ) : (
                    categories.map((c) => (
                      <tr key={c.reasonId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Tag size={14} className="text-emerald-600" />
                            <span>{lang === 'bn' && c.reasonNameBn ? c.reasonNameBn : c.reasonName}</span>
                          </div>
                        </td>

                        <td className="p-4 text-center text-slate-600 font-semibold">
                          {formatNumber(c.count, lang)} {lang === 'bn' ? 'টি' : 'entries'}
                        </td>

                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min(c.percentage, 100)}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-700">{formatNumber(c.percentage, lang)}%</span>
                          </div>
                        </td>

                        <td className="p-4 text-right font-black text-slate-900 text-sm">
                          {formatCurrency(c.totalCost, lang)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
