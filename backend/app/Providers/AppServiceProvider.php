<?php

namespace App\Providers;

use App\Support\WindowsPostgreSqlDumper;
use Illuminate\Support\ServiceProvider;
use Spatie\Backup\Tasks\Backup\DbDumperFactory;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (PHP_OS_FAMILY === 'Windows') {
            DbDumperFactory::extend('pgsql', fn () => new WindowsPostgreSqlDumper);
        }
    }
}
