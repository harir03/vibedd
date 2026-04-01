package com.tatva.alert.repository;

import com.tatva.alert.model.AlertRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AlertRuleRepository extends JpaRepository<AlertRule, UUID> {

    List<AlertRule> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<AlertRule> findByActiveTrue();

    List<AlertRule> findByAlertTypeAndActiveTrue(String alertType);
}
