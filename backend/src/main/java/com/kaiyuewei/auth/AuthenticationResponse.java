package com.kaiyuewei.auth;

import com.kaiyuewei.customer.CustomerDTO;

public record AuthenticationResponse (
        String token,
        CustomerDTO customerDTO){
}
