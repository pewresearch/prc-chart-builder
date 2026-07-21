<?php

namespace ScreenshotOne\Sdk;

use DateTime;

class ImageSize
{
    public int $width;
    public int $height;
}


class Content
{
    public string $url;
    public ?DateTime $expires = null;

    public function __construct(string $url, DateTime $expires)
    {
        $this->url = $url;
        $this->expires = $expires;
    }
}

class OpenGraph
{
    public ?string $title = null;
    public ?string $description = null;
    public ?string $image = null;
}

class HTTPResponse
{
    public ?int $statusCode = null;
    public array $headers = [];
}

class Cache
{
    public string $url;

    public function __construct(string $url)
    {
        $this->url = $url;
    }
}

class Icon
{
    public string $url;
    public string $type;

    public function __construct(string $url, string $type)
    {
        $this->url = $url;
        $this->type = $type;
    }
}

class Font
{
    public string $first;
    public array $fallback = [];
    public array $elements = [];

    public function __construct(string $first, array $fallback, array $elements)
    {
        $this->first = $first;
        $this->fallback = $fallback;
        $this->elements = $elements;
    }
}

class ResultWithMetadata
{
    public ?Cache $cache = null;
    public ?string $screenshot = null;
    public ?ImageSize $imageSize = null;
    /**
     * @var Font[]|null
     */
    public ?array $fonts = null;
    public ?Icon $icon = null;
    public ?OpenGraph $openGraph = null;
    public ?string $pageTitle = null;
    public ?Content $content = null;
    public ?HTTPResponse $httpResponse = null;
}
