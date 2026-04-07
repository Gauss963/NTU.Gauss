const contactPage = document.querySelector("[data-contact-page]");

if (contactPage) {
  const address = contactPage.dataset.contactAddress || "辛亥路三段188號, Taipei, Taiwan";
  const token = (contactPage.dataset.appleMapsToken || window.APPLE_MAPKIT_TOKEN || "").trim();
  const mapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
  const mapRoot = document.querySelector("#contact-map");
  const fallback = document.querySelector("#contact-map-fallback");
  const fallbackStatus = document.querySelector("#contact-map-status");
  const copyAddressButton = document.querySelector("[data-copy-address]");

  document.querySelectorAll("[data-apple-maps-link]").forEach((link) => {
    link.href = mapsUrl;
  });

  if (copyAddressButton) {
    copyAddressButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(address);
        copyAddressButton.textContent = "Address Copied";
      } catch (error) {
        copyAddressButton.textContent = "Copy Failed";
      }

      window.setTimeout(() => {
        copyAddressButton.textContent = "Copy Address";
      }, 1600);
    });
  }

  const showFallback = (message) => {
    if (mapRoot) {
      mapRoot.hidden = true;
    }

    if (fallback) {
      fallback.hidden = false;
    }

    if (fallbackStatus && message) {
      fallbackStatus.textContent = message;
    }
  };

  const loadMapKit = () => new Promise((resolve, reject) => {
    if (window.mapkit) {
      resolve(window.mapkit);
      return;
    }

    window.initContactMapKit = () => {
      resolve(window.mapkit);
      delete window.initContactMapKit;
    };

    const script = document.createElement("script");
    script.src = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.core.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.callback = "initContactMapKit";
    script.dataset.libraries = "map,services";
    script.dataset.token = token;
    script.onerror = () => reject(new Error("Unable to load MapKit JS."));
    document.head.append(script);
  });

  const renderMap = async () => {
    if (!mapRoot) {
      return;
    }

    const mapkit = await loadMapKit();
    const geocoder = new mapkit.Geocoder();

    geocoder.lookup(address, (error, data) => {
      if (error || !data || !Array.isArray(data.results) || data.results.length === 0) {
        showFallback("The interactive Apple map could not resolve this address right now. You can still open it in Apple Maps.");
        return;
      }

      const result = data.results[0];
      const coordinate = result.coordinate;
      const map = new mapkit.Map("contact-map");

      map.showsCompass = mapkit.FeatureVisibility.Hidden;
      map.showsMapTypeControl = false;
      map.showsZoomControl = true;
      map.isRotationEnabled = false;
      map.region = new mapkit.CoordinateRegion(
        coordinate,
        new mapkit.CoordinateSpan(0.008, 0.008)
      );

      const marker = new mapkit.MarkerAnnotation(coordinate, {
        title: "Gauss Chang",
        subtitle: "辛亥路三段188號"
      });

      map.addAnnotation(marker);
      map.selectedAnnotation = marker;
    });
  };

  if (!token) {
    showFallback("This page is ready for an Apple Maps embed. Add a MapKit JS token to enable the live map preview.");
  } else {
    renderMap().catch(() => {
      showFallback("The interactive Apple map is temporarily unavailable. You can still open the address in Apple Maps.");
    });
  }
}
