import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/brand/Logo";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-performa-onyx px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo light tagline="Financial statements for community organisations" />
        </div>
        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#11A4AC",
              borderRadius: "0.625rem",
            },
          }}
        />
      </div>
    </div>
  );
}
