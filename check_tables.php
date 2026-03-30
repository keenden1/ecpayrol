<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Schema;

echo "Checking tables...\n\n";

$tables = ['employees', 'departments'];

foreach ($tables as $table) {
    $exists = Schema::hasTable($table);
    echo "$table: " . ($exists ? "EXISTS" : "MISSING") . "\n";
}
