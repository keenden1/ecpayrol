<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Handle an incoming request and sanitize all input data.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Sanitize all input data
        $input = $request->all();

        array_walk_recursive($input, function(&$value) {
            if (is_string($value)) {
                // Remove null bytes
                $value = str_replace(chr(0), '', $value);

                // Trim whitespace
                $value = trim($value);

                // Remove control characters except newlines and tabs
                $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);
            }
        });

        // Replace the request input with sanitized data
        $request->merge($input);

        return $next($request);
    }

    /**
     * Clean string for XSS prevention
     *
     * @param string $value
     * @return string
     */
    protected function cleanXSS($value)
    {
        // Remove any null bytes
        $value = str_replace(chr(0), '', $value);

        // Remove suspicious patterns that could be XSS
        $value = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $value);
        $value = preg_replace('/javascript:/i', '', $value);
        $value = preg_replace('/on\w+\s*=\s*["\']?[^"\'>]+["\']?/i', '', $value);

        return $value;
    }
}
