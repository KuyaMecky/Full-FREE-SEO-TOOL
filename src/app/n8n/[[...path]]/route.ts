import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const N8N_URL = process.env.N8N_URL || "http://localhost:5678";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const pathStr = (params.path || []).join("/");
    const url = new URL(request.url);
    const queryString = url.search;

    const response = await fetch(`${N8N_URL}/${pathStr}${queryString}`, {
      method: "GET",
      headers: {
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(
            ([key]) =>
              ![
                "host",
                "connection",
                "content-length",
                "authorization",
              ].includes(key.toLowerCase())
          )
        ),
      },
    });

    const contentType = response.headers.get("content-type");
    const body = contentType?.includes("application/json")
      ? JSON.stringify(await response.json())
      : await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type": contentType || "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("n8n reverse proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to n8n" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pathStr = (params.path || []).join("/");
    const body = await request.text();

    const response = await fetch(`${N8N_URL}/${pathStr}`, {
      method: "POST",
      headers: {
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(
            ([key]) =>
              ![
                "host",
                "connection",
                "content-length",
                "authorization",
              ].includes(key.toLowerCase())
          )
        ),
      },
      body,
    });

    const contentType = response.headers.get("content-type");
    const responseBody = contentType?.includes("application/json")
      ? JSON.stringify(await response.json())
      : await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": contentType || "application/json",
      },
    });
  } catch (error) {
    console.error("n8n reverse proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to n8n" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pathStr = (params.path || []).join("/");
    const body = await request.text();

    const response = await fetch(`${N8N_URL}/${pathStr}`, {
      method: "PUT",
      headers: {
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(
            ([key]) =>
              ![
                "host",
                "connection",
                "content-length",
                "authorization",
              ].includes(key.toLowerCase())
          )
        ),
      },
      body,
    });

    const contentType = response.headers.get("content-type");
    const responseBody = contentType?.includes("application/json")
      ? JSON.stringify(await response.json())
      : await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": contentType || "application/json",
      },
    });
  } catch (error) {
    console.error("n8n reverse proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to n8n" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pathStr = (params.path || []).join("/");

    const response = await fetch(`${N8N_URL}/${pathStr}`, {
      method: "DELETE",
      headers: {
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(
            ([key]) =>
              ![
                "host",
                "connection",
                "content-length",
                "authorization",
              ].includes(key.toLowerCase())
          )
        ),
      },
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const contentType = response.headers.get("content-type");
    const body = contentType?.includes("application/json")
      ? JSON.stringify(await response.json())
      : await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type": contentType || "application/json",
      },
    });
  } catch (error) {
    console.error("n8n reverse proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to n8n" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pathStr = (params.path || []).join("/");
    const body = await request.text();

    const response = await fetch(`${N8N_URL}/${pathStr}`, {
      method: "PATCH",
      headers: {
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(
            ([key]) =>
              ![
                "host",
                "connection",
                "content-length",
                "authorization",
              ].includes(key.toLowerCase())
          )
        ),
      },
      body,
    });

    const contentType = response.headers.get("content-type");
    const responseBody = contentType?.includes("application/json")
      ? JSON.stringify(await response.json())
      : await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": contentType || "application/json",
      },
    });
  } catch (error) {
    console.error("n8n reverse proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to n8n" },
      { status: 500 }
    );
  }
}
