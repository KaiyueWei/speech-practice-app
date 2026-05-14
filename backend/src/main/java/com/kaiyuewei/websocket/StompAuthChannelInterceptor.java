package com.kaiyuewei.websocket;

import com.kaiyuewei.customer.CustomerUserDetailsService;
import com.kaiyuewei.jwt.JWTUtil;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER = "Bearer ";

    private final JWTUtil jwtUtil;
    private final CustomerUserDetailsService userDetailsService;

    public StompAuthChannelInterceptor(JWTUtil jwtUtil,
                                       CustomerUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        if (accessor.getCommand() != StompCommand.CONNECT) {
            return message;
        }

        String header = accessor.getFirstNativeHeader(AUTH_HEADER);
        if (header == null || !header.startsWith(BEARER)) {
            throw new MessagingException("Missing or malformed Authorization header on STOMP CONNECT");
        }
        String jwt = header.substring(BEARER.length());

        String subject;
        try {
            subject = jwtUtil.getSubject(jwt);
        } catch (RuntimeException ex) {
            throw new MessagingException("Invalid JWT on STOMP CONNECT", ex);
        }
        if (subject == null) {
            throw new MessagingException("Invalid JWT on STOMP CONNECT");
        }

        UserDetails userDetails;
        try {
            userDetails = userDetailsService.loadUserByUsername(subject);
        } catch (UsernameNotFoundException ex) {
            throw new MessagingException("Unknown user on STOMP CONNECT", ex);
        }
        if (!jwtUtil.isTokenValid(jwt, userDetails.getUsername())) {
            throw new MessagingException("Invalid or expired JWT on STOMP CONNECT");
        }

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        accessor.setUser(authentication);
        accessor.setLeaveMutable(true);

        return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
    }
}
