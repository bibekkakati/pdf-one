import heroGradient from "@/assets/hero-gradient.jpg";
import preview from "@/assets/workspace-preview.jpg";
import FeatureGrid from "@/components/landing/FeatureGrid";
import {
    LaserDemo,
    MarkupDemo,
    PagesDemo,
    ProtectDemo,
} from "@/components/landing/Showcase";
import { Button } from "@/components/ui/button";
import {
    MAX_PDF_BYTES,
    saveWorkingPdf,
    tooLargeMessage,
} from "@/lib/pdfStorage";
import {
    ArrowRight,
    Files,
    FileText,
    Highlighter,
    Image as ImageIcon,
    Lock,
    Pencil,
    PenLine,
    Plus,
    ShieldCheck,
    Square,
    Type,
    Upload,
    Zap,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const steps = [
    { icon: PenLine, label: "Sign", tone: "bg-highlight-lime" },
    { icon: Type, label: "Text", tone: "bg-highlight-blue" },
    { icon: Highlighter, label: "Highlight", tone: "bg-highlight-yellow" },
    { icon: Pencil, label: "Draw", tone: "bg-highlight-orange" },
    { icon: Square, label: "Box", tone: "bg-highlight-purple" },
    { icon: ImageIcon, label: "Image", tone: "bg-highlight-pink" },
    { icon: Files, label: "Pages", tone: "bg-highlight-green" },
    { icon: Lock, label: "Protect", tone: "bg-highlight-red" },
];

const faqs = [
    {
        q: "Is PDF One really a free PDF editor?",
        a: "Yes. Editing and signing are free, with no account, no trial and no watermark.",
    },
    {
        q: "Is my signature legally valid?",
        a: "PDF One adds an electronic signature image to your document. Many agreements accept this, but check the requirements for your document and country.",
    },
    {
        q: "Are my PDFs and signatures uploaded anywhere?",
        a: "No. Your PDF and signature are processed entirely in your browser and never leave your device.",
    },
    {
        q: "What can I edit?",
        a: "Add signatures, text, highlights, freehand drawings, colour boxes and images on any page. Everything can be moved, resized or removed before you download.",
    },
    {
        q: "Can I delete or reorder pages?",
        a: "Yes. Insert blank pages, reorder pages or mark pages for deletion. Nothing changes in the file until you download, so you can undo anytime.",
    },
    {
        q: "How does password protection work?",
        a: "Set a password in Protect and your downloaded PDF will ask for it when opened. The password is applied in your browser and never sent anywhere.",
    },
    {
        q: "What is the laser pointer for?",
        a: "It shows a red pointer on screen so people on a screen-share call can follow along. It does not change your PDF.",
    },
    {
        q: "Can I undo changes?",
        a: "Yes. Undo and redo work across every edit, and we warn you before leaving with changes you have not downloaded.",
    },
    {
        q: "Does it handle large PDFs?",
        a: "Pages load one at a time, so long documents stay quick.",
    },
];

const Landing = () => {
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);

    const handleFile = useCallback(
        async (file: File) => {
            if (file.size > MAX_PDF_BYTES) {
                toast.error(tooLargeMessage);
                return;
            }
            setBusy(true);
            // Kept in memory for an instant hand-off; the stored copy (for refresh) finishes in the background
            saveWorkingPdf(file).catch(() => {});
            sessionStorage.removeItem("pdfData");
            navigate("/workspace");
        },
        [navigate],
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop: (files) => files[0] && handleFile(files[0]),
        onDropRejected: () => toast.error("Please choose a PDF file."),
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
        noClick: true,
        noKeyboard: true,
    });

    return (
        <div
            {...getRootProps()}
            className="min-h-screen bg-background text-foreground outline-none"
        >
            <input {...getInputProps()} />

            {isDragActive && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm">
                    <div className="rounded-2xl border-2 border-dashed border-foreground px-16 py-12 text-center">
                        <Upload className="mx-auto h-8 w-8" />
                        <p className="mt-4 text-xl font-medium">
                            Drop your PDF to edit and sign
                        </p>
                    </div>
                </div>
            )}

            <header className="border-b">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <a
                        href="#"
                        className="flex items-center"
                        aria-label="PDF One home"
                    >
                        <img
                            src="/logo.png"
                            alt="PDF One"
                            width={40}
                            height={40}
                            className="h-10 w-10"
                        />
                    </a>
                    <nav className="hidden items-center gap-8 text-sm md:flex">
                        <a
                            href="#features"
                            className="hover:text-muted-foreground"
                        >
                            Features
                        </a>
                        <a
                            href="#privacy"
                            className="hover:text-muted-foreground"
                        >
                            Privacy
                        </a>
                        <a href="#faq" className="hover:text-muted-foreground">
                            FAQ
                        </a>
                    </nav>
                    <Button size="sm" onClick={open}>
                        Edit a PDF
                    </Button>
                </div>
            </header>

            {/* Hero */}
            <section className="relative bg-grid">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
                <div className="relative mx-auto max-w-4xl px-6 pb-28 pt-24 text-center">
                    <h1 className="text-5xl font-medium leading-[1.15] md:text-7xl md:leading-[1.15]">
                        The free PDF editor that keeps your files{" "}
                        <span className="rounded-md bg-highlight-lime px-2 italic">
                            private.
                        </span>
                    </h1>
                    <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
                        Sign, fill in, highlight, draw, organize pages and
                        password-protect your PDFs — all in your browser.
                        Nothing is uploaded, no account, no watermark.
                    </p>
                    <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                        <Button size="lg" onClick={open} disabled={busy}>
                            {busy ? "Opening…" : "Upload a PDF"}{" "}
                            <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <a href="#features">See features</a>
                        </Button>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                        or drag &amp; drop a PDF anywhere on this page
                    </p>
                </div>
            </section>

            {/* Product band */}
            <section className="relative">
                <div className="relative z-10 mx-auto -mb-px flex w-fit -translate-y-1 justify-center rounded-t-[2.5rem] bg-background px-6 pt-4 pb-3 sm:px-10">
                    <div className="grid grid-cols-2 gap-3.5 sm:flex sm:flex-wrap sm:justify-center">
                        {steps.map(({ icon: Icon, label, tone }) => (
                            <span
                                key={label}
                                className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm shadow-sm"
                            >
                                <span
                                    className={`grid h-5 w-5 place-items-center rounded ${tone}`}
                                >
                                    <Icon className="h-3 w-3" />
                                </span>
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="relative overflow-hidden">
                    <img
                        src={heroGradient}
                        alt=""
                        width={1920}
                        height={832}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="relative mx-auto max-w-5xl px-6 pt-14">
                        <div className="overflow-hidden rounded-t-2xl border border-b-0 bg-background p-2 pb-0 shadow-2xl">
                            <img
                                src={preview}
                                alt="PDF One free PDF editor signing an agreement with a typed signature"
                                className="w-full rounded-t-lg"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="scroll-mt-8 py-28">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
                        <h2 className="max-w-xl text-4xl font-medium leading-tight md:text-5xl">
                            Everything you need in one free PDF editor
                        </h2>
                        <Button onClick={open}>
                            Try it now <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                    <FeatureGrid />
                </div>
            </section>

            {/* Showcase */}
            <section className="border-t py-28">
                <div className="mx-auto max-w-6xl px-6">
                    <h2 className="max-w-2xl text-4xl font-medium leading-tight md:text-5xl">
                        Things you need
                    </h2>
                    <p className="mt-4 max-w-xl text-muted-foreground">
                        Mark up documents, tidy up pages, lock files and present
                        them — without installing anything.
                    </p>
                    <div className="mt-14 grid gap-6 md:grid-cols-2">
                        <MarkupDemo />
                        <PagesDemo />
                        <ProtectDemo />
                        <LaserDemo />
                    </div>
                </div>
            </section>

            {/* Privacy */}
            <section id="privacy" className="scroll-mt-8 border-y bg-grid">
                <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-3">
                    {[
                        {
                            icon: ShieldCheck,
                            title: "Private by design",
                            text: "Your PDFs, signatures and passwords stay in your browser. Nothing is uploaded, stored or read on a server.",
                        },
                        {
                            icon: Zap,
                            title: "No sign-up",
                            text: "Open the page, drop a PDF and start editing. That is the whole onboarding.",
                        },
                        {
                            icon: FileText,
                            title: "Built for long documents",
                            text: "Pages load one at a time with thumbnails, so big contracts stay smooth.",
                        },
                    ].map(({ icon: Icon, title, text }) => (
                        <div
                            key={title}
                            className="rounded-xl border bg-background p-7"
                        >
                            <Icon className="h-6 w-6 text-brand" />
                            <h3 className="mt-5 text-xl font-medium">
                                {title}
                            </h3>
                            <p className="mt-2 text-muted-foreground">{text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="scroll-mt-8 py-28">
                <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[1fr_1.4fr]">
                    <h2 className="text-4xl font-medium leading-tight md:text-5xl">
                        Questions, answered
                    </h2>
                    <div className="divide-y border-y">
                        {faqs.map((f) => (
                            <details key={f.q} className="group py-5">
                                <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-medium">
                                    {f.q}
                                    <Plus className="h-5 w-5 transition-transform group-open:rotate-45" />
                                </summary>
                                <p className="mt-3 text-muted-foreground">
                                    {f.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="px-6 pb-24">
                <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl">
                    <img
                        src={heroGradient}
                        alt=""
                        loading="lazy"
                        width={1920}
                        height={832}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="relative m-2 rounded-[1.25rem] bg-background/90 px-8 py-16 text-center backdrop-blur">
                        <h2 className="text-4xl font-medium md:text-5xl">
                            Edit and sign your PDF
                        </h2>
                        <p className="mt-4 text-muted-foreground">
                            No sign-up, no watermark. Done in under a minute.
                        </p>
                        <Button size="lg" className="mt-8" onClick={open}>
                            <Upload className="mr-1 h-4 w-4" /> Upload a PDF
                        </Button>
                    </div>
                </div>
            </section>

            <footer className="border-t">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                        <img
                            src="/logo.png"
                            alt="PDF One"
                            width={32}
                            height={32}
                            className="h-8 w-8"
                        />
                    </span>
                    <span>Made with ❤️ in India</span>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
