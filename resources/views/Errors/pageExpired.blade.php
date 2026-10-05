<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page not found — Chatify</title>
    <!-- Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <!-- Fonts used by var(--font-display) / var(--font-body) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet">

    <!-- Shared auth styles -->
    <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
    <style>
        /*
         * Fallback design tokens.
         * These only apply if auth.css hasn't defined them yet — auth.css
         * (loaded above) will always win because it comes later in the
         * cascade for any variable it actually sets. This keeps the page
         * looking correct even if auth.css is missing, cached wrong, or
         * doesn't define every token this page uses.
         */
        :root {
            --primary: #14b8ae;
            --primary-dark: #0d7d76;
            --surface: #f4faf9;
            --background: #ffffff;
            --ink: #10221f;
            --ink-soft: #2e4744;
            --muted: #6b7c7a;
            --border: #e3ecea;
            --r-lg: 20px;
            --r-md: 14px;
            --shadow-lg: 0 30px 60px -20px rgba(13, 61, 56, 0.25);
            --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
            --font-display: 'Space Grotesk', sans-serif;
            --font-body: 'Inter', sans-serif;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: var(--font-body);
        }

        .error-body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            position: relative;
            overflow: hidden;
            background:
                radial-gradient(60% 50% at 15% 10%, rgba(94, 234, 212, 0.16) 0%, transparent 60%),
                radial-gradient(55% 45% at 90% 85%, rgba(20, 184, 174, 0.14) 0%, transparent 60%),
                var(--surface);
        }

        .error-blob {
            position: absolute;
            border-radius: 50%;
            background: linear-gradient(160deg, var(--primary-dark), var(--primary));
            opacity: 0.08;
            z-index: 0;
        }

        .error-blob.b1 {
            width: 420px;
            height: 420px;
            top: -140px;
            left: -120px;
        }

        .error-blob.b2 {
            width: 320px;
            height: 320px;
            bottom: -120px;
            right: -100px;
        }

        .error-card {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 480px;
            background: var(--background);
            border-radius: var(--r-lg);
            box-shadow: var(--shadow-lg);
            padding: 52px 44px 44px;
            text-align: center;
            opacity: 0;
            animation: rise 0.55s var(--ease-out) 0.05s forwards;
        }

        @keyframes rise {
            from {
                opacity: 0;
                transform: translateY(14px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes key-float {

            0%,
            100% {
                transform: translateY(0);
            }

            50% {
                transform: translateY(-6px);
            }
        }

        .error-badge {
            width: 72px;
            height: 72px;
            margin: 0 auto 26px;
            border-radius: var(--r-md);
            background: linear-gradient(135deg, var(--primary-dark), var(--primary));
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 1.9rem;
            box-shadow: 0 14px 28px -10px rgba(13, 125, 118, 0.5);
            animation: key-float 4s ease-in-out infinite;
        }

        .error-code {
            font-family: var(--font-display);
            font-weight: 700;
            font-size: 3.4rem;
            letter-spacing: -0.03em;
            line-height: 1;
            color: var(--primary-dark);
            margin: 0 0 10px;
        }

        .error-card h1 {
            font-family: var(--font-display);
            font-weight: 700;
            font-size: 1.45rem;
            letter-spacing: -0.02em;
            color: var(--ink);
            margin: 0 0 10px;
        }

        .error-card p {
            font-size: 0.94rem;
            line-height: 1.6;
            color: var(--muted);
            max-width: 360px;
            margin: 0 auto 30px;
        }

        .error-actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        /* Button fallback styling — this is what was missing/broken */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            width: 100%;
            text-decoration: none;
            font-family: var(--font-body);
            font-weight: 600;
            border-radius: var(--r-md);
            border: 1px solid transparent;
            cursor: pointer;
            transition: transform 0.15s var(--ease-out), box-shadow 0.15s var(--ease-out), opacity 0.15s;
        }

        .btn-lg-chatify {
            padding: 13px 20px;
            font-size: 0.96rem;
        }

        .btn-primary-chatify {
            background: linear-gradient(135deg, var(--primary-dark), var(--primary));
            color: #fff;
            box-shadow: 0 10px 22px -10px rgba(13, 125, 118, 0.55);
        }

        .btn-primary-chatify:hover {
            transform: translateY(-1px);
            box-shadow: 0 14px 26px -10px rgba(13, 125, 118, 0.6);
        }

        .btn-primary-chatify:active {
            transform: translateY(0);
        }

        .btn i {
            font-size: 0.95em;
        }

        .error-meta {
            margin-top: 26px;
            padding-top: 20px;
            border-top: 1px solid var(--border);
            font-size: 0.8rem;
            color: var(--muted);
            line-height: 1.8;
        }

        .error-meta .inline-link {
            color: var(--primary-dark);
            font-weight: 600;
            text-decoration: none;
        }

        .error-meta .inline-link:hover {
            text-decoration: underline;
        }

        .error-meta code {
            font-family: var(--font-body);
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 2px 7px;
            color: var(--ink-soft);
            white-space: nowrap;
        }

        @media (max-width: 480px) {
            .error-card {
                padding: 40px 26px 34px;
            }

            .error-code {
                font-size: 2.6rem;
            }
        }
    </style>
</head>

<body class="auth-body error-body">

    <span class="error-blob b1"></span>
    <span class="error-blob b2"></span>

    <div class="error-card">
        <div class="error-badge">
            <i class="fa-solid fa-comment-slash"></i>
        </div>

        <p class="error-code">419</p>
        <h1>This page does not exist</h1>
        <p>The page you're looking for doesn't exist, was moved, or the link is broken. Let's get you back to your
            chats.</p>

        <div class="error-actions">
            <a href="/" class="btn btn-primary-chatify btn-lg-chatify">
                <i class="fa-solid fa-house"></i> Back to home
            </a>
        </div>

        <div class="error-meta">
            Think this is a mistake? <a href="mailto:support@chatify.app" class="inline-link">Contact support</a>
            <br> &nbsp;&middot;&nbsp; Error code: <code>404_NOT_FOUND</code>
        </div>
    </div>
</body>

</html>