<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Override;

class chat extends Model
{
    protected $fillable = [
        'type',
        'title',
        'avatar',
        'created_by',
        'updated_at',
        'status'
    ];
    protected static function boot()
    {
        parent::boot();
        static::creating(function ($chat) {
            $chat->chat_hash = (string) Str::uuid();
        });
    }
    public function users()
    {
        return $this->belongsToMany(User::class, 'chat_user');
    }
    public function lastMsg()
    {
        return $this->hasOne(messages::class, 'chat_id', 'id')
            ->whereDoesntHave('deletions', function ($query) {
                $query->where('user_id', auth()->id());
            })
            ->where('is_deleted_for_everyone', false)
            ->latest()
            ->with('recipients'); // taake accessor ke liye N+1 na ho
    }
    public function unreadCount()
    {
        return $this->hasMany(messages::class, 'chat_id')
        ->whereDoesntHave('deletions', function($query){
            $query->where('user_id', auth()->id());
        })
            ->where('is_deleted_for_everyone', false)
            ->whereHas('recipients', function($query){
                $query->where('status', '!=', 'seen')
                ->where('user_id', auth()->id());
            });
    }
    public function onlineUsers()
    {
        return $this->users
            ->where('id', '!=', auth()->id())
            ->map(function ($user) {
                return Cache::has('user-online-' . $user->id);
            });
    }
}
