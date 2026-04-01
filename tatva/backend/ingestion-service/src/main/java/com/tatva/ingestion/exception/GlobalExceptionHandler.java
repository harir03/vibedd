package com.tatva.ingestion.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.Instant;
import java.util.stream.Collectors;

/**
 * Global exception handler for the Ingestion Service.
 * Returns RFC 7807 ProblemDetail responses.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, errors);
        problem.setTitle("Validation Error");
        problem.setType(URI.create("https://tatva.gov.in/errors/validation"));
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ProblemDetail handleMissingParam(MissingServletRequestParameterException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setTitle("Missing Parameter");
        problem.setType(URI.create("https://tatva.gov.in/errors/validation"));
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail handleResponseStatus(ResponseStatusException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.valueOf(ex.getStatusCode().value()),
                ex.getReason() != null ? ex.getReason() : "Request error");
        problem.setTitle("Request Error");
        problem.setType(URI.create("https://tatva.gov.in/errors/request"));
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneral(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred.");
        problem.setTitle("Internal Error");
        problem.setType(URI.create("https://tatva.gov.in/errors/internal"));
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }
}
