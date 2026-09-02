package com.placeonix.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "companies")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String companyName;

    private String industry;

    private String location;

    private String website;

    @Column(unique = true)
    private String hrEmail;

    @Column(length = 1000)
    private String description;

    private Double minimumCgpa;

    private Double packageOffered;

    public Company() {
    }

    public Company(Long id,
                   String companyName,
                   String industry,
                   String location,
                   String website,
                   String hrEmail,
                   String description,
                   Double minimumCgpa,
                   Double packageOffered) {

        this.id = id;
        this.companyName = companyName;
        this.industry = industry;
        this.location = location;
        this.website = website;
        this.hrEmail = hrEmail;
        this.description = description;
        this.minimumCgpa = minimumCgpa;
        this.packageOffered = packageOffered;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getHrEmail() {
        return hrEmail;
    }

    public void setHrEmail(String hrEmail) {
        this.hrEmail = hrEmail;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getMinimumCgpa() {
        return minimumCgpa;
    }

    public void setMinimumCgpa(Double minimumCgpa) {
        this.minimumCgpa = minimumCgpa;
    }

    public Double getPackageOffered() {
        return packageOffered;
    }

    public void setPackageOffered(Double packageOffered) {
        this.packageOffered = packageOffered;
    }
}