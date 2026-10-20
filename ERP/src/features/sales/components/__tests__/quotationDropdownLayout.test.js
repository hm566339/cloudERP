import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const customSelectPath = path.resolve(__dirname, '../../../../components/common/CustomSelect.jsx');
const quotationModalPath = path.resolve(__dirname, '../QuotationFormModal.jsx');
const deliveryAddressPath = path.resolve(__dirname, '../../../../components/erp/TransactionForm/fields/DeliveryAddressField.jsx');
const customerComboboxPath = path.resolve(__dirname, '../CustomerCombobox.jsx');
const transactionFormFieldPath = path.resolve(__dirname, '../../../../components/erp/TransactionForm/TransactionFormField.jsx');

describe('Quotation Form UI & Dropdown Layout Root-Cause Verification', () => {
  const customSelectCode = fs.readFileSync(customSelectPath, 'utf-8');
  const quotationModalCode = fs.readFileSync(quotationModalPath, 'utf-8');
  const deliveryAddressCode = fs.readFileSync(deliveryAddressPath, 'utf-8');
  const customerComboboxCode = fs.readFileSync(customerComboboxPath, 'utf-8');
  const formFieldCode = fs.readFileSync(transactionFormFieldPath, 'utf-8');

  describe('1. CustomSelect Root Cause Defense & Class Segregation', () => {
    it('segregates wrapper classes from button control classes to prevent double borders', () => {
      assert.ok(
        customSelectCode.includes('wrapperClass') && customSelectCode.includes('resolvedButtonClass'),
        'CustomSelect must separate wrapperClass and resolvedButtonClass'
      );
      assert.ok(
        customSelectCode.includes('input-field') && customSelectCode.includes('controlPattern'),
        'CustomSelect must exclude input-field and control styles from container wrapper'
      );
    });

    it('ensures wrapper div only receives layout classes and not input borders or padding', () => {
      assert.ok(
        customSelectCode.includes('<div className={`relative ${wrapperClass}`}'),
        'Outer wrapper div must use segregated wrapperClass without input-field or border'
      );
    });

    it('maintains enterprise portal and keyboard accessibility standards', () => {
      assert.ok(customSelectCode.includes('createPortal('), 'Maintains createPortal');
      assert.ok(customSelectCode.includes('zIndex: 99999'), 'Maintains high zIndex');
      assert.ok(customSelectCode.includes('type="button"'), 'Button trigger must have type="button"');
    });
  });

  describe('2. Customer Details Section Consistency', () => {
    it('CustomerCombobox uses harmonized h-8 height and rounded-md border', () => {
      assert.ok(
        customerComboboxCode.includes('h-8') && customerComboboxCode.includes('rounded-md') && customerComboboxCode.includes('text-[10px]'),
        'CustomerCombobox must match standard h-8 height, rounded-md, and text-[10px]'
      );
      assert.doesNotMatch(customerComboboxCode, /h-9.*rounded-lg.*text-\[10\.4px\]/, 'Should not have oversized h-9/rounded-lg trigger');
    });

    it('DeliveryAddressField passes clean w-full container and explicit buttonClassName to CustomSelect', () => {
      assert.ok(
        deliveryAddressCode.includes('className="w-full"') && deliveryAddressCode.includes('buttonClassName="w-full h-8 px-2.5 border border-zinc-200 rounded-md'),
        'DeliveryAddressField must pass className="w-full" and buttonClassName for consistent single-border styling'
      );
    });

    it('Place of Supply CustomSelect uses clean w-full and buttonClassName with h-8 and rounded-md', () => {
      assert.ok(
        quotationModalCode.includes('key: \'placeOfSupplyStateId\'') &&
        quotationModalCode.includes('buttonClassName="w-full h-8 px-2.5 border border-zinc-200 rounded-md bg-white text-[10px]'),
        'Place of Supply in QuotationFormModal must use clean buttonClassName with h-8 and rounded-md'
      );
    });
  });

  describe('3. Quotation Terms & Notes/Conditions Consistency', () => {
    it('selectField helper in QuotationFormModal explicitly renders field labels for Terms dropdowns', () => {
      assert.ok(
        quotationModalCode.includes('{field.label && (') &&
        quotationModalCode.includes('text-[8.5px] font-semibold text-zinc-700') &&
        quotationModalCode.includes('{field.label}'),
        'selectField must render consistent field labels for Payment, Delivery, and Warranty terms'
      );
    });

    it('selectField helper uses clean w-full container and h-8 rounded-md buttonClassName', () => {
      assert.ok(
        quotationModalCode.includes('buttonClassName="w-full h-8 px-2.5 border border-zinc-200 rounded-md bg-white text-[10px] text-zinc-800 flex items-center justify-between'),
        'selectField CustomSelect must use consistent h-8 rounded-md buttonClassName'
      );
    });
  });

  describe('4. Right-side Items Section Product Dropdown', () => {
    it('QuotationLineItemRow Product CustomSelect matches table column dimensions and alignment', () => {
      assert.ok(
        quotationModalCode.includes('className="w-full min-w-0"') &&
        quotationModalCode.includes('buttonClassName="w-full h-8 px-2 border border-zinc-200 rounded-md bg-white text-[8.8px]'),
        'Product CustomSelect in QuotationLineItemRow must use clean container and explicit buttonClassName matching sibling inputs'
      );
    });
  });

  describe('5. Shared TransactionFormField CustomSelect Integration', () => {
    it('TransactionFormField passes className="w-full" and buttonClassName to CustomSelect for select and searchable-select', () => {
      assert.ok(
        formFieldCode.includes('field.type === \'select\' ? <CustomSelect {...common} className="w-full" buttonClassName={`${inputClass} flex items-center justify-between`}') &&
        formFieldCode.includes('field.type === \'searchable-select\' ? <CustomSelect {...common} className="w-full" buttonClassName={`${inputClass} flex items-center justify-between`}'),
        'TransactionFormField must cleanly separate container and buttonClassName for CustomSelect'
      );
    });
  });
});
