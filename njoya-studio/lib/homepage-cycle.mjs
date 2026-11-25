// Use a complete cycle so categories with two choices alternate across loads
// while categories with three choices keep their own order.
export function homepageCycleCount(projectCounts) {
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

  return projectCounts.reduce(
    (count, length) => (count * length) / gcd(count, length),
    1,
  );
}

// A selector belongs to one loaded document. Remounts (including Strict Mode)
// reuse its selection; the next full page load advances the stored index.
export function createHomepageCycle(getStorage = () => window.sessionStorage) {
  let selected;

  return (count) => {
    if (selected !== undefined) return selected;

    try {
      const storage = getStorage();
      const next = Number(storage.getItem("njoya-home-cycle:v1"));

      selected = Number.isInteger(next) && next >= 0 && next < count ? next : 0;
      storage.setItem("njoya-home-cycle:v1", String((selected + 1) % count));
    } catch {
      // Browsers can disable storage. Keep the homepage usable and varied.
      selected ??= Math.floor(Math.random() * count);
    }

    return selected;
  };
}
