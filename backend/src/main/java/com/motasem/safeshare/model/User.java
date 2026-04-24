package com.motasem.safeshare.model;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="_user")
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(unique = true,nullable = false,updatable = false)
    private String searchTag;

    @Column(unique = true,nullable = false)
    private String email;
    @Column(nullable = false)
    private String password;
    @Column
    private String fullName;
    @Column(columnDefinition = "TEXT")
    private String encryptedPrivateKey;
    @Column(columnDefinition = "TEXT")
    private String publicKey;
    @Column(columnDefinition = "TEXT")
    private String keySalt;
    @Column(columnDefinition = "TEXT")
    private String keyIv;
    @Column(name = "otp_code")
    private String otpCode;
    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry;
    @Column(columnDefinition = "TEXT")
    private String profilePictureUrl;
    @Column(name = "theme", length = 20)
    private String theme = "system";
    @Column(name = "language", length = 10)
    private String language = "en";

    // ── Brute-force / Account Lockout ─────────────────────────────────────────
    @Column(name = "failed_attempt_count", nullable = false)
    @Builder.Default
    private int failedAttemptCount = 0;

    /** true = account is accessible; false = temporarily locked */
    @Column(name = "account_non_locked", nullable = false)
    @Builder.Default
    private boolean accountNonLocked = true;

    /** The moment the account was locked; null when unlocked */
    @Column(name = "lock_time")
    private LocalDateTime lockTime;
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }
    @Override
    public boolean isCredentialsNonExpired(){
        return true;
    }
    @Override
    public boolean isEnabled(){
        return true;
    }
}
