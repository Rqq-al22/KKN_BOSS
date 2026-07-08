<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attendance;
use App\Models\Config;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * Submit attendance record.
     */
    public function store(Request $request)
    {
        $name = $request->input('name');
        $nim = $request->input('nim');
        $fakultas = $request->input('fakultas');
        $jurusan = $request->input('jurusan');

        if (!$name || !$nim || !$fakultas || !$jurusan) {
            return response()->json([
                'success' => false,
                'message' => 'Semua field (Nama, NIM, Fakultas, Jurusan) harus diisi'
            ], 400);
        }

        $now = Carbon::now()->timezone('Asia/Jakarta');
        $nowHour = (int)$now->format('H');
        $nowMin = (int)$now->format('i');
        $nowTimeVal = $nowHour * 60 + $nowMin;

        // Check if member already attended today (using start and end of Jakarta day in UTC)
        $startOfDay = Carbon::now()->timezone('Asia/Jakarta')->startOfDay()->timezone('UTC');
        $endOfDay = Carbon::now()->timezone('Asia/Jakarta')->endOfDay()->timezone('UTC');

        $alreadyAttended = Attendance::where('name', $name)
            ->whereBetween('timestamp', [$startOfDay, $endOfDay])
            ->exists();

        if ($alreadyAttended) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah mengisi absen hari ini!'
            ], 400);
        }

        // Get Cutoff Configuration
        $config = Config::where('key', 'cutoffTime')->first();
        $cutoffTime = $config ? $config->value : '08:00';

        [$cutoffHour, $cutoffMin] = explode(':', $cutoffTime);
        $cutoffTimeVal = (int)$cutoffHour * 60 + (int)$cutoffMin;

        $status = 'Hadir';
        if ($nowTimeVal > $cutoffTimeVal) {
            $status = 'Telat';
        }

        $record = Attendance::create([
            'name' => $name,
            'nim' => $nim,
            'fakultas' => $fakultas,
            'jurusan' => $jurusan,
            'timestamp' => Carbon::now(),
            'status' => $status
        ]);

        return response()->json([
            'success' => true,
            'record' => [
                'id' => $record->id,
                'name' => $record->name,
                'nim' => $record->nim,
                'fakultas' => $record->fakultas,
                'jurusan' => $record->jurusan,
                'timestamp' => Carbon::parse($record->timestamp)->toIso8601ZuluString(),
                'status' => $record->status
            ]
        ]);
    }

    /**
     * Get all attendance logs.
     */
    public function index()
    {
        $logs = Attendance::orderBy('timestamp', 'desc')->get()->map(function ($log) {
            return [
                'id' => $log->id,
                'name' => $log->name,
                'nim' => $log->nim,
                'fakultas' => $log->fakultas,
                'jurusan' => $log->jurusan,
                'timestamp' => Carbon::parse($log->timestamp)->toIso8601ZuluString(),
                'status' => $log->status
            ];
        });

        return response()->json([
            'success' => true,
            'attendance' => $logs
        ]);
    }

    /**
     * Clear all attendance records.
     */
    public function clear()
    {
        try {
            Attendance::truncate();
            return response()->json([
                'success' => true,
                'message' => 'Semua rekap absensi berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus rekap absensi'
            ], 500);
        }
    }
}
