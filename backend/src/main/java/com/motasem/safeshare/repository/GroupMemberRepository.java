package com.motasem.safeshare.repository;

import com.motasem.safeshare.model.GroupEntity;
import com.motasem.safeshare.model.GroupMember;
import com.motasem.safeshare.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Integer> {

    Optional<GroupMember> findByGroupAndUser(GroupEntity group, User user);

    long countByGroup(GroupEntity group);

    List<GroupMember> findAllByUser(User user);

    // Add this exact line to fix your error:
    List<GroupMember> findAllByGroup(GroupEntity group);

    void deleteByGroup_Id(Integer groupId);
}