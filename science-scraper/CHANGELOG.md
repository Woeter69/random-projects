# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- Refactored `scraper.py` to stop downloading PDFs and instead save paper metadata (Title, DOI, Citations, Unique ID, Link) to CSV files.
- Integrated `pandas` for better data management and CSV generation.
- Updated search functions to return structured data and improved Scopus sorting by citation count.

### Added
- Created `data/` directory for storing search result CSVs.
- Generated `search_results___microcontroller__OR__ESP32__OR__ARM_Cortex_M___A.csv` containing 26 high-quality papers.
- Generated `search_results___AI__OR__generative_AI___AND___job_displacement__.csv` containing 60 papers on AI automation and job displacement.
