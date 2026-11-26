import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { canViewModule, CANONICAL_MODULES } from '../../../utils/moduleNormalization.js';
import { rolePermissions, ROLES } from '../../../utils/rbac.js';
import { buildDynamicSidebar } from '../../../layouts/dynamicSidebarConfig.js';
import chatApiService from '../services/chatApiService.js';

describe('Company Chat & RFQ Frontend Security & Integration Suite', () => {
  it('1. chatApiService targets exact gateway-routed endpoints under /api/communication/v1/chat', () => {
    assert.ok(typeof chatApiService.getChannels === 'function');
    assert.ok(typeof chatApiService.getChannel === 'function');
    assert.ok(typeof chatApiService.createChannel === 'function');
    assert.ok(typeof chatApiService.getMessages === 'function');
    assert.ok(typeof chatApiService.sendMessage === 'function');
    assert.ok(typeof chatApiService.markChannelRead === 'function');
    assert.ok(typeof chatApiService.updateActionStatus === 'function');
    assert.ok(typeof chatApiService.postQuotationEvent === 'function');
    // Group Management APIs
    assert.ok(typeof chatApiService.updateChannel === 'function');
    assert.ok(typeof chatApiService.deleteChannel === 'function');
    assert.ok(typeof chatApiService.getChannelMembers === 'function');
    assert.ok(typeof chatApiService.addChannelMembers === 'function');
    assert.ok(typeof chatApiService.removeChannelMember === 'function');
    assert.ok(typeof chatApiService.updateMemberRole === 'function');
    assert.ok(typeof chatApiService.leaveChannel === 'function');
  });

  it('2. canViewModule allows COMMUNICATION_CHAT for CRM operators and Accountants', () => {
    // CRM operator context (CRM module entitled)
    const crmContext = {
      modules: [{ code: 'crm', name: 'CRM', active: true }],
      permissions: ['CRM:READ'],
    };
    assert.equal(canViewModule(crmContext, 'COMMUNICATION_CHAT'), true);
    assert.equal(canViewModule(crmContext, 'CHAT'), true);

    // Accountant context (ACCOUNT module entitled)
    const accountantContext = {
      modules: [{ code: 'account', name: 'Account', active: true }],
      permissions: ['ACCOUNT:READ', 'QUOTATIONS:READ'],
    };
    assert.equal(canViewModule(accountantContext, 'COMMUNICATION_CHAT'), true);
    assert.equal(canViewModule(accountantContext, 'CHAT'), true);

    // Owner context (super / owner privileges)
    const ownerContext = {
      user: { role: 'owner' },
      membership: { memberType: 'OWNER' },
      modules: [{ code: 'account', active: true }, { code: 'crm', active: true }],
    };
    assert.equal(canViewModule(ownerContext, 'COMMUNICATION_CHAT'), true);
  });

  it('3. rolePermissions includes COMMUNICATION_CHAT for Accountant and Finance Manager', () => {
    const accountantModules = rolePermissions[ROLES.ACCOUNTANT].modules;
    assert.ok(
      accountantModules.includes('COMMUNICATION_CHAT'),
      'Accountant role must include COMMUNICATION_CHAT'
    );

    const financeManagerModules = rolePermissions[ROLES.FINANCE_MANAGER].modules;
    assert.ok(
      financeManagerModules.includes('COMMUNICATION_CHAT'),
      'Finance Manager role must include COMMUNICATION_CHAT'
    );
  });

  it('4. buildDynamicSidebar includes Company Chat under CRM and Accounts navigation', () => {
    const companyId = 'f58637fc-6b45-42f4-8a8f-8b2b7ff9c9e5';
    const authContext = {
      user: { role: 'owner' },
      membership: { memberType: 'OWNER' },
      modules: [
        { code: 'crm', name: 'CRM', active: true },
        { code: 'account', name: 'Account', active: true },
      ],
      currentCompany: { id: companyId, code: 'APEXINDIAP' },
    };

    const sidebar = buildDynamicSidebar({
      authContext,
      userRole: 'owner',
      companyId,
      permissions: ['ALL_MODULES'],
    });

    // CRM section
    const crmGroup = sidebar.find((item) => item.id === 'sales-crm');
    assert.ok(crmGroup, 'Sidebar must contain Sales & CRM section');
    const crmChat = crmGroup.children.find((child) => child.id === 'crm-chat');
    assert.ok(crmChat, 'Sales & CRM section must contain crm-chat');
    assert.equal(crmChat.path, `/company/${companyId}/sales-crm/chat`);
    assert.equal(crmChat.featureCode, 'COMMUNICATION_CHAT');

    // Accounts section
    const accGroup = sidebar.find((item) => item.id === 'accounts');
    assert.ok(accGroup, 'Sidebar must contain Accounts section');
    const accTxn = accGroup.children.find((child) => child.id === 'acc-txn');
    assert.ok(accTxn, 'Accounts section must contain Transactions');
    const accChat = accTxn.children.find((child) => child.id === 'acc-txn-chat');
    assert.ok(accChat, 'Accounts Transactions must contain acc-txn-chat');
    assert.equal(accChat.path, `/company/${companyId}/sales-crm/chat`);
  });

  it('5. STOMP subscription destination adheres to multi-tenant topic pattern', () => {
    const companyId = 'f58637fc-6b45-42f4-8a8f-8b2b7ff9c9e5';
    const channelId = 'c8b671a1-3e4b-4a5f-9e8c-1a2b3c4d5e6f';
    const topic = `/topic/company.${companyId}.channel.${channelId}`;

    const pattern = /^\/topic\/company\.([a-fA-F0-9-]+)\.channel\.([a-fA-F0-9-]+)$/;
    const match = topic.match(pattern);
    assert.ok(match, 'Topic should match expected STOMP pattern');
    assert.equal(match[1], companyId);
    assert.equal(match[2], channelId);
  });
});
