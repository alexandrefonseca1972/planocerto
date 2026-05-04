"use client";

import { useState } from "react";
import { LoginForm } from "@/components/forms/login-form";
import { RegisterForm } from "@/components/forms/register-form";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus } from "lucide-react";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("left");

  const switchTab = (tab: "login" | "register") => {
    if (tab === activeTab) return;
    setDirection(tab === "register" ? "left" : "right");
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-md">
      <CardHeader className="pb-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => switchTab(v as "login" | "register")}
          defaultValue="login"
        >
          <TabsList className="w-full">
            <TabsTrigger value="login">
              <LogIn className="mr-2 h-4 w-4" />
              Entrar
            </TabsTrigger>
            <TabsTrigger value="register">
              <UserPlus className="mr-2 h-4 w-4" />
              Criar conta
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div
          className="transition-all duration-150"
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning
              ? `translateX(${direction === "left" ? "-12px" : "12px"})`
              : "translateX(0)",
          }}
        >
          {activeTab === "login" ? (
            <LoginForm
              key="login"
              onSwitchToRegister={() => switchTab("register")}
            />
          ) : (
            <RegisterForm
              key="register"
              onSwitchToLogin={() => switchTab("login")}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
