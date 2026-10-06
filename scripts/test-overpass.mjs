async function testOverpass() {
  const query = `[out:json][timeout:10];node["amenity"~"restaurant|cafe|fast_food"](around:1000, 37.5665, 126.9780);out 5;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log("Overpass result count:", json.elements?.length);
    console.log("Sample places:", json.elements?.map(e => ({ name: e.tags?.name, amenity: e.tags?.amenity, lat: e.lat, lon: e.lon })));
  } catch (err) {
    console.error("Overpass error:", err);
  }
}

testOverpass();
