import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js', 'resources/js/auth.js',  'resources/js/chats.js',  'resources/js/contacts.js',  'resources/js/discover.js',  'resources/js/echo.js',  'resources/js/forgotPassword.js',  'resources/js/groups.js',  'resources/js/otp.js',  'resources/js/reset-password.js',  'resources/js/script.js',  'resources/js/sharedFunctions.js',  'resources/js/signup.js'],
            refresh: true,
        }),
        tailwindcss(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
