package com.motasem.safeshare.controller;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserSearchResponse {
    private Integer id;
    private String email;
    private String publicKey; // This is what React needs to lock the file for the friend!
}