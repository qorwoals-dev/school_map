import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-bold text-[#222222]">로그인에 실패했어요</h1>
      <p className="text-sm text-[#6a6a6a]">GitHub 인증 중 문제가 발생했습니다. 다시 시도해주세요.</p>
      <Link
        href="/map"
        className="px-4 py-2 rounded-full bg-[#ff385c] text-white text-sm font-semibold hover:opacity-90"
      >
        지도로 돌아가기
      </Link>
    </main>
  );
}
