<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Route untuk auth broadcasting (WAJIB)
        Broadcast::routes(['middleware' => ['auth:sanctum']]);

        // Load file channels
        require base_path('routes/channels.php');
    }
}