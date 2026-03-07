package com.ainos.model;

import java.util.List;

public record ConstellationData(
    String name,
    String abbr,
    List<int[]> lines
) {}
