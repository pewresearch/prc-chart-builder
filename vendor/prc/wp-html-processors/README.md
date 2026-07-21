# wp-html-processors

PHP HTML parsing utilities that extend WordPress core’s `WP_HTML_Tag_Processor` to extract structured data from HTML produced by the block editor (and similar markup).

## Requirements

- PHP **8.2+**
- WordPress **6.2+** (provides `WP_HTML_Tag_Processor` and related APIs). This package does not bundle WordPress; treat core as a **peer/runtime** dependency.

## Install

Add a VCS repository (Composer does not host first-class PHP packages on GitHub Packages; a public GitHub repo is enough):

```json
{
  "repositories": [
    {
      "type": "vcs",
      "url": "https://github.com/pewresearch/wp-html-processors"
    }
  ],
  "require": {
    "pewresearch/wp-html-processors": "^1.0"
  }
}
```

For private repositories, configure Git authentication for Composer ([GitHub docs: working with the Composer registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-composer-registry)) or use a `github-oauth` token as usual for `composer install`.

## Usage

### Table → array

```php
use function PRC\Html\parse_table_block_into_array;

$data = parse_table_block_into_array( $table_html );
if ( is_wp_error( $data ) ) {
    // e.g. missing <thead> headers
}

// $data['header'], $data['rows'], $data['footer']
```

Block comments (`<!-- ... -->`) are stripped before parsing. Designed around `core/table` and similar table markup.

### Headings (H2–H3)

```php
use PRC\Html\HeadingProcessor;
use function PRC\Html\parse_document_for_headings;
use function PRC\Html\update_document_headings_with_ids;

$headings = parse_document_for_headings( $html );
// Each item: level, content, id

$with_ids = update_document_headings_with_ids( $html );
```

Headings with a `no-toc` attribute are skipped. The `toc-title` attribute overrides inner HTML for the stored title text when present.

### Find element by id

```php
use PRC\Html\ElementFinder;

$finder = new ElementFinder( $html, 'section', 'my-id' );
$inner  = $finder->get_markup( 'inside' ); // or 'outside'
```

## Development

```bash
composer install
composer phpcs
composer test
```

PHPUnit expects the WordPress test suite. Install it once (MySQL required):

```bash
bash bin/install-wp-tests.sh wordpress_test root '' 127.0.0.1 latest
```

Then run `vendor/bin/phpunit`. CI runs the same installer on GitHub Actions with MySQL 8.

## License

GPL-2.0-or-later. See [LICENSE](LICENSE).
