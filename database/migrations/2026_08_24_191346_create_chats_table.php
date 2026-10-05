<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->uuid('chat_hash');
            $table->enum('type', ['direct', 'group'])->default('direct');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->string('title')->nullable(); // Group Name (direct me null rahega)
            $table->string('avatar')->nullable(); // Group Icon
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null'); // Group Creator/Admin
            $table->timestamp('last_message_at')->nullable(); // Inbox sorting fast karne ke liye
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chats');
    }
};