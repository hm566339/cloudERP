package com.erp.account.util;

public class Vendor {
    private String vendorCode;
    private String vendorName;
    private String gstin;
    private String address;
    private String email;
    private String mobile;
    private boolean active = true;
    private boolean blocked = false;

    public Vendor() {}

    public Vendor(String vendorCode, String vendorName, String gstin, String address, String email, String mobile, boolean active, boolean blocked) {
        this.vendorCode = vendorCode;
        this.vendorName = vendorName;
        this.gstin = gstin;
        this.address = address;
        this.email = email;
        this.mobile = mobile;
        this.active = active;
        this.blocked = blocked;
    }

    public String getVendorCode() { return vendorCode; }
    public void setVendorCode(String vendorCode) { this.vendorCode = vendorCode; }

    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }

    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isBlocked() { return blocked; }
    public void setBlocked(boolean blocked) { this.blocked = blocked; }
}
