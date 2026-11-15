package com.erp.crm.modules.automation.service;

import com.erp.crm.common.exception.ResourceNotFoundException;
import com.erp.crm.modules.automation.entity.CrmRoundRobinMember;
import com.erp.crm.modules.automation.entity.CrmRoundRobinPool;
import com.erp.crm.modules.automation.enums.RoundRobinStrategy;
import com.erp.crm.modules.automation.repository.CrmRoundRobinMemberRepository;
import com.erp.crm.modules.automation.repository.CrmRoundRobinPoolRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoundRobinAssignmentService {

    private final CrmRoundRobinPoolRepository poolRepository;
    private final CrmRoundRobinMemberRepository memberRepository;

    /**
     * Atomically selects and increments next assigned user from the specified pool.
     */
    @Transactional
    public synchronized Optional<UUID> getNextAssignee(UUID companyId, UUID poolId) {
        CrmRoundRobinPool pool = poolRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, poolId)
                .orElseThrow(() -> new ResourceNotFoundException("Round robin pool not found: " + poolId));

        if (!Boolean.TRUE.equals(pool.getIsActive())) {
            log.warn("Round robin pool [{}] is inactive. Skipping assignment.", pool.getPoolCode());
            return Optional.empty();
        }

        List<CrmRoundRobinMember> activeMembers = memberRepository
                .findByCompanyIdAndPoolIdAndIsActiveTrueAndIsDeletedFalse(companyId, poolId);

        if (activeMembers.isEmpty()) {
            log.warn("No active members found in pool: {}", pool.getPoolCode());
            return Optional.empty();
        }

        // Filter out members who reached daily capacity
        List<CrmRoundRobinMember> availableMembers = activeMembers.stream()
                .filter(m -> m.getMaxDailyLeads() == null || m.getCurrentLeadsToday() < m.getMaxDailyLeads())
                .toList();

        if (availableMembers.isEmpty()) {
            log.warn("All members in pool [{}] have reached daily lead limits.", pool.getPoolCode());
            return Optional.empty();
        }

        RoundRobinStrategy strategy = pool.getRoutingStrategy() != null
                ? pool.getRoutingStrategy()
                : RoundRobinStrategy.ROUND_ROBIN;

        CrmRoundRobinMember chosenMember;
        switch (strategy) {
            case WEIGHTED_CAPACITY -> chosenMember = selectWeightedCapacity(availableMembers);
            case AVAILABILITY_BASED -> chosenMember = selectAvailabilityBased(availableMembers);
            case ROUND_ROBIN -> chosenMember = selectLeastRecentlyAssigned(availableMembers);
            default -> chosenMember = selectLeastRecentlyAssigned(availableMembers);
        }

        if (chosenMember != null) {
            chosenMember.setCurrentLeadsToday(chosenMember.getCurrentLeadsToday() + 1);
            chosenMember.setLastAssignedAt(LocalDateTime.now());
            memberRepository.save(chosenMember);
            log.info("Assigned lead to user [{}] via pool [{}] strategy [{}]",
                    chosenMember.getUserId(), pool.getPoolCode(), strategy);
            return Optional.of(chosenMember.getUserId());
        }

        return Optional.empty();
    }

    private CrmRoundRobinMember selectLeastRecentlyAssigned(List<CrmRoundRobinMember> members) {
        return members.stream()
                .min(Comparator.comparing(
                        CrmRoundRobinMember::getLastAssignedAt,
                        Comparator.nullsFirst(Comparator.naturalOrder())
                ).thenComparing(CrmRoundRobinMember::getCurrentLeadsToday))
                .orElse(null);
    }

    private CrmRoundRobinMember selectWeightedCapacity(List<CrmRoundRobinMember> members) {
        return members.stream()
                .min(Comparator.comparingDouble(m -> {
                    int weight = (m.getWeight() != null && m.getWeight() > 0) ? m.getWeight() : 1;
                    return (double) m.getCurrentLeadsToday() / weight;
                }))
                .orElse(null);
    }

    private CrmRoundRobinMember selectAvailabilityBased(List<CrmRoundRobinMember> members) {
        return members.stream()
                .max(Comparator.comparingInt(m -> {
                    int max = m.getMaxDailyLeads() != null ? m.getMaxDailyLeads() : 100;
                    return max - m.getCurrentLeadsToday();
                }))
                .orElse(null);
    }
}

