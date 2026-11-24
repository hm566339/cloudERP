import React, { useState } from 'react';
import { Target, DollarSign, Calendar, User, MoreVertical, Plus, ChevronRight } from 'lucide-react';
import { StatusBadge } from '../../../components/common';

/**
 * Enterprise Opportunity Kanban Board component.
 * Allows visual pipeline tracking, stage totals, probability, and quick stage movements.
 */
export default function CrmKanbanBoard({
  stages = [],
  columns = [],
  opportunities = [],
  onStageChange,
  onCreateOpportunity,
  onOpportunityClick,
}) {
  const [draggingOppId, setDraggingOppId] = useState(null);

  const rawStages = (stages && stages.length > 0) ? stages : (columns || []);
  const normalizedStages = React.useMemo(() => {
    return rawStages.map((s) => ({
      ...s,
      id: s.id || s.stageId,
    }));
  }, [rawStages]);

  // Group opportunities by stageId
  const oppsByStage = React.useMemo(() => {
    const map = {};
    normalizedStages.forEach((s) => {
      map[s.id] = (s.deals && Array.isArray(s.deals)) ? [...s.deals] : [];
    });
    opportunities.forEach((opp) => {
      const stageId = opp.currentStageId || opp.stageId;
      if (map[stageId]) {
        if (!map[stageId].some(d => (d.id === opp.id))) {
          map[stageId].push(opp);
        }
      } else if (normalizedStages.length > 0) {
        // Fallback to first stage if unassigned
        map[normalizedStages[0].id].push(opp);
      }
    });
    return map;
  }, [normalizedStages, opportunities]);

  const handleDragStart = (e, oppId) => {
    e.dataTransfer.setData('text/plain', oppId);
    setDraggingOppId(oppId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStageId) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData('text/plain') || draggingOppId;
    setDraggingOppId(null);
    if (oppId && onStageChange) {
      onStageChange(oppId, targetStageId);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 hide-scrollbar min-h-[600px] select-none">
      {normalizedStages.map((stage) => {
        const stageOpps = oppsByStage[stage.id] || [];
        const totalValue = stageOpps.reduce((acc, curr) => acc + (Number(curr.dealValue) || 0), 0);

        return (
          <div
            key={stage.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
            className="flex flex-col w-80 shrink-0 bg-zinc-50/80 dark:bg-[#161922] rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D] overflow-hidden transition-colors"
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-zinc-200/70 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: stage.colorCode || '#4C8DFF' }}
                  />
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
                    {stage.stageName}
                  </h3>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-[#222736] text-zinc-600 dark:text-[#A0A6B5]">
                    {stageOpps.length}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-zinc-500 dark:text-[#6B7184] mt-1">
                  ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  <span className="ml-1 text-[10px] text-zinc-400">({stage.winProbabilityPct || 0}%)</span>
                </p>
              </div>

              {onCreateOpportunity && (
                <button
                  type="button"
                  onClick={() => onCreateOpportunity(stage.id)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors"
                  title="Add opportunity"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            {/* Column Cards */}
            <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] overscroll-contain">
              {stageOpps.length === 0 ? (
                <div className="h-28 border-2 border-dashed border-zinc-200 dark:border-[#2A2F3D] rounded-lg flex items-center justify-center text-[11px] text-zinc-400 dark:text-[#6B7184]">
                  Drop deals here
                </div>
              ) : (
                stageOpps.map((opp) => (
                  <div
                    key={opp.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, opp.id)}
                    onClick={() => onOpportunityClick && onOpportunityClick(opp)}
                    className="p-3 bg-white dark:bg-[#1D212C] rounded-lg border border-zinc-200/80 dark:border-[#2A2F3D] shadow-xs hover:shadow-md hover:border-zinc-300 dark:hover:border-[#3A4154] transition-all cursor-grab active:cursor-grabbing group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] line-clamp-1 group-hover:text-primary dark:group-hover:text-[#4C8DFF] transition-colors">
                        {opp.opportunityName || opp.title || 'Untitled Deal'}
                      </span>
                      {opp.dealStatus && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#222736] text-zinc-600 dark:text-[#A0A6B5]">
                          {opp.dealStatus}
                        </span>
                      )}
                    </div>

                    {(opp.accountName || opp.contactName) && (
                      <p className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-2 truncate">
                        {opp.accountName || opp.contactName}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100 dark:border-[#2A2F3D]/80">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{Number(opp.dealValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                      {opp.expectedCloseDate && (
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(opp.expectedCloseDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

