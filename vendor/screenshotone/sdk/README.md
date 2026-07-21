# phpsdk

[![Build](https://github.com/screenshotone/phpsdk/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/screenshotone/phpsdk/actions/workflows/build.yml)
[![Total Downloads](https://img.shields.io/packagist/dt/screenshotone/sdk.svg?style=flat-square)](https://packagist.org/packages/screenshotone/sdk)

An official [Screenshot API](https://screenshotone.com/) client for PHP.

It takes minutes to start taking screenshots. Just [sign up](https://screenshotone.com/) to get access and secret keys, import the client, and you are ready to go.

The SDK client is synchronized with the latest [screenshot API options](https://screenshotone.com/docs/options/).

## Installation

```shell
composer require screenshotone/sdk:^1.0
```

## Usage

Generate a screenshot URL without executing the request. Or download the screenshot. It is up to you:

```php
<?php

// If you don't use Composer in your project, please, read https://getcomposer.org/doc/01-basic-usage.md#autoloading.
// You need the Composer autoloader to use the API SDK.

// ...

use ScreenshotOne\Sdk\Client;
use ScreenshotOne\Sdk\TakeOptions;

$client = new Client('<your access key>', '<your secret key>');

$options = TakeOptions::url("https://example.com")
    ->fullPage(true)
    ->delay(2)
    ->geolocationLatitude(48.857648)
    ->geolocationLongitude(2.294677)
    ->geolocationAccuracy(50);

$url = $client->generateTakeUrl($options);
echo $url.PHP_EOL;
// expected output: https://api.screenshotone.com/take?url=https%3A%2F%2Fexample.com...

$image = $client->take($options);
file_put_contents('example.png', $image);
```

## Tests

Run:

```
$ composer run-script tests
```

Or:

```
$ vendor/bin/phpunit
```

## License

`screenshotone/phpsdk` is released under [the MIT license](LICENSE).
