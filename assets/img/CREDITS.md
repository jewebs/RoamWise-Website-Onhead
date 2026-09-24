# Image credits

All photographs are from Unsplash under the [Unsplash License](https://unsplash.com/license):
free for commercial use, no attribution required, no permission needed. Credits are recorded here
anyway so every asset can be traced back to its source.

Each image was fetched from the Unsplash image CDN at the exact rendered dimensions
(`?w=…&h=…&fit=crop&crop=entropy&q=82&fm=jpg`) and re-encoded locally to WebP with
`cwebp -q 80 -m 6`.

| Local files | Rendered size | Unsplash photo | Subject |
|---|---|---|---|
| `hero-2400.webp`, `hero-1200.webp` | 2400×1350, 1200×675 | [`-m6Q-HU-UZI`](https://unsplash.com/photos/-m6Q-HU-UZI) | Wet road through an Irish mountain valley under grey skies |
| `transfer-car-1600.webp`, `transfer-car-800.webp` | 1600×1067, 800×534 | [`MWP7wtfhEJs`](https://unsplash.com/photos/MWP7wtfhEJs) | City lights past a car window at night, from the back seat |
| `tour-cliffs-1600.webp`, `tour-cliffs-800.webp` | 1600×1067, 800×534 | [`siDaf1bi2HE`](https://unsplash.com/photos/siDaf1bi2HE) | Cliffs of Moher |
| `tour-titanic-1600.webp`, `tour-titanic-800.webp` | 1600×1067, 800×534 | [`xgMh3MPn4PU`](https://unsplash.com/photos/xgMh3MPn4PU) | Hexagonal basalt columns, Giant's Causeway |
| `tour-chauffeur-1600.webp`, `tour-chauffeur-800.webp` | 1600×1067, 800×534 | [`mJyOFH_EEgE`](https://unsplash.com/photos/mJyOFH_EEgE) | Dark saloon car on a wet road below misty hills |
| `tour-wicklow-1600.webp`, `tour-wicklow-800.webp` | 1600×1067, 800×534 | [`WNmJSKAJl0A`](https://unsplash.com/photos/WNmJSKAJl0A) | Upper lake at Glendalough in mist |
| `tour-photography-1600.webp`, `tour-photography-800.webp` | 1600×1067, 800×534 | [`bREMT7g5ToU`](https://unsplash.com/photos/bREMT7g5ToU) | Grafton Street, Dublin, in the rain |

`favicon.svg` in `assets/` is drawn for this project, not sourced.

## Replace with John's own photography

These two are stock standing in for assets that must be real before launch. A generic car photo
is the single fastest way for a visitor to conclude the operator is not real, which is the exact
opposite of what this page is built to do.

- **`transfer-car-*`** — should be John's actual vehicle, ideally the interior a passenger sees.
- **`tour-chauffeur-*`** — should be John's car on a real Irish road, or John himself at arrivals
  with the name board.

The landscape shots (cliffs, causeway, Glendalough, Grafton Street, the hero) are of real places
John drives to and can stay as they are.

When swapping, keep the same filenames and pixel dimensions. The `width`/`height` attributes in
`index.html` are set to these exact sizes to prevent layout shift while images load; changing the
aspect ratio means updating those attributes too.
