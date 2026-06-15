package com.placeonix.controller;

import com.placeonix.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/status-summary")
    public Map<String, Long> getStatusSummary() {

        return reportService.getStatusSummary();
    }

    @GetMapping("/selected-students")
    public Long getSelectedStudents() {

        return reportService.getSelectedStudents();
    }

    @GetMapping("/placement-percentage")
    public Double getPlacementPercentage() {

        return reportService.getPlacementPercentage();
    }

    @GetMapping("/company-wise-hires")
    public Map<String, Long>
    getCompanyWiseHires() {

        return reportService
                .getCompanyWiseHires();
    }

    @GetMapping("/job-wise-applications")
    public Map<String, Long>
    getJobWiseApplications() {

        return reportService
                .getJobWiseApplications();
    }
}