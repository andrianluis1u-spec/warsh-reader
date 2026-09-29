import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  Eye,
  Gauge,
  ListChecks,
  Mic,
  Sparkles,
} from "lucide-react";
import logo from "@/assets/logo.svg";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

const FEATURES = [
  {
    icon: Mic,
    title: "Suivi en temps réel",
    desc: "L'app surligne chaque mot reconnu de la riwaya Warsh pendant que vous récitez.",
  },
  {
    icon: ListChecks,
    title: "Détection d'erreurs",
    desc: "Mots sautés, en trop ou erronés signalés aussitôt, avec horodatage — sans prétendre juger le tajwid.",
  },
  {
    icon: Eye,
    title: "Mode mémorisation",
    desc: "Le texte se cache et se révèle mot à mot au fil de la récitation, avec bouton « œil » de secours.",
  },
  {
    icon: Gauge,
    title: "Bilan de session",
    desc: "Précision, mots récités et liste d'erreurs pour mesurer vos progrès de mémorisation.",
  },
];

const STEPS = [
  { n: "١", t: "Choisissez", d: "Une sourate, et si vous voulez une plage d'ayat." },
  { n: "٢", t: "Récitez", d: "Autorisez le micro et récitez naturellement, à votre rythme." },
  { n: "٣", t: "Progressez", d: "Suivez le surlignage, corrigez, consultez votre bilan." },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const ctaHref = isAuthenticated ? "/recite" : "/auth?returnTo=%2Frecite";

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Tarteel Warsh" className="size-9 rounded-lg" />
            <span className="text-base font-bold tracking-tight">Tarteel Warsh</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Fonctionnalités</a>
            <a href="#how" className="transition-colors hover:text-foreground">Comment ça marche</a>
            <a href="#warsh" className="transition-colors hover:text-foreground">Warsh</a>
          </nav>
          <Button asChild className="cursor-pointer">
            <a href={ctaHref}>
              {isAuthenticated ? "Réciter" : "Commencer"}
              <ArrowLeft className="size-4" />
            </a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,--theme(--color-primary/8%),transparent_70%)]"
        />
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-20 text-center sm:px-6 sm:py-24">
          <motion.div {...fadeUp}>
            <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
              <Sparkles className="size-3.5 text-primary" />
              Riwaya Warsh ʿan Nafiʿ — 6 214 ayat
            </Badge>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.06 }}
            className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl"
          >
            Récitez le Coran,
            <span className="text-primary"> suivi mot à mot</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.12 }}
            className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Tarteel Warsh écoute votre récitation, suit le texte en temps réel,
            signale les écarts et révèle les mots cachés en mode mémorisation.
            Pensé pour la riwaya Warsh, interface en français.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.18 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Button size="lg" asChild className="h-12 cursor-pointer px-6 text-base">
              <a href={ctaHref}>
                <Mic className="size-5" />
                Essayer la récitation
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 cursor-pointer px-6 text-base">
              <a href="#features">Découvrir</a>
            </Button>
          </motion.div>

          {/* Preview card */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.24 }}
            className="w-full max-w-3xl pt-4"
          >
            <Card className="border-border/70 bg-card/90 text-start">
              <CardContent className="flex items-start justify-between gap-4 p-6">
                <div className="flex-1 space-y-2">
                  <p dir="rtl" className="font-arabic text-2xl leading-[2] sm:text-3xl">
                    <span className="rounded-md bg-emerald-500/15 px-1 text-emerald-900 dark:text-emerald-200">اَ۬لْحَمْدُ</span>{" "}
                    <span className="rounded-md bg-emerald-500/15 px-1 text-emerald-900 dark:text-emerald-200">لِلهِ</span>{" "}
                    <span className="rounded-md bg-emerald-500/15 px-1 text-emerald-900 dark:text-emerald-200">رَبِّ</span>{" "}
                    <span className="rounded-md bg-primary/15 px-1 ring-1 ring-primary/40">اِ۬لْعَٰلَمِينَ</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Aperçu du suivi : <span className="text-emerald-700 dark:text-emerald-400">vert = récité</span>, encadré = mot attendu.
                  </p>
                </div>
                <span className="mt-1 flex h-3 w-3 shrink-0 rounded-full bg-emerald-500" />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-secondary/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <motion.h2
            {...fadeUp}
            className="mb-3 text-center text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Conçu pour la récitation
          </motion.h2>
          <motion.p {...fadeUp} className="mx-auto mb-12 max-w-xl text-center text-sm text-muted-foreground">
            Un compagnon d'apprentissage fidèle au texte Warsh, du suivi live au bilan de session.
          </motion.p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
              >
                <Card className="h-full border-border/70 bg-card">
                  <CardContent className="flex h-full flex-col gap-3 p-5">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <f.icon className="size-5" />
                    </span>
                    <h3 className="font-semibold tracking-tight">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <motion.h2 {...fadeUp} className="mb-12 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Comment ça marche
          </motion.h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="flex flex-col items-center gap-3 text-center"
              >
                <span className="font-arabic flex size-12 items-center justify-center rounded-full bg-accent text-xl text-accent-foreground">
                  {s.n}
                </span>
                <h3 className="font-semibold tracking-tight">{s.t}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Warsh note */}
      <section id="warsh" className="border-t border-border/60 bg-secondary/30">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
          <motion.div {...fadeUp} className="flex flex-col items-center gap-4">
            <p dir="rtl" className="font-arabic text-3xl leading-relaxed text-foreground/90">
              وَرْشٌ عَنْ نَافِعٍ
            </p>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Le vrai texte Warsh, pas un habillage Hafs
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Le mushaf affiché provient de l'édition Qur'anpedia Warsh ʿan Nafiʿ :
              ses propres mots, sa propre numérotation (6 214 ayat, compte de Nafiʿ
              au lieu des 6 236 de Hafs) et son rasm maghrébin. Le moteur de
              reconnaissance est un Whisper affiné spécifiquement sur la récitation
              Warsh.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
          <motion.h2 {...fadeUp} className="max-w-2xl text-2xl font-bold tracking-tight sm:text-4xl">
            Prêt à réciter ?
          </motion.h2>
          <motion.div {...fadeUp}>
            <Button size="lg" asChild className="h-12 cursor-pointer px-8 text-base">
              <a href={ctaHref}>
                <Mic className="size-5" />
                Ouvrir l'application
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>Tarteel Warsh — compagnon de récitation, non affilié à Tarteel.ai.</p>
          <p>Texte : Qur'anpedia (Warsh) · Modèle : tahkik-small-warsh (Apache-2.0)</p>
        </div>
      </footer>
    </div>
  );
}
