package com.erp.communication.chat.websocket;

import com.erp.communication.chat.repository.ChatChannelMemberRepository;
import com.erp.communication.security.ServiceAuthProperties;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebSocketAuthChannelInterceptorTest {

    @Mock
    private ChatChannelMemberRepository memberRepository;

    @Mock
    private MessageChannel channel;

    private ServiceAuthProperties serviceAuthProperties;
    private WebSocketAuthChannelInterceptor interceptor;

    private final String secretKeyStr = "this-is-a-very-secure-test-secret-key-with-256-bits-minimum-length-needed";
    private final String internalToken = "test-internal-service-token";

    @BeforeEach
    void setUp() {
        serviceAuthProperties = new ServiceAuthProperties();
        serviceAuthProperties.setInternalToken(internalToken);
        serviceAuthProperties.setHeaderName("X-Service-Token");

        interceptor = new WebSocketAuthChannelInterceptor(serviceAuthProperties, memberRepository);
        ReflectionTestUtils.setField(interceptor, "jwtSecret", secretKeyStr);
    }

    @Test
    @DisplayName("CONNECT with valid Service-Token should set Principal")
    void testConnectWithServiceToken() {
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("X-Service-Token", internalToken);
        accessor.addNativeHeader("X-Company-Id", companyId.toString());
        accessor.addNativeHeader("X-User-Id", userId.toString());
        accessor.addNativeHeader("X-User-Name", "crm-system");

        Message<?> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(msg, channel);
        assertNotNull(result);

        StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
        assertNotNull(resultAccessor.getUser());
        assertTrue(resultAccessor.getUser() instanceof ChatUserPrincipal);

        ChatUserPrincipal principal = (ChatUserPrincipal) resultAccessor.getUser();
        assertEquals(companyId, principal.getCompanyId());
        assertEquals(userId, principal.getUserId());
        assertEquals("crm-system", principal.getName());
    }

    @Test
    @DisplayName("CONNECT with valid Bearer JWT should set Principal")
    void testConnectWithJwt() {
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        SecretKey key = Keys.hmacShaKeyFor(secretKeyStr.getBytes(StandardCharsets.UTF_8));
        String jwt = Jwts.builder()
                .subject("rohit@mark2.in")
                .claim("companyId", companyId.toString())
                .claim("userId", userId.toString())
                .claim("name", "Rohit")
                .expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(key)
                .compact();

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer " + jwt);

        Message<?> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(msg, channel);
        assertNotNull(result);

        StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
        assertNotNull(resultAccessor.getUser());
        ChatUserPrincipal principal = (ChatUserPrincipal) resultAccessor.getUser();
        assertEquals(companyId, principal.getCompanyId());
        assertEquals(userId, principal.getUserId());
        assertEquals("Rohit", principal.getName());
    }

    @Test
    @DisplayName("CONNECT with missing/invalid credentials should throw AccessDeniedException")
    void testConnectWithoutAuthThrows() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        Message<?> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(msg, channel));
    }

    @Test
    @DisplayName("SUBSCRIBE to cross-tenant company channel must throw AccessDeniedException")
    void testSubscribeCrossTenantBlocked() {
        UUID userCompanyId = UUID.randomUUID();
        UUID otherCompanyId = UUID.randomUUID();
        UUID channelId = UUID.randomUUID();

        ChatUserPrincipal principal = ChatUserPrincipal.builder()
                .companyId(userCompanyId)
                .userId(UUID.randomUUID())
                .name("TenantUser")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_USER")))
                .build();

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setUser(principal);
        accessor.setDestination(String.format("/topic/company.%s.channel.%s", otherCompanyId, channelId));

        Message<?> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> interceptor.preSend(msg, channel));
        assertTrue(ex.getMessage().contains("Tenant isolation violation"));
    }

    @Test
    @DisplayName("SUBSCRIBE to channel where user is not a member should throw AccessDeniedException")
    void testSubscribeNonMemberBlocked() {
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID channelId = UUID.randomUUID();

        ChatUserPrincipal principal = ChatUserPrincipal.builder()
                .companyId(companyId)
                .userId(userId)
                .name("TenantUser")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_USER")))
                .build();

        when(memberRepository.existsByCompanyIdAndChannelIdAndUserId(companyId, channelId, userId)).thenReturn(false);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setUser(principal);
        accessor.setDestination(String.format("/topic/company.%s.channel.%s", companyId, channelId));

        Message<?> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> interceptor.preSend(msg, channel));
        assertTrue(ex.getMessage().contains("not a member"));
    }
}
