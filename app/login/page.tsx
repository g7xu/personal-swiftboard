import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="note bg-note-yellow p-8 pt-10 w-80 [transform:rotate(-2deg)] relative">
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-stamp shadow-md border border-ink/20" />
        <p className="font-print text-[11px] font-bold uppercase tracking-[0.2em] text-ink/60">
          Personal Swiftboard
        </p>
        <p className="font-hand text-3xl text-ink mt-2 leading-tight">
          Your week,
          <br />
          one sticky note at a time.
        </p>
        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/" })
          }}
        >
          <button
            type="submit"
            className="mt-6 w-full px-6 py-3 bg-ink text-paper rounded-sm font-print text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-90 transition-opacity cursor-pointer"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </main>
  )
}
