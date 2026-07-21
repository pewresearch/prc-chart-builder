# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial extraction as `pewresearch/wp-html-processors`.
- `PRC\Html\TableProcessor`, `HeadingProcessor`, and `ElementFinder` (namespaced successors to the former `WP_HTML_*` classes).
- Procedural helpers: `parse_table_block_into_array()`, `parse_document_for_headings()`, `update_document_headings_with_ids()`.
- Composer PSR-4 autoloading and PHPUnit + PHPCS tooling.

<!-- After tagging v1.0.0, add compare links here. -->
