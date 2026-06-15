package com.placeonix.controller;

import com.placeonix.entity.Application;
import com.placeonix.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.placeonix.enums.ApplicationStatus;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @PostMapping
    public Application apply(
            @RequestBody Application application) {

        return applicationService.apply(application);
    }

    @GetMapping
    public List<Application> getAllApplications() {

        return applicationService.getAllApplications();
    }

    @GetMapping("/{id}")
    public Application getApplicationById(
            @PathVariable Long id) {

        return applicationService.getApplicationById(id);
    }

    @DeleteMapping("/{id}")
    public String deleteApplication(
            @PathVariable Long id) {

        return applicationService.deleteApplication(id);
    }
    @PutMapping("/{id}/status")
    public Application updateStatus(
            @PathVariable Long id,
            @RequestParam ApplicationStatus status) {

        return applicationService
                .updateStatus(id, status);
    }
}