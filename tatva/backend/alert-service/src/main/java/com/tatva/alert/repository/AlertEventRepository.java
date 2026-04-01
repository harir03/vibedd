package com.tatva.alert.repository;

import com.tatva.alert.model.AlertEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AlertEventRepository extends JpaRepository<AlertEvent, Long> {

    Page<AlertEvent> findAllByOrderByFiredAtDesc(Pageable pageable);

    Page<AlertEvent> findByStatusOrderByFiredAtDesc(String status, Pageable pageable);

    List<AlertEvent> findByAlertTypeAndFiredAtAfterOrderByFiredAtDesc(String alertType, Instant since);

    long countByStatusAndFiredAtAfter(String status, Instant since);
}
