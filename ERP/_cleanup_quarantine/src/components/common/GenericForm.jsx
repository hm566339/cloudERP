import React, { useState, useEffect } from 'react';
import CustomSelect from './CustomSelect';
import ComboBox from './ComboBox';

export default function GenericForm({
  fields = [], // Array of field configs
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  formError = '',
}) {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    let isValid = true;
    const newErrors = {};
    fields.forEach(field => {
      if (field.required && !formData[field.name] && formData[field.name] !== 0) {
        newErrors[field.name] = 'This field is required';
        isValid = false;
      }
      if (field.validate) {
        const error = field.validate(formData[field.name], formData);
        if (error) {
          newErrors[field.name] = error;
          isValid = false;
        }
      }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const renderField = (field) => {
    if (field.type === 'hidden') return null;

    if (field.render) {
        return (
          <div key={field.name} className={field.containerClassName || ''}>
            {field.render(formData[field.name], (val) => handleChange(field.name, val), formData, errors)}
            {errors[field.name] && <div className="text-[10px] text-red-500 mt-1">{errors[field.name]}</div>}
          </div>
        );
    }

    const commonProps = {
      id: field.name,
      name: field.name,
      value: formData[field.name] || '',
      onChange: (e) => handleChange(field.name, e.target ? e.target.value : e),
      disabled: field.disabled || isSubmitting,
      readOnly: field.readOnly,
      className: `input-field w-full h-9 text-xs ${errors[field.name] ? 'border-red-500 bg-red-50' : ''} ${field.className || ''}`,
      placeholder: field.placeholder || '',
    };

    let inputElement = null;

    switch (field.type) {
      case 'select':
        inputElement = (
          <CustomSelect {...commonProps}>
            <option value="">{field.placeholder || `Select ${field.label}`}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </CustomSelect>
        );
        break;
      case 'combobox':
        inputElement = (
          <ComboBox
             options={field.options}
             value={formData[field.name]}
             onChange={(val) => handleChange(field.name, val)}
             placeholder={field.placeholder || `Select ${field.label}`}
             disabled={field.disabled || isSubmitting}
             error={!!errors[field.name]}
             {...field.comboBoxProps}
          />
        );
        break;
      case 'textarea':
        inputElement = (
          <textarea
            {...commonProps}
            rows={field.rows || 3}
            className={`input-field w-full text-xs p-2 ${errors[field.name] ? 'border-red-500 bg-red-50' : ''} ${field.className || ''}`}
          />
        );
        break;
      case 'number':
        inputElement = (
          <input
            {...commonProps}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );
        break;
      default:
        inputElement = (
          <input
            {...commonProps}
            type={field.type || 'text'}
          />
        );
    }

    return (
      <div key={field.name} className={`flex flex-col gap-1.5 ${field.containerClassName || ''}`}>
        {field.label && (
          <label htmlFor={field.name} className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
            <span>{field.label} {field.required && <span className="text-red-500 ml-0.5">*</span>}</span>
          </label>
        )}
        {inputElement}
        {errors[field.name] && <span className="text-[10px] text-red-500">{errors[field.name]}</span>}
        {field.description && !errors[field.name] && <span className="text-[10px] text-zinc-500">{field.description}</span>}
      </div>
    );
  };

  // Group fields into sections if section property exists
  const sections = fields.reduce((acc, field) => {
    if (field.type === 'hidden') return acc;
    const sectionName = field.section || 'default';
    if (!acc[sectionName]) acc[sectionName] = [];
    acc[sectionName].push(field);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {formError}
        </div>
      )}

      {Object.entries(sections).map(([sectionName, sectionFields]) => (
        <div key={sectionName} className={sectionName !== 'default' ? "space-y-4" : ""}>
          {sectionName !== 'default' && (
            <h4 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-2">{sectionName}</h4>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            {sectionFields.map(field => renderField(field))}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 mt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-9 px-5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-9 px-5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
