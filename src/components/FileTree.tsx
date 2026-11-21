"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

type Dir = { dirs: Map<string, Dir>; files: string[] };

function buildTree(paths: string[]): Dir {
  const root: Dir = { dirs: new Map(), files: [] };
  for (const path of paths) {
    const parts = path.split("/");
    const name = parts.pop()!;
    let dir = root;
    for (const part of parts) {
      if (!dir.dirs.has(part)) dir.dirs.set(part, { dirs: new Map(), files: [] });
      dir = dir.dirs.get(part)!;
    }
    dir.files.push(name);
  }
  return root;
}

function countFiles(dir: Dir): number {
  let n = dir.files.length;
  for (const child of dir.dirs.values()) n += countFiles(child);
  return n;
}

type Selection = { selected?: string; onSelectFile?: (path: string) => void };
type ListProps = Selection & { dir: Dir; depth: number; prefix: string };

const rowFocus =
  "rounded-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

function DirList({ dir, depth, prefix, selected, onSelectFile }: ListProps) {
  return (
    <ul className={depth > 0 ? "ml-2 border-l border-border pl-2" : undefined}>
      {[...dir.dirs].map(([name, child]) => (
        <Folder
          key={name}
          name={name}
          dir={child}
          depth={depth}
          prefix={prefix}
          selected={selected}
          onSelectFile={onSelectFile}
        />
      ))}
      {dir.files.map((name) => {
        const path = prefix + name;
        const isSelected = path === selected;
        return (
          <li key={name}>
            <button
              type="button"
              title={path}
              aria-current={isSelected ? "true" : undefined}
              onClick={() => onSelectFile?.(path)}
              className={`flex w-full items-center py-0.5 text-left ${rowFocus} ${isSelected ? "font-medium text-primary" : "text-foreground"}`}
            >
              {/* Square marker: the selection isn't shown by color alone. */}
              <span aria-hidden="true" className="flex w-5 shrink-0 justify-center">
                {isSelected && <span className="size-1.5 bg-primary" />}
              </span>
              <span className="truncate">{name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Folder({ name, dir, depth, prefix, selected, onSelectFile }: ListProps & { name: string }) {
  const [open, setOpen] = useState(depth === 0);
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-1 py-0.5 text-left ${rowFocus}`}
      >
        <span aria-hidden="true" className="w-5 shrink-0 text-center text-faint">
          {open ? "▾" : "▸"}
        </span>
        <span className="truncate font-medium">{name}/</span>
        <span className="ml-auto pl-2 text-xs text-faint tabular-nums">{countFiles(dir)}</span>
      </button>
      {open && (
        <DirList
          dir={dir}
          depth={depth + 1}
          prefix={`${prefix}${name}/`}
          selected={selected}
          onSelectFile={onSelectFile}
        />
      )}
    </li>
  );
}

export default function FileTree({
  files,
  totalFiles,
  defaultBranch,
  truncated,
  selected,
  onSelectFile,
}: Selection & {
  files: string[];
  totalFiles: number;
  defaultBranch: string;
  truncated: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 tabular-nums">
        <Badge variant="secondary">
          {totalFiles} {totalFiles === 1 ? "file" : "files"}
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          branch: {defaultBranch}
        </Badge>
        {truncated && (
          <Badge variant="outline" className="border-input">
            showing {files.length} of {totalFiles}
          </Badge>
        )}
      </div>
      <div
        role="region"
        aria-label="Repository files"
        tabIndex={0}
        className="mt-3 h-60 overflow-auto rounded-lg border bg-background/60 p-2 text-sm sm:h-72 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <DirList
          dir={buildTree(files)}
          depth={0}
          prefix=""
          selected={selected}
          onSelectFile={onSelectFile}
        />
      </div>
    </div>
  );
}
