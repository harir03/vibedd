package com.tatva.alert.service;

import com.tatva.alert.dto.AlertEventResponse;
import com.tatva.alert.dto.AlertRuleRequest;
import com.tatva.alert.dto.AlertRuleResponse;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface AlertService {

    AlertRuleResponse createRule(AlertRuleRequest request);

    List<AlertRuleResponse> listRules(UUID userId);

    void deleteRule(UUID ruleId);

    Page<AlertEventResponse> getEvents(String status, int page, int size);

    AlertEventResponse acknowledgeEvent(Long eventId, UUID userId);
}
