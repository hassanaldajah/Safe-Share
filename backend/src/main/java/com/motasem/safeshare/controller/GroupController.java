package com.motasem.safeshare.controller;

import com.motasem.safeshare.model.GroupEntity;
import com.motasem.safeshare.model.User;
import com.motasem.safeshare.services.GroupService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.motasem.safeshare.repository.GroupRepository;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;
    private final com.motasem.safeshare.repository.FileRepository fileRepository;
    // You will need to import com.motasem.safeshare.repository.GroupRepository
    private final com.motasem.safeshare.repository.AuditLogRepository auditLogRepository;
    private final com.motasem.safeshare.repository.GroupRepository groupRepository;
    private final com.motasem.safeshare.repository.GroupMemberRepository groupMemberRepository;
    @GetMapping("/{groupId}/audit")
    public ResponseEntity<?> getGroupAuditLogs(
            @PathVariable Integer groupId,
            @AuthenticationPrincipal User currentUser) {
        try {
            // 1. Verify the group exists
            var group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Group not found"));

            // 2. Security Check: In a real app, verify `currentUser` is actually in this group here!

            // 3. Fetch and format the logs for React
            var logs = auditLogRepository.findAllByGroupIdOrderByTimestampDesc(groupId);

            var responseList = logs.stream().map(log -> java.util.Map.of(
                    "id", log.getId().toString(),
                    "user", log.getActorName(),
                    "action", log.getAction(),
                    "target", log.getTargetName(),
                    "severity", log.getSeverity(),
                    "timestamp", log.getTimestamp().toString()
            )).toList();

            return ResponseEntity.ok(responseList);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // A small Request Class to hold the incoming JSON data
    @Data
    public static class CreateGroupRequest {
        private String name;
        private String description;
    }
    // --- FETCH GROUP FILES ---
    @GetMapping("/{groupId}/files")
    public ResponseEntity<?> getGroupFiles(
            @PathVariable Integer groupId,
            @AuthenticationPrincipal User currentUser) {
        try {
            GroupEntity group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Group not found"));

            // Security check
            groupMemberRepository.findByGroupAndUser(group, currentUser)
                    .orElseThrow(() -> new RuntimeException("Access denied"));

            var files = fileRepository.findAllByGroupAndIsDeletedFalse(group);

            var response = files.stream().map(f -> java.util.Map.of(
                    "id", f.getId().toString(),
                    "name", f.getOriginalName(),
                    "size", (f.getSizeBytes() != null ? (f.getSizeBytes() / 1024) + " KB" : "Unknown"),
                    "uploadedBy", f.getOwner().getFullName(),
                    "uploadedAt", f.getUploadedAt() != null ? f.getUploadedAt().toLocalDate().toString() : "Today",
                    "type", f.getFileType() != null ? f.getFileType() : "unknown"
            )).toList();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping
    public ResponseEntity<java.util.List<GroupResponse>> getMyGroups(@AuthenticationPrincipal User currentUser) {
        var groups = groupService.getUserGroups(currentUser);

        // Array of Tailwind gradients to make the UI look premium
        String[] colors = {"from-violet-500 to-purple-600", "from-sky-500 to-cyan-600", "from-amber-500 to-orange-600", "from-emerald-500 to-teal-600", "from-rose-500 to-pink-600"};

        var responseList = java.util.stream.IntStream.range(0, groups.size())
                .mapToObj(i -> {
                    GroupEntity g = groups.get(i);
                    return GroupResponse.builder()
                            .id(g.getId().toString())
                            .name(g.getName())
                            .description(g.getDescription())
                            .inviteCode(g.getInviteCode())
                            .memberCount(g.getMembers().size())
                            .myRole(groupService.getUserRoleInGroup(g, currentUser))
                            .color(colors[i % colors.length]) // Cycle through colors
                            .build();
                }).toList();

        return ResponseEntity.ok(responseList);
    }
    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> getGroupMembers(
            @PathVariable Integer groupId,
            @AuthenticationPrincipal User currentUser) {
        try {
            GroupEntity group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Group not found"));

            // Check if the current user is actually in this group
            groupMemberRepository.findByGroupAndUser(group, currentUser)
                    .orElseThrow(() -> new RuntimeException("Access denied"));

            var members = groupMemberRepository.findAllByGroup(group);

            var response = members.stream().map(m -> java.util.Map.of(
                    "userId", m.getUser().getId(),
                    "name", m.getUser().getFullName(),
                    "email", m.getUser().getEmail(),
                    "role", m.getRole().toString(),
                    "joinedAt", m.getJoinedAt().toString()
            )).toList();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // Request object for joining
    @Data
    public static class JoinGroupRequest {
        private String inviteCode;
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinGroup(
            @RequestBody JoinGroupRequest request,
            @AuthenticationPrincipal User currentUser) {
        try {
            groupService.joinGroup(request.getInviteCode(), currentUser);
            return ResponseEntity.ok("Successfully joined the group!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PostMapping("/create")
    public ResponseEntity<?> createGroup(
            @RequestBody CreateGroupRequest request,
            @AuthenticationPrincipal User currentUser) {
        try {
            var newGroup = groupService.createGroup(request.getName(), request.getDescription(), currentUser);
            return ResponseEntity.ok(newGroup);
        } catch (Exception e) {
            // This will send back the "Free tier limit reached!" message if they fail the check
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}