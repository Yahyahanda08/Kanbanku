<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BoardController;
use App\Http\Controllers\Api\ColumnController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\CommentController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;


Broadcast::routes(['middleware' => ['auth:sanctum']]);

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // ── Boards ──────────────────────────────────────────────────────────────
    Route::apiResource('boards', BoardController::class);

    // Invite & member management
    Route::post('boards/{board}/invite',                    [BoardController::class, 'invite']);
    Route::delete('boards/{board}/members/{user}',          [BoardController::class, 'removeMember']);
    Route::put('boards/{board}/members/{user}/role',        [BoardController::class, 'updateMemberRole']);
    
    // Activity log
    Route::get('boards/{board}/activity',  [BoardController::class, 'activity']);
    Route::post('boards/{board}/activity', [BoardController::class, 'logActivity']);

    // Reorder columns
    Route::put('boards/{board}/columns/reorder',            [BoardController::class, 'reorderColumns']);

    // ── Columns & Tasks ──────────────────────────────────────────────────────
    Route::apiResource('boards.columns', ColumnController::class)->shallow();
    Route::apiResource('columns.tasks',  TaskController::class)->shallow();
    Route::put('tasks/{task}/move',      [TaskController::class, 'move']);


    // ── Comments ─────────────────────────────────────────────────────────────
    Route::apiResource('tasks.comments', CommentController::class)
         ->shallow()->only(['index', 'store', 'destroy']);
});