<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Http\Requests\signUpFormValidation;
use App\Models\User;
use Faker\Core\Uuid;
use Illuminate\Support\Facades\Mail;
use App\Mail\verifyOtpMail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;


class AuthController extends Controller
{
    public function showLoginForm()
    {
        return view('Auth.signin');
    }
    public function showRegisterForm()
    {
        return view('Auth.signup');
    }
    public function showForgotPasswordForm()
    {
        return view('Auth.forgotPassword');
    }
    public function signUp(signUpFormValidation $request)
    {
        $validatedData = $request->all();
        User::create([
            'name' => $validatedData['fullName'],
            'user_name' => $validatedData['username'],
            'email' => $validatedData['email'],
            'phone_number' => $validatedData['phone'],
            'password' => bcrypt($validatedData['password']),
        ]);
        $otp = rand(100000, 999999);
        $token = Str::uuid()->toString();
        Cache::put('otp_' . $token, [
            'email' => $validatedData['email'],
            'otp' => $otp,
        ], now()->addMinutes(10));
        Mail::to($validatedData['email'])->send(new verifyOtpMail($otp));
        return redirect()->route('otp', ['token' => $token]);
    }
    public function showOtpForm($token)
    {
        $otpData = Cache::get('otp_' . $token);
        if (!$otpData) {
            return redirect()->route('show-sign-in');
        }
        return view('Auth.otp', compact('otpData', 'token'));
    }
    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'otp_code' => 'required|digits:6',
            'otp_token' => 'required|uuid',
        ]);
        $otpData = Cache::get('otp_' . $data['otp_token']);
        if ($otpData && $otpData['otp'] == $data['otp_code']) {
            Cache::forget('otp_' . $data['otp_token']);
            $user = User::where('email', $otpData['email'])->first();
            $user->update(['email_verified_at' => now()]);
            Auth::login($user);
            return response()->json(['success' => true, 'message' => 'OTP verified successfully.']);
        } else {
            return response()->json(['success' => false, 'message' => 'Invalid OTP or token.'], 400);
        }
    }
    public function resendOtp(Request $request)
    {
        $token = $request->otp_token;
        $otpData = Cache::get('otp_' . $token);
        $newOtp = rand(100000, 999999);
        Cache::forget('otp_' . $token);
        Cache::put('otp_' . $token, [
            'email' => $otpData['email'],
            'otp' => $newOtp,
        ], now()->addMinutes(10));
        Mail::to($otpData['email'])->send(new verifyOtpMail($newOtp));

        return response()->json(['success' => true, 'message' => 'New OTP sent successfully.']);
    }
    public function login(Request $request)
    {
        $request->validate([
            'identifier' => 'string|required',
            'password' => 'required'
        ]);
        $fieldType = filter_var($request->identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'user_name';
        $credentials = [
            $fieldType => $request->identifier,
            'password' => $request->password
        ];
        $isRemember = $request->rememberMe ? true : false;
        if (!Auth::validate($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid Credentials',
            ]);
        }
        $user = User::where($fieldType, $request->identifier)->first();
        if ($user->email_verified_at == null) {
            $otp = rand(100000, 999999);
            $token = Str::uuid()->toString();
            Cache::put('otp_' . $token, [
                'otp' => $otp,
                'email' => $user->email
            ], now()->addMinutes(10));
            Mail::to($user->email)->send(new verifyOtpMail($otp));
            return response()->json([
                'success' => false,
                'is_unverified' => true,
                'email' => $user->email,
                'otp_token' => $token,
                'message' => 'Verify your email first'
            ]);
        }
        Auth::login($user, $isRemember);
        $request->session()->regenerate();
        return response()->json([
            'success' => true,
            'message' => 'Login successfull'
        ]);
    }
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => 'email|exists:users,email'
        ]);
        $status = Password::sendResetLink(
            $request->only('email')
        );
        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'success' => true,
                'message' => __($status)
            ]);
        }
        return response()->json([
            'success' => false,
            'error' => __($status),
        ]);
    }
    public function showResetPasswordForm(Request $request, $token)
    {
        $email = $request->email;
        $record = DB::table('password_reset_tokens')->where('email', $email)->first();
        if (!$record || !Hash::check($token, $record->token)) {
            return view('Errors.pageExpired');
        }
        return view('Auth.newPassword', compact('token', 'email'));
    }
    public function changePassword(Request $request)
    {
        $credentials = $request->validate([
            'password' => 'required',
            'confirm_password' => 'required',
            'email' => 'email|required|exists:users,email',
            'token' => 'required'
        ]);
        $status = Password::reset($credentials, function ($user, $password) {
            $user->forceFill([
                'password' => bcrypt($password),
            ])->save();
        });
        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'message' => 'Password updated.'
            ]);
        }
        return response()->json([
            'success' => false,
            'message' => 'Something went wrong updating your password.'
        ]);
    }
}
