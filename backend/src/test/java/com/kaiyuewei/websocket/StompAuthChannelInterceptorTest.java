package com.kaiyuewei.websocket;

import com.kaiyuewei.customer.Customer;
import com.kaiyuewei.customer.CustomerUserDetailsService;
import com.kaiyuewei.customer.Gender;
import com.kaiyuewei.jwt.JWTUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StompAuthChannelInterceptorTest {

    @Mock private JWTUtil jwtUtil;
    @Mock private CustomerUserDetailsService userDetailsService;

    private StompAuthChannelInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new StompAuthChannelInterceptor(jwtUtil, userDetailsService);
    }

    @Test
    void preSend_connectWithValidToken_setsPrincipalAndPassesThrough() {
        Customer customer = new Customer("Alice", "alice@test.com", "pw", 30, Gender.FEMALE);
        when(jwtUtil.getSubject("valid-token")).thenReturn("alice@test.com");
        when(userDetailsService.loadUserByUsername("alice@test.com")).thenReturn(customer);
        when(jwtUtil.isTokenValid("valid-token", "alice@test.com")).thenReturn(true);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setNativeHeader("Authorization", "Bearer valid-token");
        Message<byte[]> message = MessageBuilder
                .createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, null);

        assertThat(result).isNotNull();
        StompHeaderAccessor out = StompHeaderAccessor.wrap(result);
        assertThat(out.getUser()).isNotNull();
        assertThat(out.getUser().getName()).isEqualTo("alice@test.com");
    }

    @Test
    void preSend_connectWithMissingAuthHeader_throws() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        Message<byte[]> message = MessageBuilder
                .createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, null))
                .isInstanceOf(MessagingException.class);
    }

    @Test
    void preSend_connectWithInvalidToken_throws() {
        Customer customer = new Customer("Alice", "alice@test.com", "pw", 30, Gender.FEMALE);
        when(jwtUtil.getSubject("bad")).thenReturn("alice@test.com");
        when(userDetailsService.loadUserByUsername("alice@test.com")).thenReturn(customer);
        when(jwtUtil.isTokenValid("bad", "alice@test.com")).thenReturn(false);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setNativeHeader("Authorization", "Bearer bad");
        Message<byte[]> message = MessageBuilder
                .createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, null))
                .isInstanceOf(MessagingException.class);
    }

    @Test
    void preSend_nonConnectCommand_passesThroughUnchanged() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        Message<byte[]> message = MessageBuilder
                .createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, null);

        assertThat(result).isSameAs(message);
    }
}
