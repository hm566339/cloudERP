package com.erp.account.modules.ledger.specification;

import com.erp.account.modules.ledger.dto.request.ChartOfAccountFilterDto;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SuppressWarnings("unchecked")
class ChartOfAccountSpecificationTest {

    private Root<ChartOfAccount> root;
    private CriteriaQuery<?> query;
    private CriteriaBuilder cb;
    private Predicate predicate;
    private Path<Object> companyPath;
    private Path<Object> companyIdPath;
    private Path<Object> isDeletedPath;

    @BeforeEach
    void setUp() {
        root = mock(Root.class);
        query = mock(CriteriaQuery.class);
        cb = mock(CriteriaBuilder.class);
        predicate = mock(Predicate.class);
        companyPath = mock(Path.class);
        companyIdPath = mock(Path.class);
        isDeletedPath = mock(Path.class);

        // Common stubs
        when(root.get("company")).thenReturn(companyPath);
        when(companyPath.get("id")).thenReturn(companyIdPath);
        doReturn(isDeletedPath).when(root).get("isDeleted");

        when(cb.and(any(Predicate[].class))).thenReturn(predicate);
        when(cb.or(any(Predicate[].class))).thenReturn(predicate);
        doReturn(predicate).when(cb).isFalse(any());
        when(cb.equal(any(), any())).thenReturn(predicate);
        when(cb.like(any(Expression.class), any(String.class))).thenReturn(predicate);
        when(cb.lower(any(Expression.class))).thenAnswer(inv -> inv.getArgument(0));
        when(cb.greaterThanOrEqualTo(any(Expression.class), any(Comparable.class))).thenReturn(predicate);
        when(cb.lessThanOrEqualTo(any(Expression.class), any(Comparable.class))).thenReturn(predicate);
    }

    @Test
    void shouldReturnSpecificationWithNullFilter() {
        UUID companyId = UUID.randomUUID();

        Predicate result = ChartOfAccountSpecification
                .getFilterSpecification(null, companyId)
                .toPredicate(root, query, cb);

        assertNotNull(result);
        verify(cb).equal(companyIdPath, companyId);
        verify(cb).isFalse(any());
    }

    @Test
    void shouldBuildSearchKeyPredicateAcrossMultipleFields() {
        UUID companyId = UUID.randomUUID();

        ChartOfAccountFilterDto filter = new ChartOfAccountFilterDto();
        filter.setSearchKey("bank");

        Path<Object> accountCodePath = mock(Path.class);
        Path<Object> accountNamePath = mock(Path.class);
        Path<Object> accountTypePath = mock(Path.class);
        Join<Object, Object> groupJoin = mock(Join.class);
        Path<Object> groupNamePath = mock(Path.class);
        Join<Object, Object> parentJoin = mock(Join.class);
        Path<Object> parentCodePath = mock(Path.class);

        when(root.get("accountCode")).thenReturn(accountCodePath);
        when(root.get("accountName")).thenReturn(accountNamePath);
        when(root.get("accountType")).thenReturn(accountTypePath);
        when(accountTypePath.as(String.class)).thenReturn(mock(Path.class));
        when(root.join("group")).thenReturn(groupJoin);
        when(groupJoin.get("name")).thenReturn(groupNamePath);
        when(root.join("parentAccount")).thenReturn(parentJoin);
        when(parentJoin.get("accountCode")).thenReturn(parentCodePath);

        Predicate result = ChartOfAccountSpecification
                .getFilterSpecification(filter, companyId)
                .toPredicate(root, query, cb);

        assertNotNull(result);
        verify(cb, atLeast(5)).like(any(Expression.class), eq("%bank%"));
    }

    @Test
    void shouldApplyAccountCodeFilter() {
        UUID companyId = UUID.randomUUID();

        ChartOfAccountFilterDto filter = new ChartOfAccountFilterDto();
        filter.setAccountCode("1001");

        Path<Object> accountCodePath = mock(Path.class);
        when(root.get("accountCode")).thenReturn(accountCodePath);

        Predicate result = ChartOfAccountSpecification
                .getFilterSpecification(filter, companyId)
                .toPredicate(root, query, cb);

        assertNotNull(result);
        verify(cb).like(any(Expression.class), eq("%1001%"));
    }

    @Test
    void shouldApplyBooleanFilters() {
        UUID companyId = UUID.randomUUID();

        ChartOfAccountFilterDto filter = new ChartOfAccountFilterDto();
        filter.setPostingAllowed(true);
        filter.setIsActive(true);

        Path<Object> postingPath = mock(Path.class);
        Path<Object> activePath = mock(Path.class);

        when(root.get("postingAllowed")).thenReturn(postingPath);
        when(root.get("isActive")).thenReturn(activePath);

        Predicate result = ChartOfAccountSpecification
                .getFilterSpecification(filter, companyId)
                .toPredicate(root, query, cb);

        assertNotNull(result);
        verify(cb).equal(postingPath, true);
        verify(cb).equal(activePath, true);
    }

    @Test
    void shouldApplyGroupIdFilter() {
        UUID companyId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();

        ChartOfAccountFilterDto filter = new ChartOfAccountFilterDto();
        filter.setGroupId(groupId);

        Path<Object> groupPath = mock(Path.class);
        Path<Object> groupIdPath = mock(Path.class);

        when(root.get("group")).thenReturn(groupPath);
        when(groupPath.get("id")).thenReturn(groupIdPath);

        Predicate result = ChartOfAccountSpecification
                .getFilterSpecification(filter, companyId)
                .toPredicate(root, query, cb);

        assertNotNull(result);
        verify(cb).equal(groupIdPath, groupId);
    }
}
