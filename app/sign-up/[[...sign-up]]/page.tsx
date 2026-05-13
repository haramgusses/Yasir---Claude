import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-app-black">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-burgundy rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">SQ</span>
            </div>
            <span className="text-white font-bold text-xl">ShipQR</span>
          </div>
          <p className="text-silver text-sm">Logistics Document Platform</p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
