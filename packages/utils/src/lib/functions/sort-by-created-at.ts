export function sortByCreatedAt(a: any, b: any, desc = false) {
  return (new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf()) * (desc ? -1 : 1);
}

export function sortByCreatedAtDesc(a: any, b: any) {
  return sortByCreatedAt(a, b, true);
}
