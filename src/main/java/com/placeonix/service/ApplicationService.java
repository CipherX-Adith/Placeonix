package com.placeonix.service;

import com.placeonix.entity.Application;
import com.placeonix.repository.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    public Application apply(Application application) {
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

    public String deleteApplication(Long id) {

        applicationRepository.deleteById(id);

        return "Application Deleted Successfully";
    }
}