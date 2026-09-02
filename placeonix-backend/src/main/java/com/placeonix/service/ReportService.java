package com.placeonix.service;

import com.placeonix.entity.Application;
import com.placeonix.enums.ApplicationStatus;
import com.placeonix.repository.ApplicationRepository;
import com.placeonix.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private StudentRepository studentRepository;

    public Map<String, Long> getStatusSummary() {

        Map<String, Long> summary = new HashMap<>();

        summary.put(
                "APPLIED",
                (long) applicationRepository
                        .findByStatus(
                                ApplicationStatus.APPLIED)
                        .size());

        summary.put(
                "SHORTLISTED",
                (long) applicationRepository
                        .findByStatus(
                                ApplicationStatus.SHORTLISTED)
                        .size());

        summary.put(
                "INTERVIEW_SCHEDULED",
                (long) applicationRepository
                        .findByStatus(
                                ApplicationStatus.INTERVIEW_SCHEDULED)
                        .size());

        summary.put(
                "SELECTED",
                (long) applicationRepository
                        .findByStatus(
                                ApplicationStatus.SELECTED)
                        .size());

        summary.put(
                "REJECTED",
                (long) applicationRepository
                        .findByStatus(
                                ApplicationStatus.REJECTED)
                        .size());

        return summary;
    }

    public Long getSelectedStudents() {

        return (long)
                applicationRepository
                        .findByStatus(
                                ApplicationStatus.SELECTED)
                        .size();
    }

    public Double getPlacementPercentage() {

        long totalStudents =
                studentRepository.count();

        long selectedStudents =
                getSelectedStudents();

        if (totalStudents == 0) {
            return 0.0;
        }

        return (selectedStudents * 100.0)
                / totalStudents;
    }

    public Map<String, Long> getCompanyWiseHires() {

        Map<String, Long> report = new HashMap<>();

        List<Application> selectedApplications =
                applicationRepository.findByStatus(
                        ApplicationStatus.SELECTED);

        for (Application application
                : selectedApplications) {

            String companyName =
                    application.getJob()
                            .getCompany()
                            .getCompanyName();

            report.put(
                    companyName,
                    report.getOrDefault(
                            companyName,
                            0L
                    ) + 1
            );
        }

        return report;
    }

    public Map<String, Long> getJobWiseApplications() {

        Map<String, Long> report = new HashMap<>();

        List<Application> applications =
                applicationRepository.findAll();

        for (Application application
                : applications) {

            String jobTitle =
                    application.getJob()
                            .getJobTitle();

            report.put(
                    jobTitle,
                    report.getOrDefault(
                            jobTitle,
                            0L
                    ) + 1
            );
        }

        return report;
    }
}