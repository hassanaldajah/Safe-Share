package com.motasem.safeshare.controller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String searchTag;
    private String fullName;
    private String email;
    private String password;

    // E2EE Data mapped from frontend
    private String publicKey;
    private String encryptedPrivateKey;
    private String keySalt;
    private String keyIv;
}