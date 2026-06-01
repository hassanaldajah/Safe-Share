package com.motasem.safeshare.controller;

import com.motasem.safeshare.model.FolderEntity;
import com.motasem.safeshare.model.User;
import com.motasem.safeshare.repository.FolderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderRepository folderRepository;

    @PostMapping
    public ResponseEntity<FolderResponse> createFolder(
            @RequestParam("name") String name,
            @RequestParam(value = "parentId", required = false) Integer parentId,
            @AuthenticationPrincipal User currentUser) {

        FolderEntity parentFolder = null;
        if (parentId != null) {
            parentFolder = folderRepository.findByIdAndOwner(parentId, currentUser)
                    .orElseThrow(() -> new RuntimeException("Parent folder not found"));
        }

        FolderEntity newFolder = FolderEntity.builder()
                .name(name)
                .owner(currentUser)
                .parentFolder(parentFolder)
                .build();

        FolderEntity saved = folderRepository.save(newFolder);

        return ResponseEntity.ok(FolderResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .parentId(saved.getParentFolder() != null ? saved.getParentFolder().getId() : null)
                .createdAt(saved.getCreatedAt())
                .build());
    }

    @GetMapping
    public ResponseEntity<List<FolderResponse>> getFolders(
            @RequestParam(value = "parentId", required = false) Integer parentId,
            @AuthenticationPrincipal User currentUser) {

        List<FolderEntity> folders;
        if (parentId == null) {
            folders = folderRepository.findAllByOwnerAndParentFolderIsNull(currentUser);
        } else {
            folders = folderRepository.findAllByOwnerAndParentFolderId(currentUser, parentId);
        }

        List<FolderResponse> response = folders.stream().map(f -> FolderResponse.builder()
                .id(f.getId())
                .name(f.getName())
                .parentId(f.getParentFolder() != null ? f.getParentFolder().getId() : null)
                .createdAt(f.getCreatedAt())
                .build()
        ).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    public ResponseEntity<List<FolderResponse>> getAllFolders(
            @AuthenticationPrincipal User currentUser) {

        List<FolderEntity> folders = folderRepository.findAllByOwner(currentUser);

        List<FolderResponse> response = folders.stream().map(f -> FolderResponse.builder()
                .id(f.getId())
                .name(f.getName())
                .parentId(f.getParentFolder() != null ? f.getParentFolder().getId() : null)
                .createdAt(f.getCreatedAt())
                .build()
        ).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
