package com.placeonix.service;

import com.placeonix.entity.Job;
import com.placeonix.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    public Job addJob(Job job) {
        return jobRepository.save(job);
    }

    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    public Job getJobById(Long id) {

        return jobRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Job Not Found"));
    }

    public Job updateJob(Long id, Job updatedJob) {

        Job job = jobRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Job Not Found"));

        job.setJobTitle(updatedJob.getJobTitle());
        job.setJobDescription(updatedJob.getJobDescription());
        job.setLocation(updatedJob.getLocation());
        job.setJobType(updatedJob.getJobType());
        job.setSalaryPackage(updatedJob.getSalaryPackage());
        job.setMinimumCgpa(updatedJob.getMinimumCgpa());
        job.setApplicationDeadline(updatedJob.getApplicationDeadline());
        job.setCompany(updatedJob.getCompany());

        return jobRepository.save(job);
    }

    public String deleteJob(Long id) {

        jobRepository.deleteById(id);

        return "Job Deleted Successfully";
    }
}