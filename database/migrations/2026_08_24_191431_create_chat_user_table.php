<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('role', ['member', 'admin'])->default('member'); // Group admins manage karne ke liye
            $table->timestamp('last_read_at')->nullable(); // Unread messages tracking ke liye
            $table->boolean('is_muted')->default(false);
            $table->timestamp('muted_at')->nullable();  
            $table->timestamps();

            // Guard: Ek hi chat me ek user dubara add na ho sake
            $table->unique(['chat_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_user');
    }
};