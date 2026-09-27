# NEXUS

## Business Intelligence & Decision Support Platform

NEXUS is a data-driven business intelligence platform that transforms CSV and Excel business data into actionable KPIs, performance analysis, operational insights, product analysis, and executive reports.

## What NEXUS Does

Users can upload business data in CSV or Excel format. NEXUS then:

- Reads and cleans the uploaded dataset
- Detects important business fields
- Calculates business KPIs
- Analyzes revenue and performance trends
- Provides product and regional analysis
- Evaluates operational performance
- Generates data-quality insights
- Creates an executive summary and business recommendations
- Stores uploaded datasets in PostgreSQL
- Allows users to restore, load, and delete saved datasets

## Main Modules

### Dashboard
Live business KPIs calculated from uploaded data.

### Business Analysis
Revenue trends, profitability, regional performance and areas worth investigating.

### Product Management
Product-level revenue, order and performance analysis.

### Operations
Delivery performance and operational monitoring.

### Project Management
Project tracking when project-related fields are available in the dataset.

### Data & Insights
Automated dataset profiling, data quality analysis and observations.

### Reports
Management-ready executive summary and recommended actions.

### Dataset History
Saved dataset management with load and delete functionality.

## Architecture

```text
CSV / Excel
     ↓
React + Vite
     ↓
Node.js + Express
     ↓
PostgreSQL
     ↓
Supabase