<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class messages extends Model
{
    protected $fillable = [
        'chat_id',
        'sender_id',
        'message',
        'file_path',
        'file_size',
        'created_at',
        'type',
        'status'
    ];
    public function chat()
    {
        return $this->belongsTo(chat::class, 'chat_id');
    }
    public function deletions()
    {
        return $this->hasMany(message_deletions::class, 'message_id', 'id');
    }
    
public function recipients()
{
    return $this->hasMany(message_recipients::class, 'message_id');
}

// Aggregate status accessor - sirf sender ke liye معنی رکھتا ہے
public function getStatusAttribute()
{
    if ($this->sender_id !== auth()->id()) {
        return null; // ya kuch bhi, receiver ke liye status irrelevant hai
    }

    $statuses = $this->recipients; // already eager-loaded honi chahiye

    if ($statuses->isEmpty()) {
        return 'sent';
    }

    if ($statuses->every(fn($r) => $r->status === 'seen')) {
        return 'seen';
    }

    if ($statuses->contains(fn($r) => in_array($r->status, ['delivered', 'seen']))) {
        return 'delivered';
    }

    return 'sent';
}

protected $appends = ['status'];
}
