export type TeamMember = {
  name: string;
  bio: string[];
  coffee?: string;
  image?: string;
};

export const TEAM: TeamMember[] = [
  {
    name: "John Rawson",
    image:
      "https://thebeanbook.org/cdn/shop/files/website_martin_400x.png?v=1644464988",
    bio: [
      "John's desire is to see the coffee community thrive through individuals working together to create improvement.",
      "He studied business administration, marketing, and psychology in college and went on to use those degrees to help the Bean Book thrive as a Denver coffee staple.",
      "Perfecting a pour over has been a long term goal, that is constantly sidelined by the spur of the moment desire to perfect an espresso.",
    ],
    coffee: "His coffee of choice is an African single origin pour over.",
  },
  {
    name: "Seth Turner",
    bio: [
      "Seth graduated with a degree in business administration and finance, although he is never done: he is a self-proclaimed lifetime learner through non-traditional education. he is passionate about educating friends and family about business strategy and revealing individual potential in those around him.",
      "He is married to his lovely wife, Becca, and is now located in Denver. you'll find him making memories with friends, watching anime, enjoying a good brew, playing spikeball, or spending time in community.",
      "His goal is to use his creative energy to help others thrive in any way that he can, whether that be through a connection or conversation, an idea or business strategy, etc.",
    ],
    coffee: "His favorite coffee beverage is a halvah maple latte.",
  },
  {
    name: "Becca Turner",
    bio: [
      "Becca has a background in education and a degree in business administration and psychology. she is passionate about supporting the healthy growth and flourishing of individuals, communities, and businesses alike.",
      "During her free time you can find her working on DIY home remodeling projects, enjoying the outdoors with her dutch shepherd, Suki, road biking, coaching and playing volleyball, or reading a good book.",
    ],
    coffee: "her coffee of choice is a café au lait.",
  },
];
