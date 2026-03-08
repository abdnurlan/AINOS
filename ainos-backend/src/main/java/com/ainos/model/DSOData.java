package com.ainos.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DSOData {
    private String id;
    private String name;
    private Integer messier;
    private String displayName;
    private String type;
    private Double ra;
    private Double dec;
    private Double mag;
    private Double majorAxis;
    private Double minorAxis;
    private String constellation;
    private String commonName;
    private Double surfaceBrightness;
    private String hubbleType;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getMessier() { return messier; }
    public void setMessier(Integer messier) { this.messier = messier; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Double getRa() { return ra; }
    public void setRa(Double ra) { this.ra = ra; }

    public Double getDec() { return dec; }
    public void setDec(Double dec) { this.dec = dec; }

    public Double getMag() { return mag; }
    public void setMag(Double mag) { this.mag = mag; }

    public Double getMajorAxis() { return majorAxis; }
    public void setMajorAxis(Double majorAxis) { this.majorAxis = majorAxis; }

    public Double getMinorAxis() { return minorAxis; }
    public void setMinorAxis(Double minorAxis) { this.minorAxis = minorAxis; }

    public String getConstellation() { return constellation; }
    public void setConstellation(String constellation) { this.constellation = constellation; }

    public String getCommonName() { return commonName; }
    public void setCommonName(String commonName) { this.commonName = commonName; }

    public Double getSurfaceBrightness() { return surfaceBrightness; }
    public void setSurfaceBrightness(Double surfaceBrightness) { this.surfaceBrightness = surfaceBrightness; }

    public String getHubbleType() { return hubbleType; }
    public void setHubbleType(String hubbleType) { this.hubbleType = hubbleType; }
}
