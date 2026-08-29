"use client";

import { useMemo, useState, useTransition, type DragEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FaFolder, FaFolderOpen, FaPlus, FaTrash } from "react-icons/fa6";

import {
  createMediaFolder,
  deleteMediaFolder,
  moveMediaToFolder,
} from "@/lib/actions/media.actions";
import { notify } from "@/lib/toast";

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
}

function buildTree(paths: string[]) {
  const roots: FolderNode[] = [];
  for (const path of paths) {
    let nodes = roots;
    let current = "";
    for (const name of path.split("/")) {
      current = current ? `${current}/${name}` : name;
      let node = nodes.find((item) => item.name === name);
      if (!node) {
        node = { name, path: current, children: [] };
        nodes.push(node);
      }
      nodes = node.children;
    }
  }
  return roots;
}

interface Props {
  folders: string[];
  selectedFolder?: string;
  mode?: "browse" | "select";
  onSelect?: (folder: string) => void;
}

export default function MediaFolderTree({
  folders,
  selectedFolder = "",
  mode = "browse",
  onSelect,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const tree = useMemo(() => buildTree(folders), [folders]);

  function select(folder: string) {
    onSelect?.(folder);
    if (mode === "select") return;
    const params = new URLSearchParams(searchParams.toString());
    if (folder) params.set("folder", folder);
    else params.delete("folder");
    params.delete("page");
    router.push(`${pathname}${params.size ? `?${params}` : ""}`);
  }

  function addFolder() {
    if (!newName.trim()) return;
    startTransition(async () => {
      try {
        const folder = await createMediaFolder(selectedFolder, newName);
        setNewName("");
        notify.success("Folder created.");
        router.refresh();
        select(folder);
      } catch (error) {
        notify.error(
          error instanceof Error ? error.message : "Unable to create folder.",
        );
      }
    });
  }

  function removeFolder() {
    if (!selectedFolder) return;
    startTransition(async () => {
      try {
        await deleteMediaFolder(selectedFolder);
        notify.success("Folder deleted.");
        select("");
        router.refresh();
      } catch (error) {
        notify.error(
          error instanceof Error ? error.message : "Unable to delete folder.",
        );
      }
    });
  }

  function dropImage(folder: string, mediaId: number) {
    startTransition(async () => {
      try {
        await moveMediaToFolder(mediaId, folder);
        notify.success(`Image moved to ${folder || "uploads root"}.`);
        router.refresh();
      } catch (error) {
        notify.error(
          error instanceof Error ? error.message : "Unable to move image.",
        );
      } finally {
        setDropTarget(null);
      }
    });
  }

  function dropProps(folder: string) {
    if (mode !== "browse") return {};
    return {
      onDragOver: (event: DragEvent) => {
        if (!event.dataTransfer.types.includes("application/x-media-id"))
          return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setDropTarget(folder);
      },
      onDragLeave: () =>
        setDropTarget((current) => (current === folder ? null : current)),
      onDrop: (event: DragEvent) => {
        event.preventDefault();
        const id = Number(event.dataTransfer.getData("application/x-media-id"));
        if (Number.isInteger(id) && id > 0) dropImage(folder, id);
      },
    };
  }

  function renderNodes(nodes: FolderNode[], depth = 0) {
    return nodes.map((node) => {
      const selected = node.path === selectedFolder;
      return (
        <div key={node.path} className="space-y-1">
          <button
            type="button"
            onClick={() => select(node.path)}
            {...dropProps(node.path)}
            className={`flex w-full items-center gap-2 rounded-md py-2.5 pr-2 text-left text-sm transition ${
              dropTarget === node.path
                ? "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400"
                : selected
                  ? "bg-[#0E4A7B] text-white"
                  : "text-slate-700 hover:bg-slate-100"
            }`}
            style={{ paddingLeft: `${10 + depth * 16}px` }}
          >
            {selected ? <FaFolderOpen /> : <FaFolder />}
            <span className="truncate">{node.name}</span>
          </button>
          <div className="space-y-1">
            {renderNodes(node.children, depth + 1)}
          </div>
        </div>
      );
    });
  }

  return (
    <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Folders</h2>
        {selectedFolder && (
          <button
            type="button"
            onClick={removeFolder}
            disabled={isPending}
            title="Delete empty folder"
            className="rounded-md p-2 text-red-600 hover:bg-red-50"
          >
            <FaTrash />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => select("")}
        {...dropProps("")}
        className={`flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-sm transition ${
          dropTarget === ""
            ? "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400"
            : !selectedFolder
              ? "bg-[#0E4A7B] text-white"
              : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        <FaFolderOpen /> {mode === "select" ? "Uploads root" : "All media"}
      </button>
      <div className="max-h-[55vh] space-y-1.5 overflow-y-auto py-1">
        {renderNodes(tree)}
      </div>
      {mode === "browse" && (
        <p className="text-xs leading-5 text-slate-500">
          Drag an image card onto a folder to move it.
        </p>
      )}
      <div className="border-t border-slate-200 pt-3">
        <p className="mb-2 text-xs text-slate-500">
          Add inside {selectedFolder || "uploads root"}
        </p>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addFolder();
              }
            }}
            placeholder="New folder"
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addFolder}
            disabled={isPending || !newName.trim()}
            aria-label="Add folder"
            className="rounded-md bg-[#0E4A7B] px-3 text-white disabled:opacity-50"
          >
            <FaPlus />
          </button>
        </div>
      </div>
    </aside>
  );
}
