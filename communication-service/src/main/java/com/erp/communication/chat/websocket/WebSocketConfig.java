package com.erp.communication.chat.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthChannelInterceptor authChannelInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefix for messages that are bound for @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");

        // Destination prefixes for messages from the broker to subscribed clients
        registry.enableSimpleBroker("/topic", "/queue");

        // Prefix for user-specific destinations
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Primary WebSocket endpoint with SockJS fallback (supports direct /ws-chat and gateway /api/communication/v1/ws-chat)
        registry.addEndpoint("/ws-chat", "/api/communication/v1/ws-chat")
                .setAllowedOriginPatterns("*", "https://*.mark2.in", "https://mark2.in", "http://localhost:*")
                .withSockJS();

        // Plain WebSocket endpoint for native STOMP clients
        registry.addEndpoint("/ws-chat", "/api/communication/v1/ws-chat")
                .setAllowedOriginPatterns("*", "https://*.mark2.in", "https://mark2.in", "http://localhost:*");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authChannelInterceptor);
    }
}
