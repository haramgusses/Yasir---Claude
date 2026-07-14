import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/brand/Logo";

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo light tagline="Financial statements for community organisations" />
        </div>
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#1f7a5c",
              borderRadius: "0.625rem",
            },
          }}
        />
      </div>
    </div>
  );
}
