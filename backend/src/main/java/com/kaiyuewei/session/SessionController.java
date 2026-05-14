package com.kaiyuewei.session;

import com.kaiyuewei.customer.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/v1/sessions")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    public ResponseEntity<SessionCreateResponse> createSession(
            @AuthenticationPrincipal Customer customer) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sessionService.createSession(customer));
    }

    @PatchMapping("{id}/recorded")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRecorded(@PathVariable Long id,
                             @RequestBody(required = false) MarkRecordedRequest request,
                             @AuthenticationPrincipal Customer customer) {
        Integer duration = request == null ? null : request.durationSeconds();
        sessionService.markRecorded(id, customer, duration);
    }

    @PutMapping("{id}/audio")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void uploadAudio(@PathVariable Long id,
                            @RequestBody byte[] audio,
                            @AuthenticationPrincipal Customer customer) {
        sessionService.uploadAudio(id, audio, customer);
    }

    @GetMapping
    public Page<SessionSummaryDto> getSessions(
            @AuthenticationPrincipal Customer customer,
            Pageable pageable) {
        return sessionService.getUserSessions(customer, pageable);
    }

    @GetMapping("{id}")
    public SessionDetailDto getSessionDetail(@PathVariable Long id,
                                             @AuthenticationPrincipal Customer customer) {
        return sessionService.getSessionDetail(id, customer);
    }
}
