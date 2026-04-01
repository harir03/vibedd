package com.tatva.gateway.repository;

import com.tatva.gateway.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for the users table.
 * Used by the gateway exclusively for authentication.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsernameAndIsActiveTrue(String username);

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);
}
