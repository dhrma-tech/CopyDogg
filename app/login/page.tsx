import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
