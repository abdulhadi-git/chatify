<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class chat_user extends Model
{
    protected $table = 'chat_user';
    protected $fillable = [
        'chat_id',
        'user_id',
        'role',
        'last_read_at',
        'is_muted'
    ];
}
