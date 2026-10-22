import React from 'react';
import DynamicFieldRenderer from './DynamicFieldRenderer';

export default function DynamicFormRenderer({
  formSchema,
  formData = {},
  onChange,
  errors = {},
  readOnly = false,
}) {
  if (!formSchema || !formSchema.groups || formSchema.groups.length === 0) {
    return (
      <div className="p-6 text-center text-zinc-400 text-xs">
        No dynamic form schema defined for this workflow.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {formSchema.groups.map((group) => {
        // Filter fields that pass conditional visibility
        const visibleFields = (group.fields || []).filter((field) => {
          if (!field.conditionalVisibility) return true;
          // Simple key == value expression evaluation (e.g. "billable == true")
          try {
            const parts = field.conditionalVisibility.split('==').map((p) => p.trim());
            if (parts.length === 2) {
              const targetField = parts[0];
              const expectedVal = parts[1].replace(/['"]/g, '');
              const actualVal = String(formData[targetField] ?? '');
              return actualVal === expectedVal;
            }
          } catch (e) {
            return true;
          }
          return true;
        });

        if (visibleFields.length === 0) return null;

        return (
          <div
            key={group.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm"
          >
            <div className="mb-4 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">
              <h3 className="text-sm font-bold text-zinc-900">{group.title}</h3>
              {group.description && (
                <p className="text-xs text-zinc-500 mt-0.5">{group.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleFields.map((field) => {
                const isFullWidth = field.type === 'textarea' || field.type === 'file';
                return (
                  <div
                    key={field.name}
                    className={isFullWidth ? 'sm:col-span-2 lg:col-span-3' : ''}
                  >
                    <DynamicFieldRenderer
                      field={field}
                      value={formData[field.name]}
                      onChange={onChange}
                      error={errors[field.name]}
                      readOnly={readOnly}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
