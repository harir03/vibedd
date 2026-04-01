package com.tatva.graph.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for the Graph Service.
 * Returns RFC 7807 ProblemDetail responses.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "Validation failed");
        problem.setTitle("Validation Error");
        problem.setType(URI.create("about:blank"));
        problem.setProperty("errors", fieldErrors);
        return problem;
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail handleResponseStatusException(ResponseStatusException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.valueOf(ex.getStatusCode().value()), ex.getReason());
        problem.setTitle(HttpStatus.valueOf(ex.getStatusCode().value()).getReasonPhrase());
        problem.setType(URI.create("about:blank"));
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenericException(Exception ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
        problem.setTitle("Internal Server Error");
        problem.setType(URI.create("about:blank"));
        return problem;
    }
}
