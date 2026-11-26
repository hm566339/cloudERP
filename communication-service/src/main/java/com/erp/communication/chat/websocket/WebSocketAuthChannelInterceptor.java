package com.erp.communication.chat.websocket;

import com.erp.communication.chat.repository.ChatChannelMemberRepository;
import com.erp.communication.security.ServiceAuthProperties;
import com.erp.communication.security.sso.AccountStatus;
import com.erp.communication.security.sso.RoleResponse;
import com.erp.communication.security.sso.SsoVerificationClient;
import com.erp.communication.security.sso.TokenVerifyResponse;
import com.erp.communication.security.sso.UserResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Slf4j
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final ServiceAuthProperties serviceAuthProperties;
    private final ChatChannelMemberRepository memberRepository;
    private final SsoVerificationClient ssoVerificationClient;

    @Value("${app.jwt.secret:default-must-be-overridden-in-production}")
    private String jwtSecret;

    private static final Pattern CHANNEL_TOPIC_PATTERN =
            Pattern.compile("^/topic/company\\.([a-fA-F0-9\\-]+)\\.channel\\.([a-fA-F0-9\\-]+)$");

    private static final Pattern USER_NOTIFICATION_TOPIC_PATTERN =
            Pattern.compile("^/topic/company\\.([a-fA-F0-9\\-]+)\\.user\\.([a-fA-F0-9\\-]+)\\.notifications$");

    @Autowired
    public WebSocketAuthChannelInterceptor(
            ServiceAuthProperties serviceAuthProperties,
            ChatChannelMemberRepository memberRepository,
            @Autowired(required = false) SsoVerificationClient ssoVerificationClient) {
        this.serviceAuthProperties = serviceAuthProperties;
        this.memberRepository = memberRepository;
        this.ssoVerificationClient = ssoVerificationClient;
    }

    public WebSocketAuthChannelInterceptor(
            ServiceAuthProperties serviceAuthProperties,
            ChatChannelMemberRepository memberRepository) {
        this(serviceAuthProperties, memberRepository, null);
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (command == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(command)) {
            ChatUserPrincipal principal = authenticateConnect(accessor);
            if (!accessor.isMutable()) {
                StompHeaderAccessor mutable = StompHeaderAccessor.create(StompCommand.CONNECT);
                mutable.copyHeaders(accessor.toMap());
                mutable.setUser(principal);
                return MessageBuilder.createMessage(message.getPayload(), mutable.getMessageHeaders());
            } else {
                accessor.setUser(principal);
            }
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            handleSubscribe(accessor);
        } else if (StompCommand.SEND.equals(command)) {
            handleSend(accessor);
        }

        return message;
    }

    private ChatUserPrincipal authenticateConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        String serviceToken = accessor.getFirstNativeHeader(serviceAuthProperties.getHeaderName());
        if (!StringUtils.hasText(serviceToken)) {
            serviceToken = accessor.getFirstNativeHeader("X-Service-Token");
        }

        ChatUserPrincipal principal = null;

        // 1. Check internal service token
        if (StringUtils.hasText(serviceToken) && isValidServiceToken(serviceToken.trim())) {
            UUID companyId = parseUuid(accessor.getFirstNativeHeader("X-Company-Id"));
            if (companyId == null) companyId = parseUuid(accessor.getFirstNativeHeader("X-COMPANY-ID"));
            UUID userId = parseUuid(accessor.getFirstNativeHeader("X-User-Id"));
            if (userId == null) userId = parseUuid(accessor.getFirstNativeHeader("X-USER-ID"));
            String userName = accessor.getFirstNativeHeader("X-User-Name");
            if (userName == null) userName = accessor.getFirstNativeHeader("X-USERNAME");
            if (userName == null) userName = "internal-service";

            principal = ChatUserPrincipal.builder()
                    .name(userName)
                    .userId(userId != null ? userId : UUID.randomUUID())
                    .companyId(companyId)
                    .caller("INTERNAL_SERVICE")
                    .authorities(List.of(new SimpleGrantedAuthority("ROLE_INTERNAL_SERVICE")))
                    .build();

            log.info("WebSocket STOMP connected via Service-Token | companyId={} | userId={}", companyId, userId);
        }

        // 2. Check Bearer JWT token
        if (principal == null && StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();

            boolean tokenRejectedBySso = false;

            // 2a. Primary SSO Verification via POST /api/sso/token/verify
            if (ssoVerificationClient != null) {
                SsoVerificationClient.VerificationResult ssoResult = ssoVerificationClient.verify(token);
                if (ssoResult.isSuccess()) {
                    TokenVerifyResponse verify = ssoResult.data();
                    UserResponse user = verify.getUser();
                    if (user != null && user.getId() != null && user.getAccountStatus() == AccountStatus.ACTIVE) {
                        UUID companyId = parseUuid(accessor.getFirstNativeHeader("X-Company-Id"));
                        if (companyId == null) companyId = parseUuid(accessor.getFirstNativeHeader("X-COMPANY-ID"));
                        if (companyId == null && user.getCompanyCode() != null) {
                            companyId = parseUuid(user.getCompanyCode());
                        }

                        UUID userId = user.getId();
                        String userName = StringUtils.hasText(user.getUsername()) ? user.getUsername() : user.getFullName();

                        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                        if (user.getRole() != null) {
                            for (RoleResponse r : user.getRole()) {
                                if (r != null && r.isStatus() && StringUtils.hasText(r.getName())) {
                                    String role = r.getName().trim();
                                    authorities.add(new SimpleGrantedAuthority(role.startsWith("ROLE_") ? role : "ROLE_" + role));
                                }
                            }
                        }
                        if (authorities.isEmpty()) {
                            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                        }

                        principal = ChatUserPrincipal.builder()
                                .name(userName != null ? userName : "User")
                                .userId(userId)
                                .companyId(companyId)
                                .caller(user.getUsername() != null ? user.getUsername() : "USER")
                                .authorities(authorities)
                                .build();

                        log.info("WebSocket STOMP connected via SSO token verification | companyId={} | userId={} | name={}",
                                companyId, userId, userName);
                    }
                } else if (ssoResult.isRejected()) {
                    tokenRejectedBySso = true;
                    log.warn("WebSocket STOMP token explicitly rejected by SSO");
                }
            }

            // 2b. Optional / Test Fallback: Local JWT verification (RSA public key or HMAC secret)
            if (principal == null && !tokenRejectedBySso) {
                Claims claims = parseJwtClaims(token);
                if (claims != null) {
                    String subject = claims.getSubject();
                    UUID companyId = parseUuidFromClaim(claims.get("companyId"));
                    if (companyId == null) companyId = parseUuidFromClaim(claims.get("company_id"));
                    if (companyId == null) {
                        companyId = parseUuid(accessor.getFirstNativeHeader("X-Company-Id"));
                    }
                    if (companyId == null) {
                        companyId = parseUuid(accessor.getFirstNativeHeader("X-COMPANY-ID"));
                    }

                    UUID userId = parseUuidFromClaim(claims.get("userId"));
                    if (userId == null) userId = parseUuidFromClaim(claims.get("user_id"));
                    if (userId == null) userId = parseUuidFromClaim(claims.get("id"));
                    if (userId == null && subject != null) {
                        userId = parseUuid(subject);
                    }
                    if (userId == null) {
                        userId = parseUuid(accessor.getFirstNativeHeader("X-User-Id"));
                    }
                    if (userId == null) {
                        userId = parseUuid(accessor.getFirstNativeHeader("X-USER-ID"));
                    }

                    String userName = subject;
                    if (claims.get("name") != null) {
                        userName = claims.get("name").toString();
                    } else if (claims.get("username") != null) {
                        userName = claims.get("username").toString();
                    } else if (accessor.getFirstNativeHeader("X-User-Name") != null) {
                        userName = accessor.getFirstNativeHeader("X-User-Name");
                    } else if (accessor.getFirstNativeHeader("X-USERNAME") != null) {
                        userName = accessor.getFirstNativeHeader("X-USERNAME");
                    }

                    principal = ChatUserPrincipal.builder()
                            .name(userName != null ? userName : "User")
                            .userId(userId)
                            .companyId(companyId)
                            .caller(subject != null ? subject : "USER")
                            .authorities(List.of(new SimpleGrantedAuthority("ROLE_USER")))
                            .build();

                    log.info("WebSocket STOMP connected via JWT fallback | companyId={} | userId={} | name={}", companyId, userId, userName);
                }
            }
        }

        if (principal == null) {
            log.warn("WebSocket STOMP connection rejected: Missing or invalid authentication token");
            throw new AccessDeniedException("Authentication failed: Valid JWT token or service token required");
        }

        return principal;
    }

    private Claims parseJwtClaims(String token) {
        // Local HMAC Secret verification (Mock / Test HS256 token fallback)
        if (StringUtils.hasText(jwtSecret)) {
            try {
                SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                return Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();
            } catch (Exception ex) {
                log.debug("WebSocket HMAC verification failed ({})", ex.getMessage());
            }
        }

        return null;
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        ChatUserPrincipal principal = (ChatUserPrincipal) accessor.getUser();
        if (principal == null) {
            throw new AccessDeniedException("Unauthenticated STOMP subscription rejected");
        }

        String destination = accessor.getDestination();
        if (!StringUtils.hasText(destination)) {
            return;
        }

        // Validate channel broadcast topic: /topic/company.{companyId}.channel.{channelId}
        Matcher matcher = CHANNEL_TOPIC_PATTERN.matcher(destination);
        if (matcher.matches()) {
            String targetCompanyIdStr = matcher.group(1);
            String targetChannelIdStr = matcher.group(2);

            UUID targetCompanyId = UUID.fromString(targetCompanyIdStr);
            UUID targetChannelId = UUID.fromString(targetChannelIdStr);

            // Tenant Isolation Enforcement
            if (principal.getCompanyId() != null && !principal.getCompanyId().equals(targetCompanyId)) {
                log.warn("STOMP cross-tenant subscription blocked! userCompany={} attempted={}",
                        principal.getCompanyId(), targetCompanyId);
                throw new AccessDeniedException("Tenant isolation violation: cannot subscribe to another company's channel");
            }

            // Member verification (internal service bypasses member check)
            boolean isInternal = principal.getAuthorities() != null &&
                    principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_SERVICE"));

            if (!isInternal && principal.getUserId() != null) {
                boolean isMember = memberRepository.existsByCompanyIdAndChannelIdAndUserId(
                        targetCompanyId, targetChannelId, principal.getUserId());
                if (!isMember) {
                    log.warn("STOMP unauthorized channel subscription blocked! user={} channel={}",
                            principal.getUserId(), targetChannelId);
                    throw new AccessDeniedException("Access denied: You are not a member of this channel");
                }
            }
            return;
        }

        // Validate personal user notifications topic: /topic/company.{companyId}.user.{userId}.notifications
        Matcher userNotifMatcher = USER_NOTIFICATION_TOPIC_PATTERN.matcher(destination);
        if (userNotifMatcher.matches()) {
            UUID targetCompanyId = UUID.fromString(userNotifMatcher.group(1));
            UUID targetUserId = UUID.fromString(userNotifMatcher.group(2));

            boolean isInternal = principal.getAuthorities() != null &&
                    principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_SERVICE"));

            if (!isInternal) {
                if (principal.getCompanyId() != null && !principal.getCompanyId().equals(targetCompanyId)) {
                    log.warn("STOMP cross-tenant notification subscription blocked! userCompany={} attempted={}",
                            principal.getCompanyId(), targetCompanyId);
                    throw new AccessDeniedException("Tenant isolation violation: cannot subscribe to another company's notifications");
                }
                if (principal.getUserId() != null && !principal.getUserId().equals(targetUserId)) {
                    log.warn("STOMP cross-user notification subscription blocked! user={} attempted={}",
                            principal.getUserId(), targetUserId);
                    throw new AccessDeniedException("Access denied: You cannot subscribe to another user's notifications");
                }
            }
            return;
        }
    }

    private void handleSend(StompHeaderAccessor accessor) {
        ChatUserPrincipal principal = (ChatUserPrincipal) accessor.getUser();
        if (principal == null) {
            throw new AccessDeniedException("Unauthenticated STOMP message send rejected");
        }
    }

    private boolean isValidServiceToken(String providedToken) {
        String configuredToken = serviceAuthProperties.getInternalToken();
        if (!StringUtils.hasText(configuredToken)) {
            return false;
        }
        return MessageDigest.isEqual(
                providedToken.getBytes(StandardCharsets.UTF_8),
                configuredToken.getBytes(StandardCharsets.UTF_8)
        );
    }

    private UUID parseUuid(String value) {
        if (!StringUtils.hasText(value)) return null;
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private UUID parseUuidFromClaim(Object claim) {
        if (claim == null) return null;
        return parseUuid(claim.toString());
    }
}
