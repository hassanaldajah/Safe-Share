package com.motasem.safeshare.controller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {
    private String token;
    private String publicKey;
    // E2EE Data needed by frontend to decrypt the private key on login
    private String encryptedPrivateKey;
    private String keySalt;
    private String keyIv;
    private String fullName;
    private String email;
    private String searchTag;
}