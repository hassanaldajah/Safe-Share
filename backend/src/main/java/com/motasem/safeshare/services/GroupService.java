package com.motasem.safeshare.services;

import com.motasem.safeshare.model.GroupEntity;
import com.motasem.safeshare.model.GroupMember;
import com.motasem.safeshare.model.GroupRole;
import com.motasem.safeshare.model.User;
import com.motasem.safeshare.repository.GroupMemberRepository;
import com.motasem.safeshare.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GroupService {
    private final AuditService auditService;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final com.motasem.safeshare.repository.UserRepository userRepository;
    // --- BUSINESS LOGIC LIMITS ---
    private static final int MAX_FREE_GROUPS = 5;
    private static final int MAX_MEMBERS_PER_GROUP = 10;

    /**
     * Creates a new group, enforces the 5-group limit, and adds the creator as the Admin.
     */
    @Transactional
    public GroupEntity createGroup(String name, String description, User owner, String creatorEncryptedGroupKey) {

        // 1. Enforce the Free Tier Limit (Max 5 Groups)
        long currentGroupCount = groupRepository.countByOwner(owner);
        if (currentGroupCount >= MAX_FREE_GROUPS) {
            throw new RuntimeException("Free tier limit reached! You can only create up to " + MAX_FREE_GROUPS + " groups. Please upgrade to Pro.");
        }

        // 2. Generate a unique Invite Code (e.g., GRP-A1B2C3D4)
        String inviteCode = "GRP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 3. Create the Group Header
        GroupEntity newGroup = GroupEntity.builder()
                .name(name)
                .description(description)
                .inviteCode(inviteCode)
                .owner(owner)
                .createdAt(LocalDateTime.now())
                .build();

        // Save the group first so it gets an ID
        GroupEntity savedGroup = groupRepository.save(newGroup);

        // 4. Create the Membership Link (Make the creator the ADMIN)
        GroupMember adminMember = GroupMember.builder()
                .group(savedGroup)
                .user(owner)
                .role(GroupRole.ADMIN)
                .joinedAt(LocalDateTime.now())
                .encryptedGroupKey(creatorEncryptedGroupKey)
                .build();

        groupMemberRepository.save(adminMember);
        auditService.logEvent(savedGroup, owner.getFullName(), "Created", "Group: " + name, "info");
        return savedGroup;
    }
    // --- FETCH GROUPS ---
    public java.util.List<GroupEntity> getUserGroups(User user) {
        // Find all memberships for this user, then extract the actual groups
        return groupMemberRepository.findAllByUser(user).stream()
                .map(GroupMember::getGroup)
                .toList();
    }

    public String getUserRoleInGroup(GroupEntity group, User user) {
        return groupMemberRepository.findByGroupAndUser(group, user)
                .map(member -> member.getRole().name())
                .orElse("NONE");
    }
    @Transactional
    public void updateMemberRole(Integer groupId, Integer userId, GroupRole newRole, User actor) {
        // 1. Verify the 'actor' is an ADMIN of the group
        GroupMember requester = groupMemberRepository.findByGroupAndUser(groupRepository.findById(groupId).get(), actor)
                .orElseThrow(() -> new RuntimeException("Unauthorized"));

        if (requester.getRole() != GroupRole.ADMIN) {
            throw new RuntimeException("Only Admins can change permissions.");
        }

        // 2. Update the target user's role
        GroupMember member = groupMemberRepository.findByGroupAndUser(groupRepository.findById(groupId).get(), userRepository.findById(userId).get())
                .orElseThrow(() -> new RuntimeException("Member not found"));

        member.setRole(newRole);
        groupMemberRepository.save(member);

        // 3. Log it!
        auditService.logEvent(member.getGroup(), actor.getFullName(), "Updated Role", "User: " + member.getUser().getFullName() + " to " + newRole, "warn");
    }
    // --- JOIN GROUP LOGIC ---
    @Transactional
    public GroupEntity joinGroup(String inviteCode, User user) {
        GroupEntity group = groupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Invalid or expired invite code."));

        // 1. Check if they are already in the group
        if (groupMemberRepository.findByGroupAndUser(group, user).isPresent()) {
            throw new RuntimeException("You are already a member of this group.");
        }

        // 2. Enforce the Free Tier Member Limit (Max 10)
        long memberCount = groupMemberRepository.countByGroup(group);
        if (memberCount >= MAX_MEMBERS_PER_GROUP) {
            throw new RuntimeException("This group has reached the maximum limit of " + MAX_MEMBERS_PER_GROUP + " members.");
        }

        // 3. Add them to the group (Default role is VIEWER)
        GroupMember newMember = GroupMember.builder()
                .group(group)
                .user(user)
                .role(GroupRole.VIEWER)
                .joinedAt(LocalDateTime.now())
                .build();

        groupMemberRepository.save(newMember);
        auditService.logEvent(group, user.getFullName(), "Joined", "Group via Invite Link", "info");
        return group;
    }
}