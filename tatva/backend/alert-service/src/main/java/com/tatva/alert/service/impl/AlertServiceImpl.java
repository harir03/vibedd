package com.tatva.alert.service.impl;

import com.tatva.alert.dto.AlertEventResponse;
import com.tatva.alert.dto.AlertRuleRequest;
import com.tatva.alert.dto.AlertRuleResponse;
import com.tatva.alert.model.AlertEvent;
import com.tatva.alert.model.AlertRule;
import com.tatva.alert.repository.AlertEventRepository;
import com.tatva.alert.repository.AlertRuleRepository;
import com.tatva.alert.service.AlertService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AlertServiceImpl implements AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertServiceImpl.class);

    private final AlertRuleRepository ruleRepository;
    private final AlertEventRepository eventRepository;

    public AlertServiceImpl(AlertRuleRepository ruleRepository,
                            AlertEventRepository eventRepository) {
        this.ruleRepository = ruleRepository;
        this.eventRepository = eventRepository;
    }

    @Override
    public AlertRuleResponse createRule(AlertRuleRequest request) {
        AlertRule rule = new AlertRule();
        rule.setUserId(request.userId());
        rule.setName(request.name());
        rule.setAlertType(request.alertType());
        rule.setConditions(request.conditions() != null ? request.conditions() : "{}");
        rule.setChannels(request.channels() != null ? request.channels() : "[\"DASHBOARD\"]");
        rule.setPriority(request.priority() != null ? request.priority() : "INFO");

        AlertRule saved = ruleRepository.save(rule);
        log.info("Alert rule created: id={}, name={}, type={}", saved.getId(), saved.getName(), saved.getAlertType());
        return toRuleResponse(saved);
    }

    @Override
    public List<AlertRuleResponse> listRules(UUID userId) {
        return ruleRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toRuleResponse)
                .toList();
    }

    @Override
    public void deleteRule(UUID ruleId) {
        if (!ruleRepository.existsById(ruleId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Alert rule not found: " + ruleId);
        }
        ruleRepository.deleteById(ruleId);
        log.info("Alert rule deleted: id={}", ruleId);
    }

    @Override
    public Page<AlertEventResponse> getEvents(String status, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<AlertEvent> events;
        if (status != null && !status.isBlank()) {
            events = eventRepository.findByStatusOrderByFiredAtDesc(status, pageRequest);
        } else {
            events = eventRepository.findAllByOrderByFiredAtDesc(pageRequest);
        }
        return events.map(this::toEventResponse);
    }

    @Override
    public AlertEventResponse acknowledgeEvent(Long eventId, UUID userId) {
        AlertEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Alert event not found: " + eventId));

        event.setStatus("ACKNOWLEDGED");
        event.setAcknowledgedBy(userId);
        event.setAcknowledgedAt(Instant.now());

        AlertEvent saved = eventRepository.save(event);
        log.info("Alert event acknowledged: id={}, by={}", eventId, userId);
        return toEventResponse(saved);
    }

    private AlertRuleResponse toRuleResponse(AlertRule rule) {
        return new AlertRuleResponse(
                rule.getId(),
                rule.getUserId(),
                rule.getName(),
                rule.getAlertType(),
                rule.getConditions(),
                rule.getChannels(),
                rule.getPriority(),
                rule.isActive(),
                rule.getCreatedAt(),
                rule.getUpdatedAt()
        );
    }

    private AlertEventResponse toEventResponse(AlertEvent event) {
        return new AlertEventResponse(
                event.getId(),
                event.getRuleId(),
                event.getAlertType(),
                event.getPriority(),
                event.getTitle(),
                event.getDescription(),
                event.getEntityIds(),
                event.getStatus(),
                event.getAcknowledgedBy(),
                event.getAcknowledgedAt(),
                event.getFiredAt(),
                event.getMetadata()
        );
    }
}
