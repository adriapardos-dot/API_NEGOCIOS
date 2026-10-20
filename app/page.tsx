import { CalculadoraPresupuesto } from "@/components/calculadora-presupuesto"

export default function Page() {
  return (
    <main className="relative isolate min-h-svh overflow-hidden px-4 py-10 sm:px-6 sm:py-16">
      {/* Fondo de color: el cristal transparente deja ver lo que hay detrás. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-violet-200 via-sky-100 to-pink-200 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950" />
        <div className="absolute top-[-10%] left-[-5%] size-[34rem] rounded-full bg-violet-400/50 blur-3xl dark:bg-violet-600/40" />
        <div className="absolute top-[25%] left-[30%] size-[30rem] rounded-full bg-sky-300/60 blur-3xl dark:bg-sky-600/30" />
        <div className="absolute top-[10%] right-[-8%] size-[32rem] rounded-full bg-fuchsia-300/50 blur-3xl dark:bg-fuchsia-700/30" />
        <div className="absolute bottom-[-15%] left-[10%] size-[30rem] rounded-full bg-indigo-300/50 blur-3xl dark:bg-indigo-600/30" />
        <div className="absolute right-[5%] bottom-[-10%] size-[28rem] rounded-full bg-cyan-300/50 blur-3xl dark:bg-cyan-700/25" />
      </div>
      <CalculadoraPresupuesto />
    </main>
  )
}
