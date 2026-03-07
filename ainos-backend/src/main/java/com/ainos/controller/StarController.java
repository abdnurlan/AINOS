package com.ainos.controller;

import com.ainos.model.ConstellationData;
import com.ainos.model.StarData;
import com.ainos.service.CatalogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class StarController {

    private final CatalogService catalogService;

    public StarController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/stars")
    public List<StarData> getStars() {
        return catalogService.getStars();
    }

    @GetMapping("/constellations")
    public List<ConstellationData> getConstellations() {
        return catalogService.getConstellations();
    }
}
