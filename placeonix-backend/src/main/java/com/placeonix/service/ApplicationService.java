package com.placeonix.service;

import com.placeonix.entity.Application;
import com.placeonix.enums.ApplicationStatus;
import com.placeonix.exception.DuplicateApplicationException;
import com.placeonix.repository.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    public Application apply(Application application) {

        Long studentId =
                application.getStudent().getId();

        Long jobId =
                application.getJob().getId();

        if (applicationRepository
                .existsByStudentIdAndJobId(
                        studentId,
                        jobId)) {

            throw new DuplicateApplicationException(
                    "You have already applied for this job");
        }

        return applicationRepository.save(application);
    }

    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }

    public Application getApplicationById(Long id) {

        return applicationRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Application Not Found"));
    }

    public List<Application> getApplicationsByStatus(
            ApplicationStatus status) {

        return applicationRepository
                .findByStatus(status);
    }

    public List<Application> getApplicationsByStudent(
            Long studentId) {

        return applicationRepository
                .findByStudentId(studentId);
    }

    public List<Application> getApplicationsByCompany(
            Long companyId) {

        return applicationRepository
                .findByJobCompanyId(companyId);
    }

    public Application updateStatus(
            Long applicationId,
            ApplicationStatus status) {

        Application application =
                applicationRepository.findById(applicationId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Application Not Found"));

        application.setStatus(status);

        return applicationRepository.save(application);
    }

    public String deleteApplication(Long id) {

        applicationRepository.deleteById(id);

        return "Application Deleted Successfully";
    }
}