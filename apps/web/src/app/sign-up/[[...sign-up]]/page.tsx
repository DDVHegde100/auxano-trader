import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(199,199,199,0.06),transparent_50%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-2xl font-bold backdrop-blur-2xl shadow-[0_0_40px_rgba(0,200,83,0.15)]">
            A
          </div>
          <h1 className="text-2xl font-semibold">Join Auxano</h1>
          <p className="mt-1 text-[#B0B0B0]">
            $100,000 virtual capital awaits
          </p>
        </div>
        <SignUp
          appearance={{
            variables: {
              colorBackground: "#1A1A1A",
              colorInputBackground: "rgba(255,255,255,0.04)",
              colorInputText: "#F5F5F5",
              colorText: "#F5F5F5",
              colorTextSecondary: "#B0B0B0",
              colorPrimary: "#00C853",
              borderRadius: "12px",
            },
            elements: {
              card: "bg-white/[0.04] border border-white/[0.08] backdrop-blur-2xl shadow-2xl",
              socialButtonsBlockButton:
                "bg-white/[0.06] border-white/[0.08] hover:bg-white/[0.1]",
              formButtonPrimary: "bg-[#F5F5F5] text-[#111111] hover:bg-white",
            },
          }}
        />
      </div>
    </div>
  );
}
