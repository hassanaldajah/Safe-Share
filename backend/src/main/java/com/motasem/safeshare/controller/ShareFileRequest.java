package com.motasem.safeshare.controller;

import lombok.Data;

@Data
public class ShareFileRequest {
    private Integer fileId;           // The ID of the file in your database
    private String targetSearchTag;   // The @tag of the friend receiving the file
    private String encryptedKey;      // The AES key, newly encrypted with the friend's Public Key
    private Integer maxViews;
    private Integer maxDownloads;
    private Boolean canReshare;
}