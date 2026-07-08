<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\AdminToken;
use Symfony\Component\HttpFoundation\Response;

class RequireAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('Authorization');

        if (!$token || !AdminToken::where('token', $token)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Silakan login kembali.'
            ], 401);
        }

        return $next($request);
    }
}
