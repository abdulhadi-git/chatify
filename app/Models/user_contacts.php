<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class user_contacts extends Model
{
    protected $fillable = [
        'user_id',
        'contact_id',
        'status'
    ];
    // reciever
    public function user(){
        return $this->belongsTo(User::class, 'contact_id', 'id' );
    }

    // sender
    public function sender(){
        return $this->belongsTo(User::class, 'user_id', 'id' );
    }

}
