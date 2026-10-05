<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset your Chatify password</title>
</head>
<body style="margin:0; padding:0; background-color:#eef4f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef4f2; padding:40px 16px;">
  <tr>
    <td align="center">

      <table role="presentation" width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">

        <!-- Logo / Header -->
        <tr>
          <td align="center" style="padding-bottom:16px;">
            <span style="font-size:19px; font-weight:700; color:#0f172a; letter-spacing:-0.02em;">Chatify</span>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background-color:#ffffff; border-radius:12px; border:1px solid #e2e8f0;">

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

              <!-- Top accent bar -->
              <tr>
                <td style="height:4px; background-color:#0f766e; border-radius:12px 12px 0 0; font-size:0; line-height:0;">&nbsp;</td>
              </tr>

              <tr>
                <td style="padding:40px 36px 36px;">

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                    <tr>
                      <td style="padding-bottom:16px;">
                        <h1 style="margin:0; font-size:20px; color:#0f172a; font-weight:700; letter-spacing:-0.01em;">
                          Reset your password
                        </h1>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding-bottom:8px;">
                        <p style="margin:0; font-size:14px; color:#475569; line-height:22px;">
                          Hello,
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding-bottom:28px;">
                        <p style="margin:0; font-size:14px; color:#475569; line-height:22px;">
                          We received a request to reset the password for your Chatify account. Click the button below to choose a new password. This link will expire in 60 minutes.
                        </p>
                      </td>
                    </tr>

                    <!-- Reset Button -->
                    <tr>
                      <td style="padding-bottom:28px;">
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="border-radius:8px; background-color:#0f766e;">
                              <a href="{{ $url }}"
                                 target="_blank"
                                 style="display:inline-block; padding:12px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px;">
                                Reset password
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding-bottom:20px; border-top:1px solid #f1f5f9;"></td>
                    </tr>

                    <!-- Fallback link -->
                    <tr>
                      <td style="padding-bottom:20px;">
                        <p style="margin:0 0 6px; font-size:12px; color:#94a3b8; line-height:18px;">
                          If the button above doesn't work, copy and paste this link into your browser:
                        </p>
                        <p style="margin:0; font-size:12px; color:#0f766e; line-height:18px; word-break:break-all;">
                          {{ $url }}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <p style="margin:0; font-size:12px; color:#94a3b8; line-height:18px;">
                          If you did not request a password reset, no further action is required and your password will remain unchanged.
                        </p>
                      </td>
                    </tr>

                  </table>

                </td>
              </tr>

            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding-top:28px;">
            <p style="margin:0 0 4px; font-size:12px; color:#94a3b8;">
              &copy; {{ date('Y') }} Chatify. All rights reserved.
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>