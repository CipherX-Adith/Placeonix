package com.placeonix.controller;

import com.placeonix.entity.Application;
import com.placeonix.enums.ApplicationStatus;
import com.placeonix.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/status/{status}")
    public List<Application> getApplicationsByStatus(
            @PathVariable ApplicationStatus status) {

        return applicationService
                .getApplicationsByStatus(status);
    }

    @GetMapping("/student/{studentId}")
    public List<Application> getApplicationsByStudent(
            @PathVariable Long studentId) {

        return applicationService
                .getApplicationsByStudent(studentId);
    }

    @GetMapping("/company/{companyId}")
    public List<Application> getApplicationsByCompany(
            @PathVariable Long companyId) {

        return applicationService
                .getApplicationsByCompany(companyId);
    }

    @PutMapping("/{id}/status")
    public Application updateStatus(
            @PathVariable Long id,
            @RequestParam ApplicationStatus status) {

        return applicationService
                .updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public String deleteApplication(
            @PathVariable Long id) {

        return applicationService.deleteApplication(id);
    }
}