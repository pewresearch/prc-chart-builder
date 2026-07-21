<?php

use PHPUnit\Framework\TestCase;

use ScreenshotOne\Sdk\Client;
use ScreenshotOne\Sdk\TakeOptions;
use ScreenshotOne\Sdk\ResultWithMetadata;
use GuzzleHttp\Psr7\Response;
use Psr\Http\Message\StreamInterface;
use GuzzleHttp\Client as HttpClient;

final class ClientTest extends TestCase
{
    public function testGenerateTakeUrl(): void
    {
        $client = new Client('access_key', 'secret_key');

        $options = TakeOptions::url("https://example.com")
            ->fullPage(true)
            ->delay(2)
            ->geolocationLatitude(48.857648)
            ->geolocationLongitude(2.294677)
            ->geolocationAccuracy(50);

        $url = $client->generateTakeUrl($options);

        $this->assertEquals(
            'https://api.screenshotone.com/take?access_key=access_key&url=https%3A%2F%2Fexample.com&full_page=true&delay=2&geolocation_latitude=48.857648&geolocation_longitude=2.294677&geolocation_accuracy=50&signature=617c66eeedd9ebffac97e5c9429be10471632362da96e796be54911987c47ff0',
            $url
        );
    }

    public function testTakeWithMetadataJson(): void
    {
        $json = json_encode([
            'metadata' => [
                'image_size' => ['width' => 100, 'height' => 200],
                'icon' => ['url' => 'https://cdn.screenshotone.com/icon.png', 'type' => 'image/png'],
                'open_graph' => ['title' => 'OG Title'],
                'page_title' => rawurlencode('Test Page'),
            ],
            'fonts' => [
                [
                    'first' => 'Arial',
                    'fallback' => ['Roboto'],
                    'elements' => ['body', 'h1']
                ]
            ],
            'content' => ['url' => 'https://cdn.screenshotone.com/content.html', 'expires' => '2024-12-31'],
            'http_response' => ['status_code' => 200, 'headers' => ['content-type' => 'text/html']],
            'cache_url' => 'https://cdn.screenshotone.com/cache.html',
        ]);

        $mock = $this->getMockBuilder(HttpClient::class)
            ->onlyMethods(['get'])
            ->getMock();
        $stream = $this->createMock(StreamInterface::class);
        $stream->method('getContents')->willReturn($json);
        $mock->method('get')->willReturn(new Response(200, ['Content-Type' => 'application/json'], $stream));

        $client = new Client('access_key', 'secret_key');
        $clientReflection = new \ReflectionClass($client);
        $property = $clientReflection->getProperty('httpClient');
        $property->setAccessible(true);
        $property->setValue($client, $mock);

        $options = TakeOptions::url('https://example.com');
        $result = $client->takeWithMetadata($options);

        $this->assertNull($result->screenshot);
        $this->assertInstanceOf(\ScreenshotOne\Sdk\ImageSize::class, $result->imageSize);
        $this->assertEquals(100, $result->imageSize->width);
        $this->assertEquals(200, $result->imageSize->height);
        $this->assertIsArray($result->fonts);
        $this->assertCount(1, $result->fonts);
        $this->assertInstanceOf(\ScreenshotOne\Sdk\Font::class, $result->fonts[0]);
        $this->assertEquals('Arial', $result->fonts[0]->first);
        $this->assertEquals(['Roboto'], $result->fonts[0]->fallback);
        $this->assertEquals(['body', 'h1'], $result->fonts[0]->elements);
        $this->assertInstanceOf(\ScreenshotOne\Sdk\Icon::class, $result->icon);
        $this->assertEquals('https://cdn.screenshotone.com/icon.png', $result->icon->url);
        $this->assertEquals('image/png', $result->icon->type);
        $this->assertInstanceOf(\ScreenshotOne\Sdk\OpenGraph::class, $result->openGraph);
        $this->assertEquals('OG Title', $result->openGraph->title);
        $this->assertEquals('Test Page', $result->pageTitle);
        $this->assertInstanceOf(\ScreenshotOne\Sdk\Content::class, $result->content);
        $this->assertEquals('https://cdn.screenshotone.com/content.html', $result->content->url);
        $this->assertEquals(new \DateTime('2024-12-31'), $result->content->expires);
        $this->assertInstanceOf(\ScreenshotOne\Sdk\HTTPResponse::class, $result->httpResponse);
        $this->assertEquals(200, $result->httpResponse->statusCode);
        $this->assertEquals(['content-type' => 'text/html'], $result->httpResponse->headers);
        $this->assertInstanceOf(\ScreenshotOne\Sdk\Cache::class, $result->cache);
        $this->assertEquals('https://cdn.screenshotone.com/cache.html', $result->cache->url);
    }

    public function testTakeWithMetadataBinary(): void
    {
        $binary = 'PNGDATA';
        $mock = $this->getMockBuilder(HttpClient::class)
            ->onlyMethods(['get'])
            ->getMock();

        $stream = $this->createMock(StreamInterface::class);
        $stream->method('getContents')->willReturn($binary);
        $headers = [
            'Content-Type' => ['image/png'],
            'X-ScreenshotOne-HTTP-Response-Status-Code' => ['200'],
            'X-ScreenshotOne-HTTP-Response-Headers' => [rawurlencode(json_encode(['content-type' => 'text/html']))],
            'X-ScreenshotOne-Content-URL' => ['https://cdn.screenshotone.com/content.html'],
            'X-ScreenshotOne-Content-Expires' => ['2024-12-31'],
            'X-ScreenshotOne-Cache-URL' => ['https://cdn.screenshotone.com/cache.html'],
        ];

        $mock->method('get')->willReturn(new Response(200, $headers, $stream));
        $client = new Client('access_key', 'secret_key');
        $clientReflection = new \ReflectionClass($client);
        $property = $clientReflection->getProperty('httpClient');
        $property->setAccessible(true);
        $property->setValue($client, $mock);

        $options = TakeOptions::url('https://example.com');
        $result = $client->takeWithMetadata($options);

        $this->assertEquals($binary, $result->screenshot);
        $this->assertNull($result->imageSize);
        $this->assertNull($result->fonts);
        $this->assertNull($result->icon);
        $this->assertNull($result->openGraph);
        $this->assertNull($result->pageTitle);
        $this->assertInstanceOf(\ScreenshotOne\Sdk\Content::class, $result->content);
        $this->assertEquals('https://cdn.screenshotone.com/content.html', $result->content->url);
        $this->assertEquals(new \DateTime('2024-12-31'), $result->content->expires);
        $this->assertInstanceOf(\ScreenshotOne\Sdk\HTTPResponse::class, $result->httpResponse);
        $this->assertEquals(200, $result->httpResponse->statusCode);
        $this->assertEquals(['content-type' => 'text/html'], $result->httpResponse->headers);
        $this->assertInstanceOf(\ScreenshotOne\Sdk\Cache::class, $result->cache);
        $this->assertEquals('https://cdn.screenshotone.com/cache.html', $result->cache->url);
    }
}
