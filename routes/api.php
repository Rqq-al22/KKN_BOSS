<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\ConfigController;
use App\Http\Controllers\AttendanceController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Auth routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/auth/verify', [AuthController::class, 'verify']);
Route::post('/auth/logout', [AuthController::class, 'logout']);

// Public routes
Route::get('/members', [MemberController::class, 'index']);
Route::get('/config', [ConfigController::class, 'show']);
Route::post('/attendance', [AttendanceController::class, 'store']);

// Admin Protected routes
Route::middleware('admin.auth')->group(function () {
    Route::post('/members', [MemberController::class, 'store']);
    Route::delete('/members', [MemberController::class, 'destroy']);
    
    Route::post('/config', [ConfigController::class, 'update']);
    
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::delete('/attendance/clear', [AttendanceController::class, 'clear']);
});
