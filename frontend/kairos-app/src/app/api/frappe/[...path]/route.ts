import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://kairos.localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const search = request.nextUrl.search;
  const url = FRAPPE_URL + "/" + pathStr + search;

  const cookieStore = await cookies();
  const sid = cookieStore.get("sid")?.value;
  
  console.log("[Frappe Proxy] GET", url, "sid:", sid ? "present" : "missing");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: sid ? "sid=" + sid : "",
      },
    });

    const data = await response.json();
    
    if (data.exc_type) {
      console.log("[Frappe Proxy] Error:", data.exc_type, data.message);
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Frappe Proxy] Error:", error);
    return NextResponse.json({ error: "API request failed" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const url = FRAPPE_URL + "/" + pathStr;

  const cookieStore = await cookies();
  const sid = cookieStore.get("sid")?.value;

  console.log("[Frappe Proxy] POST", url, "sid:", sid ? "present" : "missing");

  try {
    const body = await request.json();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Cookie: sid ? "sid=" + sid : "",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Frappe Proxy] Error:", error);
    return NextResponse.json({ error: "API request failed" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const url = FRAPPE_URL + "/" + pathStr;

  const cookieStore = await cookies();
  const sid = cookieStore.get("sid")?.value;

  try {
    const body = await request.json();
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Cookie: sid ? "sid=" + sid : "",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Frappe Proxy] Error:", error);
    return NextResponse.json({ error: "API request failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const url = FRAPPE_URL + "/" + pathStr;

  const cookieStore = await cookies();
  const sid = cookieStore.get("sid")?.value;

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Cookie: sid ? "sid=" + sid : "",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Frappe Proxy] Error:", error);
    return NextResponse.json({ error: "API request failed" }, { status: 500 });
  }
}
