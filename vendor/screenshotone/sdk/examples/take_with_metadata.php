<?php

require_once __DIR__ . '/../vendor/autoload.php';

use ScreenshotOne\Sdk\Client;
use ScreenshotOne\Sdk\TakeOptions;

$accessKey = '<your access key>';
$secretKey = '<your secret key>';

$client = new Client($accessKey, $secretKey);
$options = TakeOptions::url('https://screenshotone.com')
    ->cache(true);

$result = $client->takeWithMetadata($options);

function printField($label, $value)
{
    if ($label === 'screenshot' && $value !== null) {
        echo $label . ' length: ' . strlen($value) . "\n";
        return;
    }
    echo $label . ': ';
    if (is_object($value) || is_array($value)) {
        print_r($value);
    } else {
        var_export($value);
        echo "\n";
    }
}

foreach (get_object_vars($result) as $field => $value) {
    printField($field, $value);
}
