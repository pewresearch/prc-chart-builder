<?php

namespace ScreenshotOne\Sdk;

use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\Exception\GuzzleException;
use ScreenshotOne\Sdk\ResultWithMetadata;
use ScreenshotOne\Sdk\ImageSize;
use ScreenshotOne\Sdk\OpenGraph;
use ScreenshotOne\Sdk\HTTPResponse;

/**
 * The client for ScreenshotOne.com API to take screenshots of any URL.
 */
class Client
{
    private const API_BASE_URI = 'https://api.screenshotone.com';

    private HttpClient $httpClient;
    private string $accessKey;
    private string $secretKey;

    public function __construct(string $accessKey, string $secretKey)
    {
        $this->httpClient = new HttpClient([
            // max possible timeout for the API requests
            'timeout'  => 600,
            'allow_redirects' => true,
        ]);

        $this->accessKey = $accessKey;
        $this->secretKey = $secretKey;
    }

    /**
     * Generates URL to take screenshots with ScreenshotOne.com API.
     */
    public function generateTakeUrl(TakeOptions $options): string
    {
        $queryString = $this->buildQueryString($options);
        $signature = hash_hmac('sha256', $queryString, $this->secretKey);
        $queryString .= '&signature=' . $signature;

        return sprintf("%s/take?%s", static::API_BASE_URI, $queryString);
    }

    /**
     * Take screenshot and return a result with the metadata if requested via options.
     *
     * @throws GuzzleException if the http request fail.
     * @throws \Exception if the status code is not a 2xx.
     */
    public function takeWithMetadata(TakeOptions $options): ResultWithMetadata
    {
        $response = $this->httpClient->get($this->generateTakeUrl($options), ['stream' => true]);
        if (!($response->getStatusCode() >= 200 && $response->getStatusCode() < 300)) {
            throw new \Exception("Failed to take screenshot status code: " . $response->getStatusCode());
        }

        $contentType = $response->getHeader('Content-Type')[0] ?? null;

        $result = new ResultWithMetadata();
        if (stripos($contentType, 'application/json') !== false) {
            $json = $response->getBody()->getContents();
            $data = json_decode($json, true);
            if (isset($data['metadata']['image_size'])) {
                $img = new ImageSize();
                $img->width = $data['metadata']['image_size']['width'] ?? 0;
                $img->height = $data['metadata']['image_size']['height'] ?? 0;
                $result->imageSize = $img;
            }
            if (isset($data['fonts'])) {
                $result->fonts = array_map(
                    fn($font) => new Font(
                        $font['first'] ?? '',
                        $font['fallback'] ?? [],
                        $font['elements'] ?? []
                    ),
                    $data['fonts']
                );
            }
            if (isset($data['metadata']['icon'])) {
                $result->icon = new Icon(
                    $data['metadata']['icon']['url'],
                    $data['metadata']['icon']['type']
                );
            }

            if (isset($data['metadata']['open_graph'])) {
                $og = new OpenGraph();
                foreach ($data['metadata']['open_graph'] as $k => $v) {
                    if (property_exists($og, $k)) {
                        $og->$k = $v;
                    }
                }
                $result->openGraph = $og;
            }
            if (isset($data['metadata']['page_title'])) {
                $result->pageTitle = urldecode($data['metadata']['page_title']);
            }
            if (isset($data['content'])) {
                $result->content = new Content(
                    $data['content']['url'],
                    new \DateTime($data['content']['expires'])
                );
            }
            if (isset($data['http_response'])) {
                $hr = new HTTPResponse();
                $hr->statusCode = $data['http_response']['status_code'] ?? 0;
                $hr->headers = $data['http_response']['headers'] ?? [];
                $result->httpResponse = $hr;
            }
            if (isset($data['cache_url'])) {
                $result->cache = new Cache(
                    $data['cache_url']
                );
            }
        } else {
            $image = $response->getBody()->getContents();
            $result->screenshot = $image;


            if (
                $response->hasHeader('x-screenshotone-http-response-status-code') || $response->hasHeader('x-screenshotone-http-response-headers') ||
                $response->hasHeader('x-http-response-status-code') || $response->hasHeader('x-http-response-headers')
            ) {
                $statusCode = $response->getHeader('x-screenshotone-http-response-status-code')[0] ??
                    $response->getHeader('x-http-response-status-code')[0] ?? null;
                $headerArr = $response->getHeader('x-screenshotone-http-response-headers')[0] ??
                    $response->getHeader('x-http-response-headers')[0] ?? null;

                $hr = new HTTPResponse();
                $hr->statusCode = $statusCode ? (int)$statusCode : null;
                $hr->headers = $headerArr ? json_decode(urldecode($headerArr), true) : [];
                $result->httpResponse = $hr;
            }

            if ($response->hasHeader('x-screenshotone-image-width') && $response->hasHeader('x-screenshotone-image-height')) {
                $img = new ImageSize();
                $img->width = (int)$response->getHeader('x-screenshotone-image-width')[0] ?? 0;
                $img->height = (int)$response->getHeader('x-screenshotone-image-height')[0] ?? 0;

                $result->imageSize = $img;
            }

            if ($response->hasHeader('x-screenshotone-fonts')) {
                $fonts = $response->getHeader('x-screenshotone-fonts')[0] ?? null;
                if ($fonts) {
                    $fontsArr = json_decode(urldecode($fonts), true);
                    $result->fonts = array_map(
                        fn($font) => new Font(
                            $font['first'] ?? '',
                            $font['fallback'] ?? [],
                            $font['elements'] ?? []
                        ),
                        $fontsArr
                    );
                }
            }

            if ($response->hasHeader('x-screenshotone-icon')) {
                $icon = $response->getHeader('x-screenshotone-icon')[0] ?? null;
                if ($icon) {
                    $iconData = json_decode(urldecode($icon), true);
                    $result->icon = new Icon(
                        $iconData['url'],
                        $iconData['type']
                    );
                }
            }

            if ($response->hasHeader('x-screenshotone-open-graph')) {
                $openGraph = $response->getHeader('x-screenshotone-open-graph')[0] ?? null;
                if ($openGraph) {
                    $og = new OpenGraph();
                    $ogData = json_decode(urldecode($openGraph), true);
                    foreach ($ogData as $k => $v) {
                        if (property_exists($og, $k)) {
                            $og->$k = $v;
                        }
                    }
                    $result->openGraph = $og;
                }
            }

            if ($response->hasHeader('x-screenshotone-page-title')) {
                $pageTitle = $response->getHeader('x-screenshotone-page-title')[0] ?? null;
                $result->pageTitle = urldecode($pageTitle);
            }

            if ($response->hasHeader('x-screenshotone-content-url')) {
                $contentUrl = $response->getHeader('x-screenshotone-content-url')[0] ?? null;
                $contentExpires = $response->getHeader('x-screenshotone-content-expires')[0] ?? null;
                if ($contentUrl && $contentExpires) {
                    $result->content = new Content($contentUrl, new \DateTime($contentExpires));
                }
            }

            if ($response->hasHeader('x-screenshotone-cache-url')) {
                $cacheUrl = $response->getHeader('x-screenshotone-cache-url')[0] ?? null;
                if ($cacheUrl) {
                    $result->cache = new Cache(
                        $cacheUrl
                    );
                }
            }
        }

        return $result;
    }

    /**
     * Take screenshot and return an image.
     *
     * Returns the image stream.
     *
     * @throws GuzzleException if the http request fail.
     * @throws \RuntimeException if unable to read or an error occurs while reading the stream.
     */
    public function take(TakeOptions $options): string
    {
        $response = $this->httpClient->get($this->generateTakeUrl($options), ['stream' => true]);

        return $response->getBody()->getContents();
    }

    private function buildQueryString(TakeOptions $options): string
    {
        $queryPairs = ['access_key=' . $this->accessKey];
        foreach ($options->query() as $key => $values) {
            if (is_array($values)) {
                foreach ($values as $value) {
                    $queryPairs[] = $key . '=' . urlencode($value);
                }
            } else {
                $queryPairs[] = $key . '=' . urlencode($values);
            }
        }

        return join("&", $queryPairs);
    }
}
