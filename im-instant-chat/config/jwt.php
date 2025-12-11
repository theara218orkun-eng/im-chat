<?php

return [
    // JWT authentication secret
    'secret' => env('JWT_SECRET', 'your-secret-key-here-1234567890abcdef'),
    
    // JWT hashing algorithm
    'algo' => env('JWT_ALGO', 'HS256'),
    
    // Token time to live (in minutes)
    'ttl' => env('JWT_TTL', 60),
    
    // Refresh time to live (in minutes)
    'refresh_ttl' => env('JWT_REFRESH_TTL', 20160),
    
    // Blacklist grace period (in seconds)
    'blacklist_grace_period' => env('JWT_BLACKLIST_GRACE_PERIOD', 10),
    
    // Token providers
    'providers' => [
        'jwt' => thans\jwt\provider\JWT\Lcobucci::class,
        'storage' => thans\jwt\provider\storage\Tp6::class,
    ],
    
    // Token retrieval methods (in order of priority)
    'token_mode' => ['header', 'cookie', 'param'],
    
    // Token key in request
    'token_key' => 'token',
    
    // Header name for token
    'header' => 'Authorization',
    
    // Cookie name for token
    'cookie' => 'token',
    
    // Query string parameter name for token
    'query' => 'token',
    
    // Leeway time (in seconds) for JWT validation
    'leeway' => env('JWT_LEEWAY', 0),
];