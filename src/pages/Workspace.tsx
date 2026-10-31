import EditableFileName from "@/components/EditableFileName";
import PDFViewer from "@/components/PDFViewer";
import SignaturePad from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import LaserPointer from "@/components/viewer/LaserPointer";
import {
    DeletePagesDialog,
    OrganizePagesDialog,
    ProtectDialog,
    UnlockDialog,
} from "@/components/workspace/PageDialogs";
import {
    ALL_TOOLS,
    ElementSettings,
    FILE_TOOLS,
    HIGHLIGHT_COLORS,
    STROKE_WIDTHS,
    TOOLS,
    ToolId,
    ToolSettings,
} from "@/components/workspace/SettingsPanels";
import { useHistoryState } from "@/hooks/useHistoryState";
import { hasUndownloadedEdits } from "@/lib/downloadState";
import {
    EditorElement,
    exportPdf,
    newId,
    protectPdf,
    strokeToElement,
} from "@/lib/editorElements";
import { loadImageSize, measureText } from "@/lib/imageUtils";
import {
    PageEntry,
    blankPage,
    isPasswordProtectedError,
} from "@/lib/pageModel";
import { inspectPages as readPages } from "@/lib/pdfInspect";
import {
    MAX_PDF_BYTES,
    loadWorkingPdf,
    saveWorkingPdf,
    tooLargeMessage,
} from "@/lib/pdfStorage";
import {
    Grid3x3,
    LucideArrowLeft,
    LucideDownload,
    LucideFileUp,
    PanelRightClose,
    PanelRightOpen,
    Pointer,
    Redo2,
    Undo2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Workspace = () => {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [hasRenamedFile, setHasRenamedFile] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const history = useHistoryState<{
        elements: EditorElement[];
        pages: PageEntry[];
    }>({ elements: [], pages: [] });
    const { elements, pages } = history.value;
    const setElements = (fn: (prev: EditorElement[]) => EditorElement[]) =>
        history.set((d) => ({ ...d, elements: fn(d.elements) }));
    const setPages = (fn: (prev: PageEntry[]) => PageEntry[]) =>
        history.set((d) => ({ ...d, pages: fn(d.pages) }));
    const [password, setPassword] = useState<string | null>(null);
    // Password the uploaded file already had; the download keeps it unless the user changes or removes it
    const [originalPassword, setOriginalPassword] = useState<string | null>(
        null,
    );
    const [locked, setLocked] = useState<{
        file: File;
        replace: boolean;
    } | null>(null);
    // Encrypted original kept for the stored copy so a refresh asks for the password again
    const encryptedRef = useRef<File | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showGrid, setShowGrid] = useState(false);
    const [laser, setLaser] = useState(false);
    const [dialog, setDialog] = useState<
        "delete" | "organize" | "protect" | null
    >(null);
    const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0]);
    const [drawColor, setDrawColor] = useState("#000000");
    const [drawWidth, setDrawWidth] = useState(STROKE_WIDTHS[1].value);
    const snapshotOf = (
        els: EditorElement[],
        pgs: PageEntry[],
        pw: string | null,
    ) => JSON.stringify({ els, pgs, pw });
    const currentSnapshot = snapshotOf(elements, pages, password);
    const [downloadedSnapshot, setDownloadedSnapshot] =
        useState(currentSnapshot);
    const hasPendingEdits = hasUndownloadedEdits(
        currentSnapshot,
        downloadedSnapshot,
    );
    const pagesChanged = pages.some((p, i) => p.source !== i || p.deleted);

    // On small screens, render the full desktop workspace scaled down (pinch to zoom) instead of a mobile layout
    useEffect(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        if (!meta) return;
        const original =
            meta.getAttribute("content") ||
            "width=device-width, initial-scale=1.0";
        if (window.screen.width < 1080)
            meta.setAttribute("content", "width=1280, user-scalable=yes");
        return () => meta.setAttribute("content", original);
    }, []);
    const hasChanges =
        elements.length > 0 || pagesChanged || password !== originalPassword;
    const entry = pages[Math.min(currentIndex, pages.length - 1)];

    useEffect(() => {
        if (pages.length && currentIndex >= pages.length)
            setCurrentIndex(pages.length - 1);
    }, [pages.length, currentIndex]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const undo = () => {
        if (history.undo()) setSelectedId(null);
    };
    const redo = () => {
        if (history.redo()) setSelectedId(null);
    };
    const [tool, setTool] = useState<ToolId>("signature");
    const [maskColor, setMaskColor] = useState("#ffffff");
    const [panelOpen, setPanelOpen] = useState(true);
    const navigate = useNavigate();
    const replaceInputRef = useRef<HTMLInputElement>(null);
    const selected = elements.find((e) => e.id === selectedId) || null;

    // Selecting an element on the page reopens the tools panel so its settings are visible
    useEffect(() => {
        if (selectedId) setPanelOpen(true);
    }, [selectedId]);

    useEffect(() => {
        if (!hasPendingEdits) return;
        const confirmLeaving = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", confirmLeaving);
        return () => window.removeEventListener("beforeunload", confirmLeaving);
    }, [hasPendingEdits]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            let restored: File | null = null;
            try {
                restored = await loadWorkingPdf();
            } catch {
                /* fall back below */
            }
            if (!restored) {
                // Older handoff format (small files saved before the IndexedDB switch, and tests)
                const stored = sessionStorage.getItem("pdfData");
                if (stored) {
                    try {
                        const { name, type, data } = JSON.parse(stored);
                        restored = new File(
                            [
                                Uint8Array.from(atob(data), (c) =>
                                    c.charCodeAt(0),
                                ),
                            ],
                            name,
                            { type },
                        );
                    } catch (error) {
                        console.error("Error restoring PDF:", error);
                    }
                }
            }
            if (cancelled) return;
            if (!restored) {
                navigate("/", { replace: true });
                return;
            }
            openFile(restored, false);
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    // Keep the stored copy current so a refresh reopens the same (possibly renamed/replaced) file
    useEffect(() => {
        if (!pdfFile) return;
        const enc = encryptedRef.current;
        saveWorkingPdf(
            enc
                ? new File([enc], pdfFile.name, { type: "application/pdf" })
                : pdfFile,
        ).catch(() => {});
    }, [pdfFile]);

    const update = (id: string, patch: Partial<EditorElement>) =>
        setElements((prev) =>
            prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        );
    const deleteElement = (id: string) => {
        setElements((prev) => prev.filter((e) => e.id !== id));
        setSelectedId(null);
    };

    // Keyboard shortcuts: undo/redo, Delete removes the selection, Escape deselects.
    // Kept in a ref so the listener always calls the latest handlers without re-subscribing.
    const shortcuts = useRef({ undo, redo, deleteElement, selectedId, laser });
    shortcuts.current = { undo, redo, deleteElement, selectedId, laser };
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const { undo, redo, deleteElement, selectedId, laser } =
                shortcuts.current;
            if (e.key === "Escape" && laser) {
                setLaser(false);
                return;
            }
            const t = e.target as HTMLElement;
            if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
            const key = e.key.toLowerCase();
            if ((e.metaKey || e.ctrlKey) && (key === "z" || key === "y")) {
                e.preventDefault();
                if (key === "y" || e.shiftKey) redo();
                else undo();
                return;
            }
            if (!selectedId) return;
            if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault();
                deleteElement(selectedId);
            }
            if (e.key === "Escape") setSelectedId(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const showFile = (
        file: File,
        pgs: PageEntry[],
        pw: string | null,
        encrypted: File | null,
        replace: boolean,
    ) => {
        encryptedRef.current = encrypted;
        setPdfUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
        setPdfFile(file);
        setHasRenamedFile(false);
        history.reset({ elements: [], pages: pgs });
        setPassword(pw);
        setOriginalPassword(pw);
        setCurrentIndex(0);
        setDownloadedSnapshot(snapshotOf([], pgs, pw));
        setSelectedId(null);
        if (replace) toast.success("PDF replaced");
    };

    const openFile = async (file: File, replace: boolean) => {
        try {
            const pgs = await readPages(await file.arrayBuffer());
            showFile(file, pgs, null, null, replace);
        } catch (error) {
            if (isPasswordProtectedError(error)) {
                setLocked({ file, replace });
                return;
            }
            console.error("Error opening PDF:", error);
            toast.error("Could not read this PDF");
            if (!replace) navigate("/", { replace: true });
        }
    };

    const unlock = async (pw: string): Promise<string | null> => {
        if (!locked) return null;
        try {
            const { decryptPDF } = await import("@pdfsmaller/pdf-decrypt");
            const bytes = await decryptPDF(
                new Uint8Array(await locked.file.arrayBuffer()),
                pw,
            );
            const file = new File([new Uint8Array(bytes)], locked.file.name, {
                type: "application/pdf",
            });
            const pgs = await readPages(await file.arrayBuffer());
            showFile(file, pgs, pw, locked.file, locked.replace);
            setLocked(null);
            toast.success(
                "PDF unlocked — the download keeps this password unless you change it in Protect",
            );
            return null;
        } catch (error) {
            const msg = error instanceof Error ? error.message : "";
            if (/incorrect password/i.test(msg))
                return "Incorrect password. Try again.";
            if (/unsupported/i.test(msg))
                return "This PDF uses an encryption type we can't open.";
            console.error("Unlock failed:", error);
            return "Could not unlock this PDF.";
        }
    };

    const handleFileSelected = (file: File) => openFile(file, true);

    const addElement = (
        el: Omit<EditorElement, "id" | "pageId" | "x" | "y">,
    ) => {
        if (!entry) return;
        if (entry.deleted) {
            toast.error("This page is marked for deletion — restore it first");
            return;
        }
        const page = entry.id;
        const pw = entry.w,
            ph = entry.h;
        let { w, h } = el;
        const fit = Math.min(1, (pw * 0.8) / w, (ph * 0.8) / h);
        w *= fit;
        h *= fit;
        const n = elements.filter((e) => e.pageId === page).length % 6;
        const item: EditorElement = {
            ...el,
            w,
            h,
            id: newId(),
            pageId: page,
            x: Math.max(0, (pw - w) / 2 + n * 12),
            y: Math.max(0, (ph - h) / 2 + n * 12),
        };
        setElements((prev) => [...prev, item]);
        setSelectedId(item.id);
    };

    const addSignature = async (signature: string) => {
        if (!signature) return;
        const d = await loadImageSize(signature);
        const w = 160;
        addElement({
            type: "signature",
            src: signature,
            w,
            h: w * (d.h / d.w),
        });
    };

    const onImageFile = (file?: File) => {
        if (!file || !file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = async () => {
            const src = reader.result as string;
            const d = await loadImageSize(src);
            const w = Math.min(240, d.w);
            addElement({
                type: "image",
                src,
                original: src,
                w,
                h: w * (d.h / d.w),
            });
        };
        reader.readAsDataURL(file);
    };

    const addMask = () =>
        addElement({ type: "mask", color: maskColor, w: 160, h: 40 });
    const addText = () =>
        addElement({
            type: "text",
            text: "Text",
            fontSize: 16,
            color: "#000000",
            ...measureText("Text", 16),
        });
    const addHighlight = () =>
        addElement({ type: "highlight", color: highlightColor, w: 180, h: 18 });
    const addStroke = (pts: [number, number][]) => {
        if (entry && pts.length)
            setElements((prev) => [
                ...prev,
                strokeToElement(pts, drawColor, drawWidth, entry.id),
            ]);
    };
    const insertBlank = () => {
        const base = entry ? { w: entry.w, h: entry.h } : { w: 612, h: 792 };
        const at = Math.min(currentIndex + 1, pages.length);
        setPages((prev) => [
            ...prev.slice(0, at),
            blankPage(base.w, base.h),
            ...prev.slice(at),
        ]);
        setCurrentIndex(at);
        setSelectedId(null);
        toast.success(`Blank page added as page ${at + 1}`);
    };
    const restorePage = (id: string) =>
        setPages((prev) =>
            prev.map((p) => (p.id === id ? { ...p, deleted: false } : p)),
        );
    const pickTool = (id: ToolId) => {
        setTool(id);
        setSelectedId(null);
    };

    const setText = (el: EditorElement, patch: Partial<EditorElement>) => {
        const next = { ...el, ...patch };
        update(el.id, {
            ...patch,
            ...measureText(
                next.text || "",
                next.fontSize || 16,
                next.bold,
                next.italic,
            ),
        });
    };

    const handleDownload = async () => {
        if (!pdfFile) return;
        const snapshot = currentSnapshot;
        try {
            let bytes: Uint8Array =
                elements.length || pagesChanged
                    ? await exportPdf(
                          await pdfFile.arrayBuffer(),
                          elements,
                          pages,
                      )
                    : new Uint8Array(await pdfFile.arrayBuffer());
            if (password) bytes = await protectPdf(bytes, password);
            const url = URL.createObjectURL(
                new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download =
                hasChanges && !hasRenamedFile
                    ? pdfFile.name.replace(/\.pdf$/i, "") + "-edited.pdf"
                    : pdfFile.name || "document.pdf";
            link.click();
            setDownloadedSnapshot(snapshot);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast.success("PDF downloaded");
        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast.error("Could not export the PDF");
        }
    };

    return (
        <div
            className={`h-screen flex flex-col bg-background ${laser ? "cursor-none [&_*]:!cursor-none" : ""}`}
        >
            {laser && <LaserPointer />}
            <header className="h-14 shrink-0 border-b bg-background flex items-center justify-between px-4">
                <div className="flex items-center gap-3 min-w-0">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
                        aria-label="Back to home"
                        onClick={(event) => {
                            if (
                                hasPendingEdits &&
                                !window.confirm(
                                    "Your latest edits have not been downloaded. Leave without downloading?",
                                )
                            )
                                event.preventDefault();
                        }}
                    >
                        <LucideArrowLeft className="w-4 h-4" />
                        <img
                            src="/logo.png"
                            alt="PDF One"
                            width={24}
                            height={24}
                            className="h-6 w-6"
                        />
                    </Link>
                    <div className="h-5 w-px bg-border" />
                    {pdfFile && (
                        <EditableFileName
                            name={pdfFile.name}
                            onRename={(name) => {
                                if (name === pdfFile.name) return;
                                setPdfFile(
                                    new File([pdfFile], name, {
                                        type: pdfFile.type,
                                        lastModified: pdfFile.lastModified,
                                    }),
                                );
                                setHasRenamedFile(true);
                            }}
                        />
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <input
                        ref={replaceInputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                                if (f.size > MAX_PDF_BYTES) {
                                    toast.error(tooLargeMessage);
                                    e.target.value = "";
                                    return;
                                }
                                if (
                                    hasChanges &&
                                    !window.confirm(
                                        "Replacing the file removes your edits. Continue?",
                                    )
                                ) {
                                    e.target.value = "";
                                    return;
                                }
                                handleFileSelected(f);
                            }
                            e.target.value = "";
                        }}
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9"
                        aria-label="Undo"
                        title="Undo (Ctrl+Z)"
                        disabled={!history.canUndo}
                        onClick={undo}
                    >
                        <Undo2 className="w-4 h-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9"
                        aria-label="Redo"
                        title="Redo (Ctrl+Shift+Z)"
                        disabled={!history.canRedo}
                        onClick={redo}
                    >
                        <Redo2 className="w-4 h-4" />
                    </Button>
                    <div className="h-5 w-px bg-border mx-1" />
                    <Button
                        size="icon"
                        variant={showGrid ? "secondary" : "ghost"}
                        className="h-9 w-9"
                        aria-label="Page grid"
                        aria-pressed={showGrid}
                        title="Show grid and margins"
                        onClick={() => setShowGrid((g) => !g)}
                    >
                        <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant={laser ? "secondary" : "ghost"}
                        className={`h-9 w-9 ${laser ? "text-laser" : ""}`}
                        aria-label="Laser pointer"
                        aria-pressed={laser}
                        title={
                            laser
                                ? "Turn off laser pointer (Esc)"
                                : "Laser pointer for screen sharing"
                        }
                        onClick={() => setLaser((l) => !l)}
                    >
                        <Pointer className="w-4 h-4" />
                    </Button>
                    <div className="h-5 w-px bg-border mx-1" />
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => replaceInputRef.current?.click()}
                    >
                        <LucideFileUp className="w-4 h-4 mr-2" /> Replace file
                    </Button>
                    <Button size="sm" onClick={handleDownload}>
                        <LucideDownload className="w-4 h-4 mr-2" />
                        {hasChanges ? "Download edited PDF" : "Download PDF"}
                        {hasPendingEdits && (
                            <span
                                className="ml-1 h-2 w-2 rounded-full bg-highlight-lime"
                                aria-label="Unsaved edits"
                            />
                        )}
                    </Button>
                </div>
            </header>

            {!pdfUrl || !pages.length ? (
                <div className="flex-1 grid place-items-center text-muted-foreground">
                    Loading…
                </div>
            ) : (
                <div className="flex flex-1 min-h-0">
                    <div className="flex-1 min-w-0 flex">
                        <PDFViewer
                            file={pdfUrl}
                            pages={pages}
                            currentIndex={Math.min(
                                currentIndex,
                                pages.length - 1,
                            )}
                            onIndexChange={setCurrentIndex}
                            onRestorePage={restorePage}
                            showGrid={showGrid}
                            draw={
                                tool === "draw"
                                    ? { color: drawColor, width: drawWidth }
                                    : null
                            }
                            onStroke={addStroke}
                            elements={elements}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            onChange={update}
                            onDelete={deleteElement}
                        />
                    </div>
                    <aside
                        className={`w-[19.2rem] shrink-0 border-l bg-card flex-col overflow-hidden ${panelOpen ? "flex" : "hidden"}`}
                    >
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            <div className="p-2 border-b space-y-1.5">
                                <div className="grid grid-cols-3 gap-0.5 rounded-lg bg-muted p-0.5">
                                    {TOOLS.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => pickTool(t.id)}
                                            aria-pressed={
                                                !selected && tool === t.id
                                            }
                                            className={`flex flex-col items-center gap-0.5 rounded-md py-1.5 text-xs font-medium transition-all ${(selected ? selected.type === t.id : tool === t.id) ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                        >
                                            <t.icon className="w-4 h-4" />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="px-1 pt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Pages &amp; file
                                </p>
                                <div className="grid grid-cols-2 gap-0.5 rounded-lg bg-muted p-0.5">
                                    {FILE_TOOLS.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => pickTool(t.id)}
                                            aria-pressed={
                                                !selected && tool === t.id
                                            }
                                            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${!selected && tool === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                        >
                                            <t.icon className="w-3.5 h-3.5" />
                                            {t.label}
                                            {t.id === "protect" && password && (
                                                <span
                                                    className="h-1.5 w-1.5 rounded-full bg-brand"
                                                    aria-label="Password set"
                                                />
                                            )}
                                            {t.id === "pages" &&
                                                pagesChanged && (
                                                    <span
                                                        className="h-1.5 w-1.5 rounded-full bg-brand"
                                                        aria-label="Page changes pending"
                                                    />
                                                )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div
                                className={`p-3 ${!selected && tool === "signature" ? "" : "hidden"}`}
                            >
                                <SignaturePad onPlaceSignature={addSignature} />
                            </div>
                            {selected ? (
                                <>
                                    <div className="flex items-center gap-2 px-3 h-11 border-b">
                                        {(() => {
                                            const T = ALL_TOOLS.find(
                                                (t) => t.id === selected.type,
                                            )!;
                                            return (
                                                <>
                                                    <T.icon className="w-4 h-4" />
                                                    <h2 className="text-sm font-semibold">
                                                        {T.label} settings
                                                    </h2>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <ElementSettings
                                        element={selected}
                                        onUpdate={(patch) =>
                                            update(selected.id, patch)
                                        }
                                        onTextChange={(patch) =>
                                            setText(selected, patch)
                                        }
                                        onMaskColor={setMaskColor}
                                        onRemove={() =>
                                            deleteElement(selected.id)
                                        }
                                    />
                                </>
                            ) : tool !== "signature" ? (
                                <ToolSettings
                                    tool={tool}
                                    maskColor={maskColor}
                                    onMaskColor={setMaskColor}
                                    onImageFile={onImageFile}
                                    onAddMask={addMask}
                                    onAddText={addText}
                                    highlightColor={highlightColor}
                                    onHighlightColor={setHighlightColor}
                                    onAddHighlight={addHighlight}
                                    drawColor={drawColor}
                                    onDrawColor={setDrawColor}
                                    drawWidth={drawWidth}
                                    onDrawWidth={setDrawWidth}
                                    pageCount={pages.length}
                                    deletedCount={
                                        pages.filter((p) => p.deleted).length
                                    }
                                    onInsertBlank={insertBlank}
                                    onOpenDelete={() => setDialog("delete")}
                                    onOpenOrganize={() => setDialog("organize")}
                                    hasPassword={!!password}
                                    onOpenProtect={() => setDialog("protect")}
                                />
                            ) : null}
                        </div>
                        <div className="shrink-0 flex justify-start px-1.5 py-1.5 border-t">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                aria-label="Hide tools panel"
                                title="Hide tools panel"
                                onClick={() => setPanelOpen(false)}
                            >
                                <PanelRightClose className="w-4 h-4" />
                            </Button>
                        </div>
                    </aside>
                    {!panelOpen && (
                        <div className="w-9 shrink-0 border-l bg-card flex flex-col items-center justify-end pb-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                aria-label="Show tools panel"
                                title="Show tools panel"
                                onClick={() => setPanelOpen(true)}
                            >
                                <PanelRightOpen className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}
            {pdfUrl && (
                <>
                    <DeletePagesDialog
                        open={dialog === "delete"}
                        onOpenChange={(o) => setDialog(o ? "delete" : null)}
                        file={pdfUrl}
                        pages={pages}
                        onApply={(ids) => {
                            setPages((prev) =>
                                prev.map((p) => ({
                                    ...p,
                                    deleted: ids.has(p.id),
                                })),
                            );
                            setSelectedId(null);
                            if (ids.size)
                                toast.success(
                                    `${ids.size} page${ids.size > 1 ? "s" : ""} will be deleted on download`,
                                );
                        }}
                    />
                    <OrganizePagesDialog
                        open={dialog === "organize"}
                        onOpenChange={(o) => setDialog(o ? "organize" : null)}
                        file={pdfUrl}
                        pages={pages}
                        onApply={(next) => {
                            const curId = entry?.id;
                            setPages(() => next);
                            setCurrentIndex(
                                Math.max(
                                    0,
                                    next.findIndex((p) => p.id === curId),
                                ),
                            );
                            setSelectedId(null);
                        }}
                    />
                </>
            )}
            <UnlockDialog
                open={!!locked}
                fileName={locked?.file.name || ""}
                onUnlock={unlock}
                onCancel={() => {
                    const wasReplace = locked?.replace;
                    setLocked(null);
                    if (!wasReplace || !pdfFile)
                        navigate("/", { replace: true });
                }}
            />
            {pdfUrl && (
                <>
                    <ProtectDialog
                        open={dialog === "protect"}
                        onOpenChange={(o) => setDialog(o ? "protect" : null)}
                        hasPassword={!!password}
                        onApply={(pw) => {
                            setPassword(pw);
                            toast.success(
                                pw
                                    ? "Password will be added when you download"
                                    : "Password protection removed",
                            );
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default Workspace;
