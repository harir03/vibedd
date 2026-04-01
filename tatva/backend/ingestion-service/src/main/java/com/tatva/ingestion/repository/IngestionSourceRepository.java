package com.tatva.ingestion.repository;

import com.tatva.ingestion.model.IngestionSource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for ingestion source CRUD.
 */
public interface IngestionSourceRepository extends JpaRepository<IngestionSource, UUID> {

    List<IngestionSource> findByActiveTrue();

    List<IngestionSource> findByDomain(String domain);
}
