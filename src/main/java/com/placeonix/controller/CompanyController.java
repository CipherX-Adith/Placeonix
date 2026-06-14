package com.placeonix.controller;

import com.placeonix.entity.Company;
import com.placeonix.service.CompanyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    @Autowired
    private CompanyService companyService;

    @PostMapping
    public Company addCompany(
            @RequestBody Company company) {

        return companyService.addCompany(company);
    }

    @GetMapping
    public List<Company> getAllCompanies() {

        return companyService.getAllCompanies();
    }

    @GetMapping("/{id}")
    public Company getCompanyById(
            @PathVariable Long id) {

        return companyService.getCompanyById(id);
    }

    @PutMapping("/{id}")
    public Company updateCompany(
            @PathVariable Long id,
            @RequestBody Company company) {

        return companyService.updateCompany(id, company);
    }

    @DeleteMapping("/{id}")
    public String deleteCompany(
            @PathVariable Long id) {

        return companyService.deleteCompany(id);
    }
}