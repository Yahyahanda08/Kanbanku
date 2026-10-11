<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

// Bootstrap HTTP kernel penuh — ini yang memicu registerConfiguredProviders()
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

try {
    $fs = $app->make('files');
    echo "files OK: " . get_class($fs) . PHP_EOL;
} catch (\Exception $e) {
    echo "ERROR make files: " . $e->getMessage() . PHP_EOL;
}

try {
    $fs2 = $app->make('filesystem');
    echo "filesystem OK: " . get_class($fs2) . PHP_EOL;
} catch (\Exception $e) {
    echo "ERROR make filesystem: " . $e->getMessage() . PHP_EOL;
}

$providers = array_keys($app->getLoadedProviders());
$filtered = array_filter($providers, fn($p) => str_contains($p, 'File') || str_contains($p, 'Storage'));
echo "Loaded filesystem-related providers:" . PHP_EOL;
print_r(array_values($filtered));