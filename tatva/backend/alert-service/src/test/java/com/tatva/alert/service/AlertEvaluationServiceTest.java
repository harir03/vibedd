package com.tatva.alert.service;

import com.tatva.alert.model.AlertEvent;
import com.tatva.alert.repository.AlertEventRepository;
import com.tatva.alert.service.impl.AlertEvaluationServiceImpl;
import com.tatva.alert.websocket.AlertBroadcaster;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertEvaluationServiceTest {

    @Mock
    private AlertEventRepository eventRepository;

    @Mock
    private AlertBroadcaster broadcaster;

    private AlertEvaluationServiceImpl evaluationService;

    @BeforeEach
    void setUp() {
        evaluationService = new AlertEvaluationServiceImpl(eventRepository, broadcaster);
    }

    @Test
    @DisplayName("Evaluate creates alert event and broadcasts via WebSocket")
    void evaluateCreatesAndBroadcasts() {
        when(eventRepository.findByAlertTypeAndFiredAtAfterOrderByFiredAtDesc(anyString(), any()))
                .thenReturn(Collections.emptyList());

        AlertEvent saved = new AlertEvent();
        saved.setId(1L);
        saved.setAlertType("ENTITY_ALERT");
        saved.setTitle("Test Alert");
        saved.setPriority("INFO");
        saved.setStatus("NEW");
        saved.setEntityIds("[\"e1\"]");
        saved.setMetadata("{}");
        saved.setFiredAt(Instant.now());

        when(eventRepository.save(any(AlertEvent.class))).thenReturn(saved);

        AlertEvent result = evaluationService.evaluate(
                "ENTITY_ALERT", "Test Alert", "Description", "[\"e1\"]", "{}");

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(eventRepository).save(any(AlertEvent.class));
        verify(broadcaster).broadcast(saved);
    }

    @Test
    @DisplayName("Alert clustering suppresses duplicate alerts within window")
    void clusteringSuppressesDuplicates() {
        // Simulate an existing alert with same type and entityIds in the last 30 minutes
        AlertEvent existing = new AlertEvent();
        existing.setId(1L);
        existing.setAlertType("ENTITY_ALERT");
        existing.setEntityIds("[\"e1\"]");
        existing.setFiredAt(Instant.now().minus(10, ChronoUnit.MINUTES));

        when(eventRepository.findByAlertTypeAndFiredAtAfterOrderByFiredAtDesc(
                eq("ENTITY_ALERT"), any(Instant.class)))
                .thenReturn(List.of(existing));

        AlertEvent result = evaluationService.evaluate(
                "ENTITY_ALERT", "Duplicate Alert", "Description", "[\"e1\"]", "{}");

        assertNull(result, "Clustered alert should be suppressed (null)");
        verify(eventRepository, never()).save(any());
        verify(broadcaster, never()).broadcast(any());
    }

    @Test
    @DisplayName("Different entityIds are not clustered")
    void differentEntitiesNotClustered() {
        AlertEvent existing = new AlertEvent();
        existing.setAlertType("ENTITY_ALERT");
        existing.setEntityIds("[\"e1\"]");
        existing.setFiredAt(Instant.now().minus(5, ChronoUnit.MINUTES));

        when(eventRepository.findByAlertTypeAndFiredAtAfterOrderByFiredAtDesc(
                eq("ENTITY_ALERT"), any(Instant.class)))
                .thenReturn(List.of(existing));

        AlertEvent saved = new AlertEvent();
        saved.setId(2L);
        saved.setAlertType("ENTITY_ALERT");
        saved.setEntityIds("[\"e2\"]");
        saved.setFiredAt(Instant.now());
        when(eventRepository.save(any())).thenReturn(saved);

        AlertEvent result = evaluationService.evaluate(
                "ENTITY_ALERT", "Different Entity", "Desc", "[\"e2\"]", "{}");

        assertNotNull(result, "Different entities should NOT be clustered");
        verify(eventRepository).save(any());
    }

    @Test
    @DisplayName("ANOMALY_ALERT gets WARNING priority")
    void anomalyAlertGetsWarningPriority() {
        when(eventRepository.findByAlertTypeAndFiredAtAfterOrderByFiredAtDesc(anyString(), any()))
                .thenReturn(Collections.emptyList());

        AlertEvent saved = new AlertEvent();
        saved.setId(3L);
        saved.setAlertType("ANOMALY_ALERT");
        saved.setPriority("WARNING");
        saved.setTitle("Anomaly");
        saved.setFiredAt(Instant.now());
        when(eventRepository.save(any())).thenReturn(saved);

        evaluationService.evaluate("ANOMALY_ALERT", "Anomaly", "Desc", "[]", "{}");

        ArgumentCaptor<AlertEvent> captor = ArgumentCaptor.forClass(AlertEvent.class);
        verify(eventRepository).save(captor.capture());
        assertEquals("WARNING", captor.getValue().getPriority());
    }

    @Test
    @DisplayName("THRESHOLD_ALERT gets CRITICAL priority")
    void thresholdAlertGetsCriticalPriority() {
        when(eventRepository.findByAlertTypeAndFiredAtAfterOrderByFiredAtDesc(anyString(), any()))
                .thenReturn(Collections.emptyList());

        AlertEvent saved = new AlertEvent();
        saved.setId(4L);
        saved.setAlertType("THRESHOLD_ALERT");
        saved.setPriority("CRITICAL");
        saved.setTitle("Threshold Breach");
        saved.setFiredAt(Instant.now());
        when(eventRepository.save(any())).thenReturn(saved);

        evaluationService.evaluate("THRESHOLD_ALERT", "Threshold Breach", "Desc", "[]", "{}");

        ArgumentCaptor<AlertEvent> captor = ArgumentCaptor.forClass(AlertEvent.class);
        verify(eventRepository).save(captor.capture());
        assertEquals("CRITICAL", captor.getValue().getPriority());
    }

    @Test
    @DisplayName("ENTITY_ALERT gets INFO priority")
    void entityAlertGetsInfoPriority() {
        when(eventRepository.findByAlertTypeAndFiredAtAfterOrderByFiredAtDesc(anyString(), any()))
                .thenReturn(Collections.emptyList());

        AlertEvent saved = new AlertEvent();
        saved.setId(5L);
        saved.setAlertType("ENTITY_ALERT");
        saved.setPriority("INFO");
        saved.setTitle("Entity Update");
        saved.setFiredAt(Instant.now());
        when(eventRepository.save(any())).thenReturn(saved);

        evaluationService.evaluate("ENTITY_ALERT", "Entity Update", "Desc", "[]", "{}");

        ArgumentCaptor<AlertEvent> captor = ArgumentCaptor.forClass(AlertEvent.class);
        verify(eventRepository).save(captor.capture());
        assertEquals("INFO", captor.getValue().getPriority());
    }

    @Test
    @DisplayName("isDuplicate returns false when no recent alerts")
    void isDuplicateReturnsFalseWhenEmpty() {
        when(eventRepository.findByAlertTypeAndFiredAtAfterOrderByFiredAtDesc(anyString(), any()))
                .thenReturn(Collections.emptyList());

        assertFalse(evaluationService.isDuplicate("ENTITY_ALERT", "[\"e1\"]", 30));
    }

    @Test
    @DisplayName("isDuplicate returns true when matching recent alert exists")
    void isDuplicateReturnsTrueWhenMatch() {
        AlertEvent existing = new AlertEvent();
        existing.setAlertType("ENTITY_ALERT");
        existing.setEntityIds("[\"e1\"]");
        existing.setFiredAt(Instant.now().minus(5, ChronoUnit.MINUTES));

        when(eventRepository.findByAlertTypeAndFiredAtAfterOrderByFiredAtDesc(
                eq("ENTITY_ALERT"), any()))
                .thenReturn(List.of(existing));

        assertTrue(evaluationService.isDuplicate("ENTITY_ALERT", "[\"e1\"]", 30));
    }
}
