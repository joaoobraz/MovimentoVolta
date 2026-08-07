import type { Metadata } from "next";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { MemberApp } from "@/components/MemberApp";

export const metadata: Metadata = { title: "Meu espaço" };
export const dynamic = "force-dynamic";

export default async function AppPage(){
  await requireChatGPTUser("/app");
  return <MemberApp/>;
}
