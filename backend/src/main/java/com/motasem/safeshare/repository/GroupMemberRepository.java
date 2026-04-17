package com.motasem.safeshare.repository;

import com.motasem.safeshare.model.GroupEntity;
import com.motasem.safeshare.model.GroupMember;
import com.motasem.safeshare.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Integer> {
    List<GroupMember> findAllByUser(User user); // For the "Group Hub" list
    long countByGroup(GroupEntity group); // Used to check the 10-member limit
    Optional<GroupMember> findByGroupAndUser(GroupEntity group, User user);
}