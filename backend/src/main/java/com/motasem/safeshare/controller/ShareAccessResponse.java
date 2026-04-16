package com.motasem.safeshare.controller;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ShareAccessResponse {
    private String receiverTag;
    private Integer maxViews;
    private Integer maxDownloads;
    private Boolean canReshare;
}