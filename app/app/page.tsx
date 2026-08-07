import type { Metadata } from "next";
import { requireSessionUser } from "@/app/session-auth";
import { MemberApp } from "@/components/MemberApp";

export const metadata: Metadata = { title: "Meu espaço" };
export const dynamic = "force-dynamic";

export default async function AppPage(){
  await requireSessionUser("/app");
  return <MemberApp/>;
}
