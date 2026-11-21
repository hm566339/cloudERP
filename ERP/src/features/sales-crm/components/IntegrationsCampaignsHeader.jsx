import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Globe, Megaphone, PieChart } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { crmIntegrationsCampaignsTabs } from '../../../components/module-tabs';

export const INTEGRATIONS_CAMPAIGNS_TABS = crmIntegrationsCampaignsTabs;

export default function IntegrationsCampaignsHeader({
  activeTab,
  title,
  subtitle,
  description,
  actions,
  children,
}) {
  const location = useLocation();

  // Determine current active tab
  const resolvedTabKey = useMemo(() => {
    if (activeTab) return activeTab.toLowerCase();
    const path = (location.pathname || '').toLowerCase();
    if (path.includes('/campaigns')) return 'campaigns';
    if (path.includes('/attribution')) return 'attribution';
    return 'integrations';
  }, [activeTab, location.pathname]);

  const currentTabConfig = useMemo(() => {
    return (
      crmIntegrationsCampaignsTabs.find((t) => t.key === resolvedTabKey) ||
      crmIntegrationsCampaignsTabs[0]
    );
  }, [resolvedTabKey]);

  const defaultTitles = {
    integrations: {
      title: 'Marketplace & Webhook Integrations',
      desc: 'Automated 2-tier synchronized lead ingestion with strict RBAC',
      icon: Globe,
    },
    campaigns: {
      title: 'Marketing Campaigns & Spend',
      desc: 'Monitoring campaigns across digital, search, and marketplace channels',
      icon: Megaphone,
    },
    attribution: {
      title: 'Multi-Touch Revenue Attribution',
      desc: 'Algorithmic credit distribution across customer acquisition and sales touchpoints',
      icon: PieChart,
    },
  };

  const currentDefaults = defaultTitles[resolvedTabKey] || defaultTitles.integrations;
  const effectiveTitle = title || currentDefaults.title;
  const effectiveSubtitle = subtitle || description || currentDefaults.desc;
  const TabIcon = currentTabConfig.icon || currentDefaults.icon;

  const actionElements = actions || children;

  return (
    <>
      <PageHeader
        title={effectiveTitle}
        description={effectiveSubtitle}
        icon={TabIcon}
        actions={actionElements}
      />
      <ModuleTabs tabs={crmIntegrationsCampaignsTabs} activeTab={resolvedTabKey} />
    </>
  );
}

export function IntegrationsCampaignsLayout({
  activeTab,
  title,
  subtitle,
  description,
  actions,
  children,
}) {
  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117] overflow-hidden">
      <IntegrationsCampaignsHeader
        activeTab={activeTab}
        title={title}
        subtitle={subtitle}
        description={description}
        actions={actions}
      />
      <div className="flex-1 overflow-auto flex flex-col">{children}</div>
    </div>
  );
}
