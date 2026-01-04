import { NextRequest, NextResponse } from "next/server";

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://kairos.localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

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
    if (sidCookie) {
      response.cookies.set("sid", sidCookie, {
        httpOnly: false, // Allow JS access for API calls
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
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
