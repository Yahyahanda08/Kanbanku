<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boards', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->unsignedBigInteger('owner_id');
            $table->foreign('owner_id')->references('id')->on('users')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('board_user', function (Blueprint $table) {
            $table->unsignedBigInteger('board_id');
            $table->unsignedBigInteger('user_id');
            $table->string('role')->default('member');
            $table->primary(['board_id', 'user_id']);
            $table->foreign('board_id')->references('id')->on('boards')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('board_user');
        Schema::dropIfExists('boards');
    }
};