/** The same matcher powers the dialog, suggestions, and results route. */
export function normalizeSearch(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
export function matchesSearch(item, query) {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const text = normalizeSearch(
    item.searchText ??
      [
        item.title,
        item.subtitle,
        item.category,
        ...(item.metadata ?? []).flatMap((entry) => [entry.label, entry.value]),
      ]
        .filter(Boolean)
        .join(" "),
  );
  return terms.every((term) => text.includes(term));
}
