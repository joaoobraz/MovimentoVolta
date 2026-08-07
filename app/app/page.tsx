import type { Metadata } from "next";
import { MemberApp } from "@/components/MemberApp";
export const metadata: Metadata = { title: "Meu espaço" };
export const dynamic = "force-dynamic";
export default function AppPage(){return <MemberApp/>}
