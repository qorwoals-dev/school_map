import { NextRequest, NextResponse } from "next/server";
import { getSchools } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || "";

    const schools = await getSchools(keyword);

    return NextResponse.json({
      success: true,
      data: schools,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch schools",
      },
      { status: 500 }
    );
  }
}
