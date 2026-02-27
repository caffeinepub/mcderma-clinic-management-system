# Go-Live Deployment Guide

This guide provides step-by-step instructions for deploying the McDerma Clinic Management application to the Internet Computer mainnet.

## Prerequisites

Before deploying to mainnet, ensure you have:

1. **DFX installed** - Version 0.15.0 or later
2. **Cycles wallet** - With sufficient cycles for deployment (at least 2-3 trillion cycles recommended)
3. **Internet Identity** - For authentication on mainnet
4. **Production build tested** - Verify the application works correctly in local deployment

## Pre-Deployment Checklist

- [ ] All features tested locally with `dfx start` and `dfx deploy`
- [ ] User authentication flow verified with Internet Identity
- [ ] Core workflows tested: patients, appointments, leads management
- [ ] Data export/import functionality verified
- [ ] PWA features (offline mode, notifications) tested
- [ ] No console errors in browser developer tools

## Deployment Steps

### 1. Verify Network Connection

Check your connection to the Internet Computer mainnet:

