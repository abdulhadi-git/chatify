<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class message_recipients extends Model
{
    public function user(){
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
    public function message()
{
    return $this->hasOne(messages::class, 'id', 'message_id');
}
}
