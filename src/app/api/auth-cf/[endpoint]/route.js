import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { endpoint } = await params;
  
  try {
    const payload = await request.json();
    
    const url = `https://us-central1-netly-n3vyft.cloudfunctions.net/${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const text = await response.text();
      console.error(`Error from Cloud Function (${endpoint}): status=${response.status}, body=${text.slice(0, 1000)}`);
      return NextResponse.json(
        { error: { message: `Cloud Function returned status ${response.status}: ${text.slice(0, 200)}` } },
        { status: response.status || 500 }
      );
    }
  } catch (error) {
    console.error(`Route handler error for endpoint ${endpoint}:`, error);
    return NextResponse.json(
      { error: { message: error.message || "Internal Server Error" } },
      { status: 500 }
    );
  }
}
