package com.kaiyuewei.auth;

public record AuthenticationRequest(
        String username,
        String password
) {
}
