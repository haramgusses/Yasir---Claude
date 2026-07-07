import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/brand/Logo";
import Background from "@/components/fx/Background";

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
      <Background />
      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo light tagline="Financial statements for community organisations" />
        </div>
        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#11A4AC",
              borderRadius: "0.625rem",
              colorBackground: "#0d1531",
              colorText: "#e8ecf8",
              colorInputBackground: "#131d40",
              colorInputText: "#e8ecf8",
            },
          }}
        />
      </div>
    </div>
  );
}
