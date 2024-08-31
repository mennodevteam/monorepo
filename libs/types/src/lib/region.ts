export class Region {
  id: string;
  title: string;
  state?: string;
  latitude: number;
  longitude: number;
  timezone?: string;

  static states(regions: Region[]) {
    const states: State[] = [];
    for (const region of regions) {
      if (region.state) {
        const state = states.find((x) => x.title === region.state);
        if (state) state.regions.push(region);
        else {
          states.push({ title: region.state, regions: [region] });
        }
      }
    }

    states.sort((a, b) => a.title.localeCompare(b.title));
    for (const state of states) {
      state.regions.sort((a, b) => a.title.localeCompare(b.title));
    }
    return states;
  }

  static haversine(region1: Region, region2: Region): number {
    const R = 6371; // Earth radius in kilometers
    const dLat = ((region2.latitude || 0) - (region1.latitude || 0)) * (Math.PI / 180);
    const dLon = ((region2.longitude || 0) - (region1.longitude || 0)) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((region1.latitude || 0) * (Math.PI / 180)) *
        Math.cos((region2.latitude || 0) * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export class State {
  title: string;
  regions: Region[];
}
