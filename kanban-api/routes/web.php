<?php

use Illuminate\Support\Facades\Route;
// use Illuminate\Support\Facades\Broadcast;


Route::get('/', function () {
    return view('welcome');
});

// Broadcast::routes(['middleware' => ['auth:sanctum']]);

// use Illuminate\Support\Facades\Broadcast;


// Broadcast::routes(['middleware' => ['auth:sanctum']]);
