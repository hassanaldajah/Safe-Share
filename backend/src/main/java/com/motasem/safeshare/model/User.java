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
    private String profileImage;
    @Column(name = "theme", length = 20)
    private String theme = "system";
    @Column(name = "language", length = 10)
    private String language = "en";
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
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
