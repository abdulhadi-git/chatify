<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Chatify password was changed</title>
</head>
<body style="margin:0; padding:0; background-color:#eef4f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

{{--
    Variables:
      $name      (zaroori)  user ka naam
      $time      (zaroori)  password kab badla, e.g. "4 Oct 2026, 3:45 PM"
      $ip        (optional) change karne wala IP
      $device    (optional) browser / device, e.g. "Chrome on Windows"
--}}

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
                          Your password was changed
                        </h1>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding-bottom:8px;">
                        <p style="margin:0; font-size:14px; color:#475569; line-height:22px;">
                          Hello {{ $name }},
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding-bottom:24px;">
                        <p style="margin:0; font-size:14px; color:#475569; line-height:22px;">
                          The password for your Chatify account was changed successfully. You can now sign in with your new password.
                        </p>
                      </td>
                    </tr>

                    <!-- Change details -->
                    <tr>
                      <td style="padding-bottom:28px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
                          <tr>
                            <td style="padding:14px 16px;">
                              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding:3px 0; font-size:12px; color:#94a3b8; line-height:18px; width:72px;">When</td>
                                  <td style="padding:3px 0; font-size:13px; color:#0f172a; line-height:18px; font-weight:600;">{{ $time }}</td>
                                </tr>
                                @if (!empty($device))
                                  <tr>
                                    <td style="padding:3px 0; font-size:12px; color:#94a3b8; line-height:18px; width:72px;">Device</td>
                                    <td style="padding:3px 0; font-size:13px; color:#0f172a; line-height:18px; font-weight:600;">{{ $device }}</td>
                                  </tr>
                                @endif
                                @if (!empty($ip))
                                  <tr>
                                    <td style="padding:3px 0; font-size:12px; color:#94a3b8; line-height:18px; width:72px;">IP address</td>
                                    <td style="padding:3px 0; font-size:13px; color:#0f172a; line-height:18px; font-weight:600;">{{ $ip }}</td>
                                  </tr>
                                @endif
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <p style="margin:0; font-size:12px; color:#94a3b8; line-height:18px;">
                          If you made this change, no further action is required. If this wasn't you, please contact support right away.
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