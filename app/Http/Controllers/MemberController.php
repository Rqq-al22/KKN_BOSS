<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Member;

class MemberController extends Controller
{
    /**
     * Get all members.
     */
    public function index()
    {
        $members = Member::orderBy('name', 'asc')->get();
        return response()->json([
            'success' => true,
            'members' => $members
        ]);
    }

    /**
     * Add a new member.
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
                'message' => 'Semua profil (Nama, NIM, Fakultas, Jurusan) harus diisi'
            ], 400);
        }

        $cleanName = trim($name);
        if (empty($cleanName)) {
            return response()->json([
                'success' => false,
                'message' => 'Nama tidak boleh kosong'
            ], 400);
        }

        // Case-insensitive check for duplicate members
        $exists = Member::whereRaw('LOWER(name) = ?', [strtolower($cleanName)])->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Anggota sudah terdaftar'
            ], 400);
        }

        Member::create([
            'name' => $cleanName,
            'nim' => trim($nim),
            'fakultas' => trim($fakultas),
            'jurusan' => trim($jurusan),
        ]);

        $members = Member::orderBy('name', 'asc')->get();
        return response()->json([
            'success' => true,
            'members' => $members
        ]);
    }

    /**
     * Delete a member.
     */
    public function destroy(Request $request)
    {
        $name = $request->input('name');

        if (!$name) {
            return response()->json([
                'success' => false,
                'message' => 'Nama harus dicantumkan'
            ], 400);
        }

        Member::where('name', $name)->delete();

        $members = Member::orderBy('name', 'asc')->get();
        return response()->json([
            'success' => true,
            'members' => $members
        ]);
    }
}
