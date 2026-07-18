import type {
  FileTreeNode,
  ProjectNodeListItem,
} from "@/lib/files/file.types";

function compareNodes(
  first: ProjectNodeListItem,
  second: ProjectNodeListItem,
) {
  if (first.type !== second.type) {
    return first.type === "FOLDER" ? -1 : 1;
  }

  if (first.sortOrder !== second.sortOrder) {
    return first.sortOrder - second.sortOrder;
  }

  const caseInsensitiveNameOrder = first.name.localeCompare(
    second.name,
    "en-US",
    { sensitivity: "base" },
  );

  if (caseInsensitiveNameOrder !== 0) {
    return caseInsensitiveNameOrder;
  }

  const nameOrder = first.name.localeCompare(second.name, "en-US");
  return nameOrder !== 0 ? nameOrder : first.id.localeCompare(second.id);
}

export function buildFileTree(
  nodes: ProjectNodeListItem[],
): FileTreeNode[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const ancestryValidity = new Map<string, boolean>();

  function hasValidAncestry(nodeId: string, path: Set<string>): boolean {
    const cached = ancestryValidity.get(nodeId);

    if (cached !== undefined) {
      return cached;
    }

    const node = nodeById.get(nodeId);

    if (!node || path.has(nodeId)) {
      return false;
    }

    if (!node.parentId) {
      ancestryValidity.set(nodeId, true);
      return true;
    }

    const parent = nodeById.get(node.parentId);

    if (!parent || parent.type !== "FOLDER") {
      ancestryValidity.set(nodeId, false);
      return false;
    }

    const nextPath = new Set(path);
    nextPath.add(nodeId);
    const valid = hasValidAncestry(parent.id, nextPath);
    ancestryValidity.set(nodeId, valid);
    return valid;
  }

  const validNodes = nodes.filter((node) =>
    hasValidAncestry(node.id, new Set()),
  );
  const childrenByParent = new Map<string | null, ProjectNodeListItem[]>();

  for (const node of validNodes) {
    const siblings = childrenByParent.get(node.parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parentId, siblings);
  }

  function materialize(parentId: string | null): FileTreeNode[] {
    return (childrenByParent.get(parentId) ?? [])
      .slice()
      .sort(compareNodes)
      .map((node) => ({
        ...node,
        children:
          node.type === "FOLDER" ? materialize(node.id) : [],
      }));
  }

  return materialize(null);
}

export function getProjectNodePath(
  nodes: ProjectNodeListItem[],
  nodeId: string,
): string | null {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const segments: string[] = [];
  const visited = new Set<string>();
  let current = nodeById.get(nodeId);

  while (current) {
    if (visited.has(current.id)) {
      return null;
    }

    visited.add(current.id);
    segments.unshift(current.name);

    if (!current.parentId) {
      return segments.join("/");
    }

    current = nodeById.get(current.parentId);
  }

  return null;
}

export function getProjectDestinationPath(
  nodes: ProjectNodeListItem[],
  parentId: string | null,
) {
  return parentId ? (getProjectNodePath(nodes, parentId) ?? "Unknown") : "/";
}

export function getDescendantNodeIds(
  nodes: ProjectNodeListItem[],
  nodeId: string,
) {
  const childrenByParent = new Map<string, string[]>();

  for (const node of nodes) {
    if (!node.parentId) {
      continue;
    }

    const childIds = childrenByParent.get(node.parentId) ?? [];
    childIds.push(node.id);
    childrenByParent.set(node.parentId, childIds);
  }

  const descendants = new Set<string>();
  const queue = [...(childrenByParent.get(nodeId) ?? [])];

  while (queue.length > 0) {
    const currentId = queue.shift();

    if (!currentId || descendants.has(currentId)) {
      continue;
    }

    descendants.add(currentId);
    queue.push(...(childrenByParent.get(currentId) ?? []));
  }

  return descendants;
}
