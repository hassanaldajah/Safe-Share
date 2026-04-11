package com.motasem.safeshare.controller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchResponse {
    private String searchTag;
    private String fullName;
    private String publicKey; // This is what React needs to lock the file for the friend!
}