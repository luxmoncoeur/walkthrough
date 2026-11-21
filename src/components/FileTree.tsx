"use client";

import { useState } from "react";

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
  "rounded-sm hover:bg-border/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";

function DirList({ dir, depth, prefix, selected, onSelectFile }: ListProps) {
  return (
    <ul className={depth > 0 ? "ml-4 border-l border-border pl-2" : undefined}>
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
              className={`block w-full truncate py-0.5 pl-5 text-left ${rowFocus} ${isSelected ? "bg-accent/10 font-medium text-accent" : "text-foreground"}`}
            >
              {name}
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
        <span aria-hidden="true" className="w-4 text-muted">
          {open ? "▾" : "▸"}
        </span>
        <span className="truncate font-medium">{name}/</span>
        <span className="ml-auto pl-2 text-xs text-muted">{countFiles(dir)}</span>
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
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">
          {totalFiles} {totalFiles === 1 ? "file" : "files"}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 font-mono text-xs text-muted">
          branch: {defaultBranch}
        </span>
        {truncated && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
            showing {files.length} of {totalFiles}
          </span>
        )}
      </div>
      <div
        role="region"
        aria-label="Repository files"
        tabIndex={0}
        className="mt-3 h-72 overflow-auto rounded-md border border-border p-2 font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
