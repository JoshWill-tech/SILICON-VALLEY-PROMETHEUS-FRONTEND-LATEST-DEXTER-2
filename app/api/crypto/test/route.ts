import { NextResponse } from "next/server";
import { sealToken, unsealToken } from "@/lib/crypto/token-vault";

export async function GET() {
  try {
    const plaintext = "hello";
    const sealed = await sealToken(plaintext);
    const unsealed = await unsealToken(sealed);

    if (unsealed === plaintext) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: "Mismatch" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Crypto test failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
