package com.placeonix.controller;

import com.placeonix.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping
    public Map<String, Long> getDashboardStats() {

        Map<String, Long> stats = new HashMap<>();

        stats.put(
                "totalStudents",
                dashboardService.getTotalStudents());

        stats.put(
                "totalCompanies",
                dashboardService.getTotalCompanies());

        stats.put(
                "totalJobs",
                dashboardService.getTotalJobs());

        stats.put(
                "totalApplications",
                dashboardService.getTotalApplications());

        stats.put(
                "selectedStudents",
                dashboardService.getSelectedStudents());

        return stats;
    }
}