<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Mail\resetPasswordMail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Mail;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'user_name',
        'avatar',
        'phone_number',
        'bio',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    public function sendPasswordResetNotification($token)
    {
        $url = url(route(
            'password.reset',
            [
                'token' => $token,
                'email' => $this->getEmailForPasswordReset()
            ],
            false
        ));
        Mail::to($this->email)->send(new resetPasswordMail($url, $this));
    }
    public function chats()
    {
        return $this->belongsToMany(chat::class, 'chat_user');
    }
    public function contacts()
    {
        return $this->hasMany(user_contacts::class, 'user_id', 'id');
    }
    public function groups()
    {
        return $this->chats()->where('type', 'group');
    }
    public function blockedUsers(){
        return $this->hasMany(user_contacts::class, 'user_id', 'id')->where('status', 'blocked');
    }
}
