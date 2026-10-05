<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class message_deletions extends Model
{
    protected $fillable = [
        'message_id',
        'user_id'
    ];
}
