package com.motasem.safeshare.controller;

import lombok.Data;

@Data
public class ShareRequest {
    private String receiverEmail;
    private String receiverEncryptedKey; // The AES key locked with the friend's Public Key
}