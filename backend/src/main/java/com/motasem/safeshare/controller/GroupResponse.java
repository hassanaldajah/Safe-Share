package com.motasem.safeshare.controller;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class GroupResponse {
    private String id;
    private String name;
    private String description;
    private String inviteCode;
    private long memberCount;
    private String myRole;
    private String color; // We will assign a random Tailwind color for the UI!
}