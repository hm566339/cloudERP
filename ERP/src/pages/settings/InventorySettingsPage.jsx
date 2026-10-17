import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Boxes,
  Warehouse,
  Ruler,
  Tags,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../features/notifications/notificationSlice';
import {
  SettingsLayout,
  SettingsPageHeader,
  SettingsCard,
  SettingsSelect,
  SettingsToggle,
  SettingsSaveButton,
} from '../../components/settings/shared';

export default function InventorySettingsPage() {
  const dispatch = useDispatch();
  const { companyId } = useParams();
  const prefix = companyId ? `/company/${companyId}` : '';

  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form state
  const [valuationMethod, setValuationMethod] = useState('FIFO');
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [enableBatchTracking, setEnableBatchTracking] = useState(true);
  const [enableSerialTracking, setEnableSerialTracking] = useState(true);
  const [autoReorderAlerts, setAutoReorderAlerts] = useState(true);
  const [defaultUom, setDefaultUom] = useState('PCS');

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSuccess(true);
      dispatch(
        addAlert({
          type: 'success',
          message: 'Inventory settings updated successfully',
        })
      );
      setTimeout(() => setIsSuccess(false), 2000);
    }, 600);
  };

  return (
    <SettingsLayout
      title="Inventory Module Settings"
      description="Configure valuation methods, stock tracking policies, warehouse rules, and default unit standards."
      badge="INVENTORY"
    >
      {/* ── Active Features & Direct Management Shortcuts ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Link
          to={`${prefix}/inventory/warehouses`}
          className="p-3.5 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Warehouse size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900">Warehouses</p>
              <p className="text-[10px] text-zinc-500">Manage locations & bins</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          to={`${prefix}/inventory/unit-of-measures`}
          className="p-3.5 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Ruler size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900">Units of Measure</p>
              <p className="text-[10px] text-zinc-500">Manage UOM conversions</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          to={`${prefix}/inventory/product-categories`}
          className="p-3.5 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Tags size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900">Categories</p>
              <p className="text-[10px] text-zinc-500">Product classifications</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* ── Valuation & Stock Tracking Rules ── */}
      <SettingsCard
        title="Stock Valuation & Calculation Rules"
        description="Set how your company computes inventory asset values on balance sheets."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsSelect
            id="valuation-method"
            label="Default Inventory Valuation Method"
            description="Algorithm used for cost of goods sold (COGS)."
            value={valuationMethod}
            onChange={(e) => setValuationMethod(e.target.value)}
            options={[
              { label: 'FIFO (First-In, First-Out)', value: 'FIFO' },
              { label: 'Moving Weighted Average', value: 'WEIGHTED_AVG' },
              { label: 'Standard Costing', value: 'STANDARD_COST' },
            ]}
          />
          <SettingsSelect
            id="default-uom"
            label="Default Base Unit of Measure"
            description="Fallback unit when none is selected on product creation."
            value={defaultUom}
            onChange={(e) => setDefaultUom(e.target.value)}
            options={[
              { label: 'PCS - Pieces', value: 'PCS' },
              { label: 'KGS - Kilograms', value: 'KGS' },
              { label: 'MTR - Meters', value: 'MTR' },
              { label: 'BOX - Box', value: 'BOX' },
              { label: 'NOS - Numbers', value: 'NOS' },
            ]}
          />
        </div>

        <div className="border-t border-zinc-100 my-4 pt-4 space-y-4">
          <SettingsToggle
            label="Allow Negative Stock"
            description="Permit invoice fulfillment even when on-hand stock count is zero or negative."
            checked={allowNegativeStock}
            onChange={setAllowNegativeStock}
          />
          <div className="border-t border-zinc-100 my-2"></div>
          <SettingsToggle
            label="Batch / Lot Tracking"
            description="Require batch numbers and manufacturing dates during stock receipt and delivery."
            checked={enableBatchTracking}
            onChange={setEnableBatchTracking}
          />
          <div className="border-t border-zinc-100 my-2"></div>
          <SettingsToggle
            label="Serial Number Tracking"
            description="Enable unique serial numbering for high-value traceable items."
            checked={enableSerialTracking}
            onChange={setEnableSerialTracking}
          />
          <div className="border-t border-zinc-100 my-2"></div>
          <SettingsToggle
            label="Low Stock Reorder Notifications"
            description="Send automated notifications to inventory managers when stock drops below minimum threshold."
            checked={autoReorderAlerts}
            onChange={setAutoReorderAlerts}
          />
        </div>
      </SettingsCard>

      <SettingsSaveButton onClick={handleSave} isSaving={isSaving} isSuccess={isSuccess} />
    </SettingsLayout>
  );
}
