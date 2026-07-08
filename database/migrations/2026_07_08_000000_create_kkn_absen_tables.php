<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. admin table
        if (!Schema::hasTable('admin')) {
            Schema::create('admin', function (Blueprint $table) {
                $table->id();
                $table->string('username', 50)->unique();
                $table->string('password_hash', 256);
            });

            // Seeding default admin (admin / admin123)
            DB::table('admin')->insert([
                'username' => 'admin',
                'password_hash' => '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
            ]);
        }

        // 2. config table
        if (!Schema::hasTable('config')) {
            Schema::create('config', function (Blueprint $table) {
                $table->string('key', 50)->primary();
                $table->string('value', 256);
            });

            // Seeding default cutoff time
            DB::table('config')->insert([
                'key' => 'cutoffTime',
                'value' => '08:00'
            ]);
        }

        // 3. members table
        if (!Schema::hasTable('members')) {
            Schema::create('members', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name', 100)->unique();
                $table->string('nim', 50);
                $table->string('fakultas', 100);
                $table->string('jurusan', 100);
            });

            // Seeding default members
            DB::table('members')->insert([
                [
                    'id' => '9b8c7150-1b2c-461d-8ff7-567472091410',
                    'name' => 'Ahmad Fauzi',
                    'nim' => '120120001',
                    'fakultas' => 'Fakultas Teknik',
                    'jurusan' => 'Teknik Informatika'
                ],
                [
                    'id' => '9b8c7150-1b2c-461d-8ff7-567472091411',
                    'name' => 'Budi Santoso',
                    'nim' => '120120002',
                    'fakultas' => 'Fakultas Ekonomi',
                    'jurusan' => 'Manajemen'
                ],
                [
                    'id' => '9b8c7150-1b2c-461d-8ff7-567472091412',
                    'name' => 'Citra Lestari',
                    'nim' => '120120003',
                    'fakultas' => 'Fakultas Hukum',
                    'jurusan' => 'Ilmu Hukum'
                ],
                [
                    'id' => '9b8c7150-1b2c-461d-8ff7-567472091413',
                    'name' => 'Dewi Sartika',
                    'nim' => '120120004',
                    'fakultas' => 'Fakultas Ilmu Budaya',
                    'jurusan' => 'Sastra Indonesia'
                ],
                [
                    'id' => '9b8c7150-1b2c-461d-8ff7-567472091414',
                    'name' => 'Eko Prasetyo',
                    'nim' => '120120005',
                    'fakultas' => 'Fakultas Ilmu Sosial',
                    'jurusan' => 'Sosiologi'
                ],
            ]);
        }

        // 4. attendance table
        if (!Schema::hasTable('attendance')) {
            Schema::create('attendance', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name', 100);
                $table->string('nim', 50);
                $table->string('fakultas', 100);
                $table->string('jurusan', 100);
                $table->timestamp('timestamp')->useCurrent();
                $table->string('status', 20);
            });
        }

        // 5. admin_tokens table
        if (!Schema::hasTable('admin_tokens')) {
            Schema::create('admin_tokens', function (Blueprint $table) {
                $table->string('token', 256)->primary();
                $table->string('username', 50);
                $table->timestamp('created_at')->useCurrent();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_tokens');
        Schema::dropIfExists('attendance');
        Schema::dropIfExists('members');
        Schema::dropIfExists('config');
        Schema::dropIfExists('admin');
    }
};
