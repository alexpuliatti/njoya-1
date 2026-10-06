export function compareWorkDate(a, b) {
  return (
    (b.date ?? "").localeCompare(a.date ?? "") ||
    a.title.localeCompare(b.title) ||
    a.id.localeCompare(b.id)
  );
}
