/** @typedef {import("./njoya-carousel-types").SearchItem} SearchItem */

/**
 * Share both the in-flight request and its result between search surfaces.
 * Failed requests are discarded so the visitor can retry without reloading.
 * @param {string} url
 * @param {(url: string) => Promise<{ok: boolean, json: () => Promise<unknown>}>} [fetcher]
 */
export function createSearchCatalogLoader(url, fetcher = (url) => fetch(url)) {
  /** @type {Promise<SearchItem[]> | undefined} */
  let pending;

  return function loadSearchCatalog() {
    if (!pending) {
      pending = Promise.resolve()
        .then(() => fetcher(url))
        .then(async (response) => {
          if (!response.ok) throw new Error("Search is unavailable.");
          const data = await response.json();
          const fields = [
            "id",
            "title",
            "subtitle",
            "category",
            "href",
            "imageUrl",
            "searchText",
          ];

          if (
            !Array.isArray(data) ||
            !data.every(
              (item) =>
                item &&
                fields.every((field) => typeof item[field] === "string"),
            )
          )
            throw new Error("Search data is unavailable.");

          return /** @type {SearchItem[]} */ (data);
        })
        .catch((error) => {
          pending = undefined;
          throw error;
        });
    }

    return pending;
  };
}
