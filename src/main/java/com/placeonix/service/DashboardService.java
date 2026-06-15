package com.placeonix.service;

import com.placeonix.enums.ApplicationStatus;
import com.placeonix.repository.ApplicationRepository;
import com.placeonix.repository.CompanyRepository;
import com.placeonix.repository.JobRepository;
import com.placeonix.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    public Long getTotalStudents() {

        return studentRepository.count();
    }

    public Long getTotalCompanies() {

        return companyRepository.count();
    }

    public Long getTotalJobs() {

        return jobRepository.count();
    }

    public Long getTotalApplications() {

        return applicationRepository.count();
    }

    public Long getSelectedStudents() {

        return (long)
                applicationRepository
                        .findByStatus(
                                ApplicationStatus.SELECTED)
                        .size();
    }
}