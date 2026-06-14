package com.placeonix.service;

import com.placeonix.entity.Company;
import com.placeonix.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    public Company addCompany(Company company) {
        return companyRepository.save(company);
    }

    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    public Company getCompanyById(Long id) {

        return companyRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Company Not Found"));
    }

    public Company updateCompany(Long id, Company updatedCompany) {

        Company company = companyRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Company Not Found"));

        company.setCompanyName(updatedCompany.getCompanyName());
        company.setIndustry(updatedCompany.getIndustry());
        company.setLocation(updatedCompany.getLocation());
        company.setWebsite(updatedCompany.getWebsite());
        company.setHrEmail(updatedCompany.getHrEmail());
        company.setDescription(updatedCompany.getDescription());
        company.setMinimumCgpa(updatedCompany.getMinimumCgpa());
        company.setPackageOffered(updatedCompany.getPackageOffered());

        return companyRepository.save(company);
    }

    public String deleteCompany(Long id) {

        companyRepository.deleteById(id);

        return "Company Deleted Successfully";
    }
}