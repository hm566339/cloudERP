package com.erp.crm.modules.automation.service;

import com.erp.crm.common.exception.ResourceNotFoundException;
import com.erp.crm.modules.automation.entity.CrmRoundRobinMember;
import com.erp.crm.modules.automation.entity.CrmRoundRobinPool;
import com.erp.crm.modules.automation.enums.RoundRobinStrategy;
import com.erp.crm.modules.automation.repository.CrmRoundRobinMemberRepository;
import com.erp.crm.modules.automation.repository.CrmRoundRobinPoolRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoundRobinAssignmentServiceTest {

    @Mock
    private CrmRoundRobinPoolRepository poolRepository;

    @Mock
    private CrmRoundRobinMemberRepository memberRepository;

    @InjectMocks
    private RoundRobinAssignmentService roundRobinAssignmentService;

    @Test
    @DisplayName("Should select least recently assigned member in standard ROUND_ROBIN")
    void testStandardRoundRobinDistribution() {
        UUID companyId = UUID.randomUUID();
        UUID poolId = UUID.randomUUID();
        UUID user1 = UUID.randomUUID();
        UUID user2 = UUID.randomUUID();

        CrmRoundRobinPool pool = CrmRoundRobinPool.builder()
                .id(poolId)
                .poolCode("PUNE_SALES")
                .routingStrategy(RoundRobinStrategy.ROUND_ROBIN)
                .isActive(true)
                .build();
        pool.setCompanyId(companyId);

        CrmRoundRobinMember m1 = CrmRoundRobinMember.builder()
                .id(UUID.randomUUID())
                .poolId(poolId)
                .userId(user1)
                .currentLeadsToday(5)
                .lastAssignedAt(LocalDateTime.now().minusMinutes(10))
                .maxDailyLeads(50)
                .isActive(true)
                .build();

        CrmRoundRobinMember m2 = CrmRoundRobinMember.builder()
                .id(UUID.randomUUID())
                .poolId(poolId)
                .userId(user2)
                .currentLeadsToday(3)
                .lastAssignedAt(LocalDateTime.now().minusMinutes(30)) // Older -> should be picked
                .maxDailyLeads(50)
                .isActive(true)
                .build();

        when(poolRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, poolId)).thenReturn(Optional.of(pool));
        when(memberRepository.findByCompanyIdAndPoolIdAndIsActiveTrueAndIsDeletedFalse(companyId, poolId))
                .thenReturn(List.of(m1, m2));
        when(memberRepository.save(any(CrmRoundRobinMember.class))).thenAnswer(i -> i.getArgument(0));

        Optional<UUID> assignee = roundRobinAssignmentService.getNextAssignee(companyId, poolId);

        assertTrue(assignee.isPresent());
        assertEquals(user2, assignee.get());
        assertEquals(4, m2.getCurrentLeadsToday());
        verify(memberRepository).save(m2);
    }

    @Test
    @DisplayName("Should select member with lowest current-to-weight ratio in WEIGHTED_CAPACITY")
    void testWeightedCapacityDistribution() {
        UUID companyId = UUID.randomUUID();
        UUID poolId = UUID.randomUUID();
        UUID userSenior = UUID.randomUUID();
        UUID userJunior = UUID.randomUUID();

        CrmRoundRobinPool pool = CrmRoundRobinPool.builder()
                .id(poolId)
                .poolCode("DIRECT_SALES")
                .routingStrategy(RoundRobinStrategy.WEIGHTED_CAPACITY)
                .isActive(true)
                .build();

        // Senior: weight 3, current 6 leads -> ratio 2.0
        CrmRoundRobinMember senior = CrmRoundRobinMember.builder()
                .id(UUID.randomUUID())
                .poolId(poolId)
                .userId(userSenior)
                .weight(3)
                .currentLeadsToday(6)
                .maxDailyLeads(100)
                .isActive(true)
                .build();

        // Junior: weight 1, current 3 leads -> ratio 3.0 (higher load)
        CrmRoundRobinMember junior = CrmRoundRobinMember.builder()
                .id(UUID.randomUUID())
                .poolId(poolId)
                .userId(userJunior)
                .weight(1)
                .currentLeadsToday(3)
                .maxDailyLeads(50)
                .isActive(true)
                .build();

        when(poolRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, poolId)).thenReturn(Optional.of(pool));
        when(memberRepository.findByCompanyIdAndPoolIdAndIsActiveTrueAndIsDeletedFalse(companyId, poolId))
                .thenReturn(List.of(senior, junior));
        when(memberRepository.save(any(CrmRoundRobinMember.class))).thenAnswer(i -> i.getArgument(0));

        Optional<UUID> assignee = roundRobinAssignmentService.getNextAssignee(companyId, poolId);

        assertTrue(assignee.isPresent());
        assertEquals(userSenior, assignee.get(), "Senior with weight 3 and ratio 2.0 should be chosen over junior with ratio 3.0");
    }

    @Test
    @DisplayName("Should skip members who reached daily capacity limits")
    void testDailyCapacityLimitSkip() {
        UUID companyId = UUID.randomUUID();
        UUID poolId = UUID.randomUUID();
        UUID user1 = UUID.randomUUID();

        CrmRoundRobinPool pool = CrmRoundRobinPool.builder()
                .id(poolId)
                .poolCode("CAPACITY_TEST")
                .routingStrategy(RoundRobinStrategy.ROUND_ROBIN)
                .isActive(true)
                .build();

        CrmRoundRobinMember exhausted = CrmRoundRobinMember.builder()
                .id(UUID.randomUUID())
                .poolId(poolId)
                .userId(user1)
                .currentLeadsToday(50)
                .maxDailyLeads(50)
                .isActive(true)
                .build();

        when(poolRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, poolId)).thenReturn(Optional.of(pool));
        when(memberRepository.findByCompanyIdAndPoolIdAndIsActiveTrueAndIsDeletedFalse(companyId, poolId))
                .thenReturn(List.of(exhausted));

        Optional<UUID> assignee = roundRobinAssignmentService.getNextAssignee(companyId, poolId);

        assertTrue(assignee.isEmpty(), "Should return empty when all members hit daily capacity");
        verify(memberRepository, never()).save(any());
    }
}

