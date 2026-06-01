package com.motasem.safeshare.controller;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class FolderResponse {
    private Integer id;
    private String name;
    private Integer parentId;
    private LocalDateTime createdAt;
}
