/** Default list — imported into the database on first seed only. */
export type CoffeeShop = {
  name: string;
  locations: string[];
  website: string;
  locationLabel?: "Location" | "Locations";
};

export const COFFEE_SHOPS: CoffeeShop[] = [
  {
    name: "Brew Culture",
    locationLabel: "Location",
    locations: ["3620 W Colfax Ave.", "Denver, CO 80204"],
    website: "https://www.brewculturecoffee.com/",
  },
  {
    name: "Broken Pieces Cafe",
    locationLabel: "Location",
    locations: ["12472 W Belleview Ave.", "Littleton, CO 80127"],
    website: "https://www.welcometomosaic.com/broken-pieces-cafe",
  },
  {
    name: "Carbon Coffee Bar",
    locationLabel: "Location",
    locations: ["12230 E Colfax Ave Unit 120,", "Aurora, CO 80011"],
    website: "https://www.instagram.com/milknhoney_coffee/",
  },
  {
    name: "Copper Door Coffee Roasters",
    locationLabel: "Location",
    locations: [
      "1085 York St. Denver, CO 80209",
      "2890 Fairfax St, Denver, CO 80207",
      "7301 S Santa Fe Dr Suite 310 Littleton, CO 80120",
      "7581 E Academy Blvd. Denver, CO 80230",
    ],
    website: "https://copperdoorcoffee.com/",
  },
  {
    name: "Coffeegraph",
    locationLabel: "Location",
    locations: ["3800 Julian St,", "Denver CO 80211"],
    website: "https://www.instagram.com/coffeegraph.colorado/?hl=en",
  },
  {
    name: "Corvus Coffee Roasters",
    locationLabel: "Locations",
    locations: [
      "1740 S Broadway — Denver, CO 80210",
      "4925 S Newport St. — Denver, CO 80237",
      "5846 S Wadsworth Blvd. Suite 3500 — Littleton, CO 80123",
      "9528 W 58th Ave. — Arvada, CO 80002",
      "1580 E 39th Ave — Denver, CO 80205",
    ],
    website: "https://www.corvuscoffee.com/",
  },
  {
    name: "Dirt Coffee Bar",
    locationLabel: "Locations",
    locations: [
      "5767 S Rapp St. — Littleton, CO 80120",
      "1785 Quebec St. — Denver, CO 80220",
    ],
    website: "https://www.dirtcoffee.org/",
  },
  {
    name: "Doppio",
    locationLabel: "Location",
    locations: ["1245 E Colfax Ave #105", "Denver, CO 80218"],
    website: "https://www.doppiodenver.com/",
  },
  {
    name: "Frank & Roze",
    locationLabel: "Location",
    locations: ["4097 E 9th Ave, Denver, CO 80220"],
    website: "https://www.frankandroze.com/",
  },
  {
    name: "Front Porch Coffee Shop",
    locationLabel: "Location",
    locations: ["3101 S Kipling St.", "Lakewood, CO 80227"],
    website: "https://www.frontporchcoffeeshop.com/",
  },
  {
    name: "Grounds for Dismissal",
    locationLabel: "Location",
    locations: ["12230 E Colfax Ave. Unit 120,", "Aurora, CO 80011"],
    website: "https://gfdcoffee.com/",
  },
  {
    name: "Hello Coffee",
    locationLabel: "Location",
    locations: ["13701 W Jewell Ave #112", "Lakewood, CO 80228"],
    website: "https://www.facebook.com/hellocoffeelakewood/",
  },
  {
    name: "Jubilee Roasting Co.",
    locationLabel: "Locations",
    locations: [
      "1075 Park Ave W Suite 1100 — Denver, CO 80205",
      "1452 Kenton St. — Aurora, CO 80010",
    ],
    website: "https://www.jubileeroastingco.com/",
  },
  {
    name: "Launch Espresso",
    locationLabel: "Locations",
    locations: [
      "18455 W Colfax Ave. #101 — Golden, CO 80401",
      "New location in Sunnyside coming soon!",
    ],
    website: "https://www.launchcolorado.com/",
  },
  {
    name: "Lost Coffee",
    locationLabel: "Locations",
    locations: [
      "200 N Ursula St. #30 — Aurora, CO 80045",
      "390 W Perry St. — Castle Rock, CO 80104",
      "1190 W Littleton Blvd. — Littleton, CO 80120",
    ],
    website: "https://www.lostcoffee.com/",
  },
  {
    name: "Mango Tree Coffee",
    locationLabel: "Locations",
    locations: ["3498 S Broadway, Englewood, CO 80113"],
    website: "https://www.mangotreecoffee.org/",
  },
  {
    name: "The Molecule Effect",
    locationLabel: "Location",
    locations: ["2215 S. Broadway Denver, CO 80210"],
    website: "https://www.themoleculeeffect.com/",
  },
  {
    name: "The Perk",
    locationLabel: "Location",
    locations: ["78321 US-4", "Winter Park, CO 80482"],
    website: "https://theperkcoffeecompany.com/",
  },
  {
    name: "Plume Coffee Bar",
    locationLabel: "Location",
    locations: ["855 Main St.", "Idaho Springs, CO 80452"],
    website: "https://www.plumecoffeebar.com/",
  },
  {
    name: "Procession Coffee",
    locationLabel: "Location",
    locations: ["3501 Wazee St, Denver, CO 80216"],
    website: "https://www.processioncoffee.com/",
  },
  {
    name: "Queen City Collective",
    locationLabel: "Locations",
    locations: [
      "Welton St. — Denver, CO 80205",
      "309 W 1st Ave. — Denver, CO 80223",
      "10111 W 26th Ave. — Denver, CO 80215",
      "2002 Coalton Rd. — Louisville, CO 80027",
    ],
    website: "https://queencitycollectivecoffee.com/",
  },
  {
    name: "Salita",
    locationLabel: "Location",
    locations: ["701 N Grant St.", "Denver CO 80203"],
    website: "https://www.bonannoconcepts.com/restaurant/salita/",
  },
  {
    name: "Sapor Coffee & Concepts",
    locationLabel: "Location",
    locations: ["2795 N Speer Blvd. #17", "Denver, CO 80211"],
    website: "https://www.saporcoffee.com/",
  },
  {
    name: "Sati Cold Brew",
    locationLabel: "Location",
    locations: ["5224 W 25th Ave, Edgewater, CO 80214"],
    website: "http://trouvaillecoffee.com/",
  },
  {
    name: "Servant Coffee",
    locationLabel: "Location",
    locations: ["Online ordering"],
    website: "https://servantcoffee.com/",
  },
  {
    name: "Sonder Coffee & Tea",
    locationLabel: "Locations",
    locations: [
      "9731 E Iliff Ave. — Denver, CO 80231",
      "2000 S Colorado Blvd. Building IV — Denver, CO 80222",
    ],
    website: "https://sondercoffee.co/",
  },
  {
    name: "Vibe Coffee and Wine",
    locationLabel: "Location",
    locations: ["1490 Curtis Street, Denver, CO 80202"],
    website: "https://vibecoffeeandwine.com/",
  },
];
