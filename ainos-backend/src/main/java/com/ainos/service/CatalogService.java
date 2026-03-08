package com.ainos.service;

import com.ainos.model.ConstellationData;
import com.ainos.model.DSOData;
import com.ainos.model.StarData;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class CatalogService {

    private List<StarData> stars = Collections.emptyList();
    private List<ConstellationData> constellations = Collections.emptyList();
    private List<DSOData> dsoObjects = Collections.emptyList();
    private List<DSOData> messierObjects = Collections.emptyList();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void loadCatalogs() {
        stars = loadJson("data/stars.json", new TypeReference<>() {});
        constellations = loadJson("data/constellations.json", new TypeReference<>() {});
        dsoObjects = loadJsonOptional("data/dso.json", new TypeReference<>() {});
        messierObjects = loadJsonOptional("data/messier.json", new TypeReference<>() {});
    }

    public List<StarData> getStars() {
        return stars;
    }

    public List<ConstellationData> getConstellations() {
        return constellations;
    }

    public List<DSOData> getDsoObjects() {
        return dsoObjects;
    }

    public List<DSOData> getMessierObjects() {
        return messierObjects;
    }

    private <T> T loadJson(String path, TypeReference<T> typeRef) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            try (InputStream is = resource.getInputStream()) {
                return objectMapper.readValue(is, typeRef);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to load catalog: " + path, e);
        }
    }

    private <T extends List<?>> T loadJsonOptional(String path, TypeReference<T> typeRef) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            if (!resource.exists()) {
                return (T) Collections.emptyList();
            }
            try (InputStream is = resource.getInputStream()) {
                return objectMapper.readValue(is, typeRef);
            }
        } catch (IOException e) {
            System.err.println("Warning: Could not load optional catalog: " + path);
            return (T) Collections.emptyList();
        }
    }
}
