<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Config;
use App\Models\Admin;

class ConfigController extends Controller
{
    /**
     * Get cutoff configuration.
     */
    public function show()
    {
        $config = Config::where('key', 'cutoffTime')->first();
        $cutoffTime = $config ? $config->value : '08:00';

        return response()->json([
            'success' => true,
            'config' => [
                'cutoffTime' => $cutoffTime
            ]
        ]);
    }

    /**
     * Update cutoff or admin password.
     */
    public function update(Request $request)
    {
        $cutoffTime = $request->input('cutoffTime');
        $newPassword = $request->input('newPassword');

        if ($cutoffTime) {
            Config::updateOrCreate(
                ['key' => 'cutoffTime'],
                ['value' => trim($cutoffTime)]
            );
        }

        if ($newPassword) {
            if (strlen(trim($newPassword)) < 4) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password minimal 4 karakter'
                ], 400);
            }

            $hash = hash('sha256', $newPassword);
            Admin::where('username', 'admin')->update([
                'password_hash' => $hash
            ]);
        }

        $config = Config::where('key', 'cutoffTime')->first();
        $freshCutoff = $config ? $config->value : '08:00';

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi berhasil disimpan',
            'config' => [
                'cutoffTime' => $freshCutoff
            ]
        ]);
    }
}
