package com.kaiyuewei.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;

public record CustomerUpdateRequest(
        String name,
        @Email String email,
        @Min(0) Integer age
) {
}