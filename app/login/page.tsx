import { redirect } from "next/navigation";
import { authenticatedUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
export default async function LoginPage() {
  if (await authenticatedUser()) redirect("/");
  return <LoginForm />;
}
