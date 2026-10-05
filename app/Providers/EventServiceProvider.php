<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Events\Login;
use App\Listeners\MarkMessagesDeliveredOnLogin;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        Login::class => [
            MarkMessagesDeliveredOnLogin::class,
        ],
    ];

    public function boot(): void
    {
        //
    }
}
