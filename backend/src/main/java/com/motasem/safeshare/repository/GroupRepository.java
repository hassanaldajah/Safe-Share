package com.motasem.safeshare.repository;

import com.motasem.safeshare.model.GroupEntity;
import com.motasem.safeshare.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GroupRepository extends JpaRepository<GroupEntity, Integer> {
    long countByOwner(User owner); // Used to check the 5-group limit
    Optional<GroupEntity> findByInviteCode(String inviteCode);
}