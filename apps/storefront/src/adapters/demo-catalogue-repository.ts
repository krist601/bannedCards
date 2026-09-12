import type { CatalogueRepository } from "@/application/ports";
import type { CatalogueItem } from "@/domain/commerce";

/** Replace this adapter with a Medusa API adapter without changing the UI or use cases. */
const items: CatalogueItem[] = [
  { id: "maralen", game: "magic-the-gathering", kind: "single", name: "Maralen, Fae Ascendant", set: "Lorwyn Eclipsed", collection: "Latest", finish: "Non-foil", condition: "Near Mint", price: 15990, stock: 2, colors: "B", theme: "fae", attributes: { collectorNumber: "108" } },
  { id: "rhys", game: "magic-the-gathering", kind: "single", name: "Rhys, the Evermore", set: "Lorwyn Eclipsed", collection: "Latest", finish: "Foil", condition: "Near Mint", price: 21990, stock: 1, colors: "G", theme: "fae", attributes: { collectorNumber: "211" } },
  { id: "berta", game: "magic-the-gathering", kind: "single", name: "Berta, Wise Extrapolator", set: "Secrets of Strixhaven", collection: "Latest", finish: "Non-foil", condition: "Near Mint", price: 11990, stock: 3, colors: "U", theme: "academy" },
  { id: "abigale", game: "magic-the-gathering", kind: "single", name: "Abigale, Poet Laureate", set: "Secrets of Strixhaven", collection: "Latest", finish: "Foil", condition: "Near Mint", price: 16990, stock: 2, colors: "W", theme: "academy" },
  { id: "wolverine", game: "magic-the-gathering", kind: "single", name: "Wolverine, Claws Out", set: "Magic | Marvel Super Heroes", collection: "Latest", finish: "Non-foil", condition: "Near Mint", price: 24990, stock: 2, colors: "RG", theme: "marvel" },
  { id: "one-ring", game: "magic-the-gathering", kind: "single", name: "The One Ring", set: "The Lord of the Rings: Tales of Middle-earth", collection: "Middle-earth", finish: "Non-foil", condition: "Near Mint", price: 69990, stock: 2, colors: "C", theme: "ring" },
  { id: "frodo", game: "magic-the-gathering", kind: "single", name: "Frodo, Sauron's Bane", set: "The Lord of the Rings: Tales of Middle-earth", collection: "Middle-earth", finish: "Non-foil", condition: "Near Mint", price: 8990, stock: 4, colors: "WB", theme: "shire" },
  { id: "gandalf", game: "magic-the-gathering", kind: "single", name: "Gandalf the Grey", set: "The Lord of the Rings: Tales of Middle-earth", collection: "Middle-earth", finish: "Foil", condition: "Near Mint", price: 18990, stock: 1, colors: "UR", theme: "mist" },
  { id: "aragorn", game: "magic-the-gathering", kind: "single", name: "Aragorn and Arwen, Wed", set: "The Lord of the Rings: Tales of Middle-earth", collection: "Middle-earth", finish: "Non-foil", condition: "Near Mint", price: 13990, stock: 3, colors: "WUG", theme: "shire" }
];

export const demoCatalogueRepository: CatalogueRepository = { list: () => items };
