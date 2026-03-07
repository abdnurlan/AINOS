package com.ainos.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record StarData(
    int hip,
    String name,
    double ra,
    double dec,
    double mag,
    String spectral,
    String constellation,
    String bayer
) {}
