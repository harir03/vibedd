package com.tatva.ingestion.repository;

import com.tatva.ingestion.model.IngestionRun;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for ingestion run history.
 */
public interface IngestionRunRepository extends JpaRepository<IngestionRun, UUID> {

    List<IngestionRun> findBySourceIdOrderByStartedAtDesc(UUID sourceId, Pageable pageable);

    List<IngestionRun> findAllByOrderByStartedAtDesc(Pageable pageable);
}
