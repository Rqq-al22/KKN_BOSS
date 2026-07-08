<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('index');
});

Route::get('/index.html', function () {
    return redirect('/');
});

Route::get('/absen.html', function () {
    return view('absen');
});

Route::get('/admin.html', function () {
    return view('admin');
});

Route::get('/debug-env', function () {
    return [
        'APP_KEY_exists' => !empty(env('APP_KEY')),
        'DATABASE_URL_exists' => !empty(env('DATABASE_URL')),
        'APP_ENV' => env('APP_ENV'),
        'APP_DEBUG' => env('APP_DEBUG'),
        'all_env_keys' => array_keys($_ENV),
        'all_server_keys' => array_keys($_SERVER),
    ];
});

Route::get('/test-api', function () {
    return [
        'success' => true,
        'members' => \App\Models\Member::orderBy('name', 'asc')->get()
    ];
});


