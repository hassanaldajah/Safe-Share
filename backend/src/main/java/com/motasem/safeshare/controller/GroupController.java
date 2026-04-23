package com.motasem.safeshare.controller;

import com.motasem.safeshare.model.GroupEntity;
import com.motasem.safeshare.model.GroupMember;
import com.motasem.safeshare.model.GroupRole;
import com.motasem.safeshare.model.User;
import com.motasem.safeshare.services.GroupService;
import com.motasem.safeshare.services.AuditService;
import com.motasem.safeshare.repository.GroupRepository;
import com.motasem.safeshare.repository.GroupMemberRepository;
import com.motasem.safeshare.repository.AuditLogRepository;
import com.motasem.safeshare.repository.UserRepository;
import com.motasem.safeshare.repository.FileRepository;
import jakarta.transaction.Transactional;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;
    private final AuditService auditService;
    private final AuditLogRepository auditLogRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final FileRepository fileRepository;

    @GetMapping("/{groupId}/audit")
    public ResponseEntity<?> getGroupAuditLogs(
            @PathVariable Integer groupId,
            @AuthenticationPrincipal User currentUser) {
        try {
            var group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Group not found"));

            var logs = auditLogRepository.findAllByGroupIdOrderByTimestampDesc(groupId);

            var responseList = logs.stream().map(log -> Map.of(
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

    @GetMapping
    public ResponseEntity<List<GroupResponse>> getMyGroups(@AuthenticationPrincipal User currentUser) {
        var groups = groupService.getUserGroups(currentUser);
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
                            .color(colors[i % colors.length])
                            .build();
                }).toList();

        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/{groupId}/files")
    public ResponseEntity<?> getGroupFiles(
            @PathVariable Integer groupId,
            @AuthenticationPrincipal User currentUser) {
        try {
            GroupEntity group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Group not found"));

            groupMemberRepository.findByGroupAndUser(group, currentUser)
                    .orElseThrow(() -> new RuntimeException("Access denied"));

            var files = fileRepository.findAllByGroupAndIsDeletedFalse(group);

            var response = files.stream().map(f -> java.util.Map.of(
                    "id", f.getId().toString(),
                    "name", f.getOriginalName(), // FIXED
                    "size", (f.getSizeBytes() != null ? (f.getSizeBytes() / 1024) + " KB" : "Unknown"),
                    "uploadedBy", f.getOwner().getFullName(),
                    "uploadedAt", f.getUploadedAt() != null ? f.getUploadedAt().toLocalDate().toString() : "Today", // FIXED
                    "type", f.getFileType() != null ? f.getFileType() : "unknown"
            )).toList();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> getGroupMembers(
            @PathVariable Integer groupId,
            @AuthenticationPrincipal User currentUser) {
        try {
            GroupEntity group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Group not found"));

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

    @Data
    public static class CreateGroupRequest {
        private String name;
        private String description;
        private String creatorEncryptedGroupKey;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createGroup(
            @RequestBody CreateGroupRequest request,
            @AuthenticationPrincipal User currentUser) {
        try {
            var newGroup = groupService.createGroup(request.getName(), request.getDescription(), currentUser, request.getCreatorEncryptedGroupKey());
            return ResponseEntity.ok(newGroup);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

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

    @Data
    public static class RoleUpdateRequest {
        private Integer userId;
        private GroupRole newRole;
    }

    @PutMapping("/{groupId}/members/role")
    @Transactional
    public ResponseEntity<?> updateMemberRole(
            @PathVariable Integer groupId,
            @RequestBody RoleUpdateRequest request,
            @AuthenticationPrincipal User actor) {
        try {
            GroupEntity group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Group not found"));

            GroupMember requester = groupMemberRepository.findByGroupAndUser(group, actor)
                    .orElseThrow(() -> new RuntimeException("Unauthorized"));

            if (requester.getRole() != GroupRole.ADMIN) {
                return ResponseEntity.status(403).body("Only Admins can change permissions.");
            }

            User targetUser = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            GroupMember member = groupMemberRepository.findByGroupAndUser(group, targetUser)
                    .orElseThrow(() -> new RuntimeException("Member not found in this group"));

            member.setRole(request.getNewRole());
            groupMemberRepository.save(member);

            auditService.logEvent(group, actor.getFullName(), "Updated Role",
                    "User: " + targetUser.getFullName() + " to " + request.getNewRole(), "warn");

            return ResponseEntity.ok("Member role updated successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

    }
    // ==========================================
    // 1. KICK A MEMBER (Admins Only)
    // ==========================================
    @DeleteMapping("/{groupId}/members/{userId}")
    @Transactional
    public ResponseEntity<?> removeMember(
            @PathVariable Integer groupId,
            @PathVariable Integer userId,
            @AuthenticationPrincipal User currentUser) {
        try {
            GroupEntity group = groupRepository.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));
            GroupMember actor = groupMemberRepository.findByGroupAndUser(group, currentUser).orElseThrow(() -> new RuntimeException("Unauthorized"));

            if (actor.getRole() != GroupRole.ADMIN) return ResponseEntity.status(403).body("Only Admins can remove members.");

            User targetUser = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
            GroupMember targetMember = groupMemberRepository.findByGroupAndUser(group, targetUser).orElseThrow(() -> new RuntimeException("Member not in group"));

            groupMemberRepository.delete(targetMember);
            auditService.logEvent(group, currentUser.getFullName(), "Removed Member", targetUser.getFullName(), "critical");

            return ResponseEntity.ok("Member removed successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==========================================
    // 2. LEAVE A GROUP (Any Member)
    // ==========================================
    @DeleteMapping("/{groupId}/leave")
    @Transactional
    public ResponseEntity<?> leaveGroup(
            @PathVariable Integer groupId,
            @AuthenticationPrincipal User currentUser) {
        try {
            GroupEntity group = groupRepository.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));
            GroupMember member = groupMemberRepository.findByGroupAndUser(group, currentUser).orElseThrow(() -> new RuntimeException("You are not in this group"));

            groupMemberRepository.delete(member);
            auditService.logEvent(group, currentUser.getFullName(), "Left Group", currentUser.getFullName(), "warn");

            return ResponseEntity.ok("You have successfully left the group.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==========================================
    // 3. DELETE A GROUP FILE (Admins & Editors)
    // ==========================================
    @DeleteMapping("/{groupId}/files/{fileId}")
    @Transactional
    public ResponseEntity<?> deleteGroupFile(
            @PathVariable Integer groupId,
            @PathVariable Integer fileId,
            @AuthenticationPrincipal User currentUser) {
        try {
            GroupEntity group = groupRepository.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));
            GroupMember actor = groupMemberRepository.findByGroupAndUser(group, currentUser).orElseThrow(() -> new RuntimeException("Unauthorized"));

            if (actor.getRole() == GroupRole.VIEWER) {
                return ResponseEntity.status(403).body("Viewers cannot delete files.");
            }

            var file = fileRepository.findById(fileId).orElseThrow(() -> new RuntimeException("File not found"));
            if (file.getGroup() == null || !file.getGroup().getId().equals(groupId)) {
                return ResponseEntity.status(403).body("File does not belong to this group.");
            }

            // Soft delete the file
            file.setDeleted(true);
            fileRepository.save(file);

            auditService.logEvent(group, currentUser.getFullName(), "Deleted File", file.getOriginalName(), "critical");

            return ResponseEntity.ok("File deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}