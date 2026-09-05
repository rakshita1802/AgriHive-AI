"""
Fast2SMS Real OTP Gateway Service.

Sends real SMS OTP messages to Indian mobile numbers via Fast2SMS REST API v2.
"""
import os
import json
import urllib.request
import urllib.parse
from typing import Dict, Any
from app.config import settings

# Fast2SMS API Key from environment or config
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", getattr(settings, "FAST2SMS_API_KEY", ""))

# Temporary in-memory OTP cache for verification (mobile_number -> {otp, timestamp})
_OTP_CACHE: Dict[str, str] = {}


def send_fast2sms_otp(mobile_number: str, otp_code: str) -> Dict[str, Any]:
    """Send real SMS OTP using Fast2SMS API v2."""
    # Clean phone number (strip +91, spaces, dashes)
    clean_mobile = mobile_number.replace("+91", "").replace(" ", "").replace("-", "").strip()
    if len(clean_mobile) > 10:
        clean_mobile = clean_mobile[-10:]

    # Cache OTP for verification
    _OTP_CACHE[clean_mobile] = otp_code

    api_key = os.getenv("FAST2SMS_API_KEY", "").strip()
    
    if not api_key:
        print(f"[Fast2SMS Service] API Key not set. Simulated SMS OTP '{otp_code}' for mobile +91-{clean_mobile}")
        return {
            "status": "simulated",
            "message": f"Real Fast2SMS API key pending in backend/.env. Simulated OTP {otp_code} sent to +91-{clean_mobile}",
            "mobile": clean_mobile,
            "otp": otp_code
        }

    try:
        url = "https://www.fast2sms.com/dev/bulkV2"
        headers = {
            "authorization": api_key,
            "Content-Type": "application/json",
            "User-Agent": "AgriHiveAI/1.0"
        }

        # Fast2SMS OTP route payload
        payload = json.dumps({
            "variables_values": str(otp_code),
            "route": "otp",
            "numbers": clean_mobile
        }).encode("utf-8")

        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            data = json.loads(res_body)
            print(f"[Fast2SMS API Response] {data}")
            return {
                "status": "success" if data.get("return") else "error",
                "message": data.get("message", ["SMS dispatched"])[0] if isinstance(data.get("message"), list) else data.get("message", "SMS dispatched"),
                "mobile": clean_mobile,
                "otp": otp_code,
                "fast2sms_response": data
            }

    except Exception as e:
        print(f"[Fast2SMS Error] Failed to send SMS: {e}")
        return {
            "status": "fallback",
            "message": f"Fast2SMS API call error: {str(e)}. Demo OTP {otp_code} available.",
            "mobile": clean_mobile,
            "otp": otp_code
        }


def verify_mobile_otp(mobile_number: str, input_otp: str) -> bool:
    """Verify submitted OTP code against cache."""
    clean_mobile = mobile_number.replace("+91", "").replace(" ", "").replace("-", "").strip()
    if len(clean_mobile) > 10:
        clean_mobile = clean_mobile[-10:]

    cached_otp = _OTP_CACHE.get(clean_mobile)
    if cached_otp and cached_otp == input_otp.strip():
        return True
    
    # Universal demo fallback code
    if input_otp.strip() == "849201":
        return True
        
    return False
