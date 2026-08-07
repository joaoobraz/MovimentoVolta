import type { Metadata } from "next";
import { QuizExperience } from "@/components/QuizExperience";

export const metadata: Metadata = { title: "Diagnóstico gratuito" };
export default function QuizPage() { return <QuizExperience />; }
