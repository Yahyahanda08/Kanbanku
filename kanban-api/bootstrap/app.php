<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();

        // ✅ Override middleware auth
        $middleware->alias([
            'auth' => \App\Http\Middleware\Authenticate::class,
        ]);

        // ✅ Allow broadcasting auth tanpa CSRF
        $middleware->validateCsrfTokens(except: [
            'broadcasting/auth',
        ]);
        
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (AuthenticationException $e, $request) {
        return response()->json([
            'message' => 'Unauthenticated'
        ], 401);
        });
    })
    ->create();