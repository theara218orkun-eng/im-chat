<?php
declare (strict_types = 1);

namespace app\middleware;

class Cors
{
    public function handle($request, \Closure $next)
    {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, If-Match, If-Modified-Since, If-None-Match, If-Unmodified-Since, X-CSRF-TOKEN, X-Requested-With, sessionId, authToken');
        header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE');
        header('Access-Control-Allow-Credentials: true');
        
        if (strtoupper($request->method()) == 'OPTIONS') {
            return response()->code(204);
        }
        
        return $next($request);
    }
}
