<?php

namespace ScreenshotOne\Sdk;

/**
 * Options for take screenshot method.
 */
class TakeOptions
{
    private array $query;

    private function __construct(array $query)
    {
        $this->query = $query;
    }

    /**
     * Initialize options with the URL.
     */
    public static function url(string $url): TakeOptions
    {
        return new TakeOptions(['url' => $url]);
    }

    /**
     * Initialize options with the HTML.
     */
    public static function html(string $html): TakeOptions
    {
        return new TakeOptions(['html' => $html]);
    }

    private function put(string $key, string ...$value)
    {
        if (count($value) == 1) {
            $this->query[$key] = $value[0];
        } else {
            $this->query[$key] = $value;
        }
    }

    /**
     * Selector is a CSS-like selector of the element to take a screenshot of.
     *
     * @return $this
     */
    public function selector(string $selector)
    {
        $this->put("selector", $selector);

        return $this;
    }


    /**
     * hideSelectors method allows hiding elements before taking a screenshot.
     *
     * All elements that match each selector will be hidden by setting the `display` style
     * property to `none !important`.
     *
     * @return $this
     */
    public function hideSelectors(string ...$selectors)
    {
        $this->put("hide_selectors", ...$selectors);

        return $this;
    }

    /**
     * errorOnSelectorNotFound determines the behavior of what to do when selector is not found.
     *
     * @return $this
     */
    public function errorOnSelectorNotFound(bool $errorOn)
    {
        $this->put("error_on_selector_not_found", $errorOn ? "true" : "false");

        return $this;
    }

    /**
     * You can use data center proxies provided by ScreenshotOne to take screenshots from different countries.
     *
     * @return $this
     */
    public function ipCountryCode(string $ipCountryCode)
    {
        $this->put("ip_country_code", $ipCountryCode);

        return $this;
    }

    /**
     * Styles specifies custom CSS styles for the page.
     *
     * @return $this
     */
    public function styles(string $styles)
    {
        $this->put("styles", $styles);

        return $this;
    }

    /**
     * Scripts specifies custom scripts for the page.
     *
     * @return $this
     */
    public function scripts(string $scripts)
    {
        $this->put("scripts", $scripts);

        return $this;
    }

    /**
     * Renders the full page.
     *
     * @return $this
     */
    public function fullPage(bool $fullPage)
    {
        $this->put("full_page", $fullPage ? "true" : "false");

        return $this;
    }

    /**
     * Sets response format, one of: "png", "jpeg", "webp" or "jpg".
     *
     * @return $this
     */
    public function format(string $format)
    {
        $this->put("format", $format);

        return $this;
    }

    /**
     * Renders image with the specified quality. Available for the next formats: "jpeg" ("jpg"), "webp".
     *
     * @return $this
     */
    public function imageQuality(int $imageQuality)
    {
        $this->put("image_quality", (string) $imageQuality);

        return $this;
    }

    /**
     * Renders a transparent background for the image. Works only if the site has not defined background color.
     * Available for the following response formats: "png", "webp".
     *
     * @return $this
     */
    public function omitBackground(bool $omitBackground)
    {
        $this->put("omit_background", $omitBackground ? "true" : "false");

        return $this;
    }

    /**
     * Sets the width of the browser viewport (pixels).
     *
     * @return $this
     */
    public function viewportWidth(int $viewportWidth)
    {
        $this->put("viewport_width", (string) $viewportWidth);

        return $this;
    }

    /**
     * Sets the height of the browser viewport (pixels).
     *
     * @return $this
     */
    public function viewportHeight(int $viewportHeight)
    {
        $this->put("viewport_height", (string) $viewportHeight);

        return $this;
    }

    /**
     * Sets the device scale factor. Acceptable value is one of: 1, 2 or 3.
     *
     * @return $this
     */
    public function deviceScaleFactor(int $deviceScaleFactor)
    {
        $this->put("device_scale_factor", (string) $deviceScaleFactor);

        return $this;
    }

    /**
     * Sets geolocation latitude for the request.
     * Both latitude and longitude are required if one of them is set.
     *
     * @return $this
     */
    public function geolocationLatitude(float $latitude)
    {
        $this->put("geolocation_latitude", (string) $latitude);

        return $this;
    }

    /**
     * Sets geolocation longitude for the request. Both latitude and longitude are required if one of them is set.
     *
     * @return $this
     */
    public function geolocationLongitude(float $longitude)
    {
        $this->put("geolocation_longitude", (string) $longitude);

        return $this;
    }

    /**
     * Sets the geolocation accuracy in meters.
     *
     * @return $this
     */
    public function geolocationAccuracy(int $accuracy)
    {
        $this->put("geolocation_accuracy", $accuracy);

        return $this;
    }

    /**
     * Blocks ads.
     *
     * @return $this
     */
    public function blockAds(bool $blockAds)
    {
        $this->put("block_ads", $blockAds ? "true" : "false");

        return $this;
    }

    /**
     * Blocks cookie banners.
     *
     * @return $this
     */
    public function blockCookieBanners(bool $blockCookieBanners)
    {
        $this->put("block_cookie_banners", $blockCookieBanners ? "true" : "false");
        return $this;
    }

    /**
     * Blocks trackers.
     *
     * @return $this
     */
    public function blockTrackers(bool $blockTrackers)
    {
        $this->put("block_trackers", $blockTrackers ? "true" : "false");

        return $this;
    }

    /**
     * Blocks requests by specifying URL, domain, or even a simple pattern.
     *
     * @return $this
     */
    public function blockRequests(string ...$blockRequests)
    {
        $this->put("block_requests", ...$blockRequests);

        return $this;
    }


    /**
     * Blocks loading resources by type. Available resource types are: "document", "stylesheet", "image", "media",
     * "font", "script", "texttrack", "xhr", "fetch", "eventsource", "websocket", "manifest", "other".
     *
     * @return $this
     */
    public function blockResources(string ...$blockResources)
    {
        $this->put("block_resources", ...$blockResources);

        return $this;
    }

    /**
     * Enables caching.
     *
     * @return $this
     */
    public function cache(bool $cache)
    {
        $this->put("cache", $cache ? "true" : "false");

        return $this;
    }

    /**
     * Sets cache TTL.
     *
     * @return $this
     */
    public function cacheTtl(int $cacheTtl)
    {
        $this->put("cache_ttl", (string) $cacheTtl);

        return $this;
    }

    /**
     * Sets cache key.
     *
     * @return $this
     */
    public function cacheKey(string $cacheKey)
    {
        $this->put("cache_key", $cacheKey);

        return $this;
    }

    /**
     * Sets a user agent for the request.
     *
     * @return $this
     */
    public function userAgent(string $userAgent)
    {
        $this->put("user_agent", $userAgent);

        return $this;
    }

    /**
     * Sets an authorization header for the request.
     *
     * @return $this
     */
    public function authorization(string $authorization)
    {
        $this->put("authorization", $authorization);

        return $this;
    }

    /**
     * Set cookies for the request.
     *
     * @return $this
     */
    public function cookies(string ...$cookies)
    {
        $this->put("cookies", ...$cookies);

        return $this;
    }

    /**
     * Sets extra headers for the request.
     *
     * @return $this
     */
    public function headers(string ...$headers)
    {
        $this->put("headers", ...$headers);

        return $this;
    }

    /**
     * TimeZone sets time zone for the request.
     * Available time zones are: "America/Santiago", "Asia/Shanghai", "Europe/Berlin", "America/Guayaquil",
     * "Europe/Madrid", "Pacific/Majuro", "Asia/Kuala_Lumpur", "Pacific/Auckland", "Europe/Lisbon", "Europe/Kiev",
     * "Asia/Tashkent", "Europe/London".
     *
     * @return $this
     */
    public function timeZone(string $timeZone)
    {
        $this->put("time_zone", $timeZone);

        return $this;
    }

    /**
     * Sets delay.
     *
     * @return $this
     */
    public function delay(int $delay)
    {
        $this->put("delay", (string) $delay);

        return $this;
    }

    /**
     * Sets timeout.
     *
     * @return $this
     */
    public function timeout(int $timeout)
    {
        $this->put("timeout", (string) $timeout);

        return $this;
    }

    /**
     * When the site responds within the range of 200-299 status code, 
     * you can ignore errors and take a screenshot of the error page anyway. 
     * To do that, set the option `ignore_host_errors` to true. It is false by default.
     *
     * It is helpful when you want to create a gallery of error pages or,
     * for some reason, you need to render error pages.
     *
     * @return $this
     */
    public function ignoreHostErrors(bool $ignoreHostErrors)
    {
        $this->put("ignore_host_errors", $ignoreHostErrors ? "true" : "false");

        return $this;
    }

    /**
     * Enables scrolling element into view before taking a screenshot.
     *
     * @return $this
     */
    public function selectorScrollIntoView(bool $scroll)
    {
        $this->put("selector_scroll_into_view", $scroll ? "true" : "false");

        return $this;
    }

    /**
     * Enables capturing content beyond viewport.
     *
     * @return $this
     */
    public function captureBeyondViewport(bool $capture)
    {
        $this->put("capture_beyond_viewport", $capture ? "true" : "false");

        return $this;
    }

    /**
     * Scrolls element into view before taking a screenshot.
     *
     * @return $this
     */
    public function scrollIntoView(string $selector)
    {
        $this->put("scroll_into_view", $selector);

        return $this;
    }

    /**
     * Adjusts scroll position by pixels.
     *
     * @return $this
     */
    public function scrollIntoViewAdjustTop(int $pixels)
    {
        $this->put("scroll_into_view_adjust_top", (string) $pixels);

        return $this;
    }

    /**
     * Requests GPU rendering.
     *
     * @return $this
     */
    public function requestGpuRendering(bool $request)
    {
        $this->put("request_gpu_rendering", $request ? "true" : "false");

        return $this;
    }

    /**
     * Sets PDF print background.
     *
     * @return $this
     */
    public function pdfPrintBackground(bool $print)
    {
        $this->put("pdf_print_background", $print ? "true" : "false");

        return $this;
    }

    /**
     * Fits PDF to one page.
     *
     * @return $this
     */
    public function pdfFitOnePage(bool $fit)
    {
        $this->put("pdf_fit_one_page", $fit ? "true" : "false");

        return $this;
    }

    /**
     * Sets PDF orientation to landscape.
     *
     * @return $this
     */
    public function pdfLandscape(bool $landscape)
    {
        $this->put("pdf_landscape", $landscape ? "true" : "false");

        return $this;
    }

    /**
     * Sets PDF paper format.
     *
     * @return $this
     */
    public function pdfPaperFormat(string $format)
    {
        $this->put("pdf_paper_format", $format);

        return $this;
    }

    /**
     * Sets OpenAI API key for vision integration.
     *
     * @return $this
     */
    public function openaiApiKey(string $key)
    {
        $this->put("openai_api_key", $key);

        return $this;
    }

    /**
     * Sets vision prompt for OpenAI integration.
     *
     * @return $this
     */
    public function visionPrompt(string $prompt)
    {
        $this->put("vision_prompt", $prompt);

        return $this;
    }

    /**
     * Sets maximum tokens for OpenAI vision response.
     *
     * @return $this
     */
    public function visionMaxTokens(int $tokens)
    {
        $this->put("vision_max_tokens", (string) $tokens);

        return $this;
    }

    /**
     * Sets clip coordinates and dimensions.
     *
     * @return $this
     */
    public function clip(int $x, int $y, int $width, int $height)
    {
        $this->put("clip_x", (string) $x);
        $this->put("clip_y", (string) $y);
        $this->put("clip_width", (string) $width);
        $this->put("clip_height", (string) $height);

        return $this;
    }

    /**
     * Sets full page scroll parameters.
     *
     * @return $this
     */
    public function fullPageScroll(bool $scroll, ?int $delay = null, ?int $scrollBy = null)
    {
        $this->put("full_page_scroll", $scroll ? "true" : "false");
        if ($delay !== null) {
            $this->put("full_page_scroll_delay", (string) $delay);
        }
        if ($scrollBy !== null) {
            $this->put("full_page_scroll_by", (string) $scrollBy);
        }

        return $this;
    }

    /**
     * Sets maximum height for full page screenshot.
     *
     * @return $this
     */
    public function fullPageMaxHeight(int $height)
    {
        $this->put("full_page_max_height", (string) $height);

        return $this;
    }

    /**
     * Sets full page algorithm.
     *
     * @return $this
     */
    public function fullPageAlgorithm(string $algorithm)
    {
        $this->put("full_page_algorithm", $algorithm);

        return $this;
    }

    /**
     * Sets viewport device preset.
     *
     * @return $this
     */
    public function viewportDevice(string $device)
    {
        $this->put("viewport_device", $device);

        return $this;
    }

    /**
     * Sets viewport mobile mode.
     *
     * @return $this
     */
    public function viewportMobile(bool $mobile)
    {
        $this->put("viewport_mobile", $mobile ? "true" : "false");

        return $this;
    }

    /**
     * Sets viewport touch support.
     *
     * @return $this
     */
    public function viewportHasTouch(bool $hasTouch)
    {
        $this->put("viewport_has_touch", $hasTouch ? "true" : "false");

        return $this;
    }

    /**
     * Sets viewport orientation to landscape.
     *
     * @return $this
     */
    public function viewportLandscape(bool $landscape)
    {
        $this->put("viewport_landscape", $landscape ? "true" : "false");

        return $this;
    }

    /**
     * Sets image dimensions.
     *
     * @return $this
     */
    public function imageSize(?int $width = null, ?int $height = null)
    {
        if ($width !== null) {
            $this->put("image_width", (string) $width);
        }
        if ($height !== null) {
            $this->put("image_height", (string) $height);
        }

        return $this;
    }

    /**
     * Enables dark mode emulation.
     *
     * @return $this
     */
    public function darkMode(bool $enabled)
    {
        $this->put("dark_mode", $enabled ? "true" : "false");

        return $this;
    }

    /**
     * Enables reduced motion emulation.
     *
     * @return $this
     */
    public function reducedMotion(bool $enabled)
    {
        $this->put("reduced_motion", $enabled ? "true" : "false");

        return $this;
    }

    /**
     * Sets media type emulation.
     *
     * @return $this
     */
    public function mediaType(string $type)
    {
        $this->put("media_type", $type);

        return $this;
    }

    /**
     * Sets scripts wait until condition.
     *
     * @return $this
     */
    public function scriptsWaitUntil(string $condition)
    {
        $this->put("scripts_wait_until", $condition);

        return $this;
    }

    /**
     * Sets click selector and error handling.
     *
     * @return $this
     */
    public function click(string $selector, bool $errorOnNotFound = false)
    {
        $this->put("click", $selector);
        if ($errorOnNotFound) {
            $this->put("error_on_click_selector_not_found", "true");
        }

        return $this;
    }

    /**
     * Enables blocking banners by heuristics.
     *
     * @return $this
     */
    public function blockBannersByHeuristics(bool $block)
    {
        $this->put("block_banners_by_heuristics", $block ? "true" : "false");

        return $this;
    }

    /**
     * Enables blocking chat widgets.
     *
     * @return $this
     */
    public function blockChats(bool $block)
    {
        $this->put("block_chats", $block ? "true" : "false");

        return $this;
    }

    /**
     * Sets navigation timeout.
     *
     * @return $this
     */
    public function navigationTimeout(int $timeout)
    {
        $this->put("navigation_timeout", (string) $timeout);

        return $this;
    }

    /**
     * Sets wait for selector options.
     *
     * @return $this
     */
    public function waitForSelector(string $selector, ?string $algorithm = null)
    {
        $this->put("wait_for_selector", $selector);
        if ($algorithm !== null) {
            $this->put("wait_for_selector_algorithm", $algorithm);
        }

        return $this;
    }

    /**
     * Sets wait until condition.
     *
     * @return $this
     */
    public function waitUntil(string $condition)
    {
        $this->put("wait_until", $condition);

        return $this;
    }

    /**
     * Enables storing screenshot.
     *
     * @return $this
     */
    public function store(bool $store)
    {
        $this->put("store", $store ? "true" : "false");

        return $this;
    }

    /**
     * Sets storage options.
     *
     * @return $this
     */
    public function storage(
        ?string $path = null,
        ?string $endpoint = null,
        ?string $accessKeyId = null,
        ?string $secretAccessKey = null,
        ?string $bucket = null,
        ?string $class = null,
        ?string $acl = null,
        bool $returnLocation = false
    ) {
        if ($path !== null) {
            $this->put("storage_path", $path);
        }
        if ($endpoint !== null) {
            $this->put("storage_endpoint", $endpoint);
        }
        if ($accessKeyId !== null) {
            $this->put("storage_access_key_id", $accessKeyId);
        }
        if ($secretAccessKey !== null) {
            $this->put("storage_secret_access_key", $secretAccessKey);
        }
        if ($bucket !== null) {
            $this->put("storage_bucket", $bucket);
        }
        if ($class !== null) {
            $this->put("storage_class", $class);
        }
        if ($acl !== null) {
            $this->put("storage_acl", $acl);
        }
        if ($returnLocation) {
            $this->put("storage_return_location", "true");
        }

        return $this;
    }

    /**
     * @return $this
     */
    public function responseType(string $type)
    {
        $this->put("response_type", $type);

        return $this;
    }

    /**
     * Enables metadata collection.
     *
     * @return $this
     */
    public function metadata(
        bool $imageSize = false,
        bool $fonts = false,
        bool $icon = false,
        bool $openGraph = false,
        bool $pageTitle = false,
        bool $content = false,
        bool $httpResponseStatusCode = false,
        bool $httpResponseHeaders = false
    ) {
        if ($imageSize) {
            $this->put("metadata_image_size", "true");
        }
        if ($fonts) {
            $this->put("metadata_fonts", "true");
        }
        if ($icon) {
            $this->put("metadata_icon", "true");
        }
        if ($openGraph) {
            $this->put("metadata_open_graph", "true");
        }
        if ($pageTitle) {
            $this->put("metadata_page_title", "true");
        }
        if ($content) {
            $this->put("metadata_content", "true");
        }
        if ($httpResponseStatusCode) {
            $this->put("metadata_http_response_status_code", "true");
        }
        if ($httpResponseHeaders) {
            $this->put("metadata_http_response_headers", "true");
        }

        return $this;
    }

    /**
     * Enables async processing.
     *
     * @return $this
     */
    public function async(bool $async)
    {
        $this->put("async", $async ? "true" : "false");

        return $this;
    }

    /**
     * Sets webhook options.
     *
     * @return $this
     */
    public function webhook(string $url, bool $sign = true)
    {
        $this->put("webhook_url", $url);
        $this->put("webhook_sign", $sign ? "true" : "false");

        return $this;
    }

    /**
     * Sets fail if content contains condition.
     *
     * @return $this
     */
    public function failIfContentContains(string ...$content)
    {
        $this->put("fail_if_content_contains", ...$content);

        return $this;
    }

    /**
     * Sets fail if GPU rendering fails condition.
     *
     * @return $this
     */
    public function failIfGpuRenderingFails(bool $fail)
    {
        $this->put("fail_if_gpu_rendering_fails", $fail ? "true" : "false");

        return $this;
    }

    /**
     * Enables bypassing Content Security Policy.
     *
     * @return $this
     */
    public function bypassCsp(bool $bypass)
    {
        $this->put("bypass_csp", $bypass ? "true" : "false");

        return $this;
    }

    /**
     * Returns array that might be used to build a query string.
     */
    public function query(): array
    {
        return $this->query;
    }
}
