import type { Metadata } from "next";
import { ResultPage } from "@/components/ResultPage";
export const metadata: Metadata = { title: "Seu diagnóstico" };
export default function Page(){ return <ResultPage/>; }
