import { NextRequest, NextResponse } from "next/server";

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://kairos.localhost:8000";

// Cookie durations
const SESSION_DURATION = undefined; // Session cookie - expires when browser closes
const REMEMBER_DURATION = 60 * 60 * 24 * 30; // 30 days in seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, rememberMe = false } = body;

    // Make login request to Frappe
    const frappeResponse = await fetch(FRAPPE_URL + "/api/method/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        usr: username,
        pwd: password,
      }),
    });

    const data = await frappeResponse.json();

    if (!frappeResponse.ok || data.exc_type) {
      return NextResponse.json(
        { error: data.message || "Login failed" },
        { status: 401 }
      );
    }

    // Get the sid cookie from Frappe response
    const setCookieHeader = frappeResponse.headers.get("set-cookie");
    let sidCookie = "";
    
    if (setCookieHeader) {
      const match = setCookieHeader.match(/sid=([^;]+)/);
      if (match) {
        sidCookie = match[1];
      }
    }

    // Create response with user data and sid
    const response = NextResponse.json({
      message: "Logged In",
      user: data.full_name || username,
      sid: sidCookie,
    });

    // Set the sid cookie for the client
    // If rememberMe is true, set a 30-day cookie; otherwise, session cookie
    if (sidCookie) {
      const cookieOptions: {
        httpOnly: boolean;
        path: string;
        sameSite: "lax";
        maxAge?: number;
      } = {
        httpOnly: false, // Allow JS access for API calls
        path: "/",
        sameSite: "lax",
      };

      // Only set maxAge if rememberMe is true (otherwise it's a session cookie)
      if (rememberMe) {
        cookieOptions.maxAge = REMEMBER_DURATION;
      }

      response.cookies.set("sid", sidCookie, cookieOptions);
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
