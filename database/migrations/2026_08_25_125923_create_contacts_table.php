<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_contacts', function (Blueprint $table) {
            $table->id();

            // The user who sent / owns this contact entry
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            // The user being added as a contact
            $table->foreignId('contact_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            // pending  -> request sent, not yet accepted
            // added    -> accepted / connected
            // blocked  -> optional, if you want block support later
            $table->enum('status', ['pending', 'added', 'blocked'])
                  ->default('pending');

            $table->timestamps();

            // A user can only have ONE row per contact (no duplicates)
            $table->unique(['user_id', 'contact_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_contacts');
    }
};