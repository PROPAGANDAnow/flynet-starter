import type { Restaurant } from "@flynetdev/react";
import type { RestaurantLocation } from "../lib/locations";
import { Tag } from "./tag";

// "Williamsburg · Brooklyn", with "+N more" when the restaurant has several
// locations. Neighborhood first — that's how diners think of a spot.
function locationLine(locations: RestaurantLocation[]): string | null {
  const [first] = locations;
  if (!first) return null;
  const place = [first.neighborhood, first.city].filter(Boolean).join(" · ");
  if (!place) return null;
  const more = locations.length - 1;
  return more > 0 ? `${place} +${more} more` : place;
}

// One restaurant from Flynet Discovery. Server-safe — render it straight from
// the listRestaurants response. Pass `locations` (lib/locations.ts) to show
// where it is and its booking link.
export function RestaurantCard({
  restaurant,
  locations = [],
}: {
  restaurant: Restaurant;
  locations?: RestaurantLocation[];
}) {
  const image =
    restaurant.asset?.web2x ??
    restaurant.asset?.full3x ??
    restaurant.asset?.preview1x ??
    null;
  const where = locationLine(locations);
  // Reserve beats website when a location takes reservations.
  const reserve =
    locations.find((location) => location.reservationUrl)?.reservationUrl ??
    null;
  const website = restaurant.websiteUrl ?? null;
  const link = reserve
    ? { href: reserve, label: "Reserve →" }
    : website
      ? { href: website, label: "Website →" }
      : null;

  return (
    <article className="overflow-hidden rounded-2xl bg-surface-low">
      {image ? (
        <div className="relative aspect-[16/10]">
          {/* Discovery serves images from arbitrary CDN hosts, so a plain img
              avoids next/image remote-domain config in a starter. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={restaurant.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <h3 className="absolute bottom-3 left-4 right-4 text-lg font-semibold text-white">
            {restaurant.name}
          </h3>
        </div>
      ) : (
        <h3 className="px-4 pt-4 text-lg font-semibold">{restaurant.name}</h3>
      )}
      <div className="space-y-2.5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {restaurant.cuisine.slice(0, 3).map((cuisine) => (
              <Tag key={cuisine}>{cuisine}</Tag>
            ))}
          </div>
          {typeof restaurant.price === "number" && restaurant.price > 0 && (
            <span className="shrink-0 text-sm text-muted">
              {"$".repeat(Math.min(restaurant.price, 4))}
            </span>
          )}
        </div>
        {(where || link) && (
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-muted">{where}</span>
            {link && (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 font-medium text-foreground transition duration-150 ease-standard hover:opacity-80"
              >
                {link.label}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
