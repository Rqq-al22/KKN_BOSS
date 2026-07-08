<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Admin;
use App\Models\AdminToken;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Admin login.
     */
    public function login(Request $request)
    {
        $username = $request->input('username');
        $password = $request->input('password');

        if (!$username || !$password) {
            return response()->json([
                'success' => false,
                'message' => 'Username dan Password harus diisi'
            ], 400);
        }

        $hash = hash('sha256', $password);
        $admin = Admin::where('username', $username)->where('password_hash', $hash)->first();

        if ($admin) {
            $token = (string) Str::uuid();
            AdminToken::create([
                'token' => $token,
                'username' => $username,
                'created_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'token' => $token,
                'message' => 'Login berhasil'
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Username atau Password salah'
            ], 401);
        }
    }

    /**
     * Verify active session.
     */
    public function verify(Request $request)
    {
        $token = $request->header('Authorization');

        if ($token && AdminToken::where('token', $token)->exists()) {
            return response()->json(['success' => true]);
        }

        return response()->json(['success' => false], 401);
    }

    /**
     * Admin logout.
     */
    public function logout(Request $request)
    {
        $token = $request->header('Authorization');

        if ($token) {
            AdminToken::where('token', $token)->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil'
        ]);
    }
}
