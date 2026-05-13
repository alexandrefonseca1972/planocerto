"use client";

import { LoginForm } from "@/components/forms/login-form";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  return (
    <>
      <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-md">
        <CardContent className="pt-6">
          <LoginForm />
        </CardContent>
      </Card>
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao início
        </Link>
      </div>
    </>
  );
}
