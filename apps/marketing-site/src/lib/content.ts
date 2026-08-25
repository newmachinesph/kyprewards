export type Industry = {
  slug: string;
  name: string;
  shortName: string;
  eyebrow: string;
  headline: string;
  description: string;
  reward: string;
  metric: string;
  metricLabel: string;
  challenge: string;
  features: Array<{ title: string; description: string }>;
};

export const industries: Industry[] = [
  {
    slug: "cafes-and-bakeries",
    name: "Cafés & bakeries",
    shortName: "Café",
    eyebrow: "Built for the morning rush",
    headline: "Turn a familiar order into a reason to return.",
    description:
      "Keep the warmth of a neighborhood café while KYPStamping quietly remembers visits, favorite orders, and the moment a reward is ready.",
    reward: "8 visits → a pastry on us",
    metric: "22%",
    metricLabel: "stronger four-week retention",
    challenge:
      "Paper cards disappear. Names get forgotten during the rush. KYPStamping keeps the relationship without slowing the counter.",
    features: [
      {
        title: "Fast counter scanning",
        description:
          "Issue a stamp in seconds from any phone, tablet, or counter screen.",
      },
      {
        title: "Favorite order memory",
        description:
          "Record a regular’s usual order and turn it into a thoughtful birthday offer.",
      },
      {
        title: "Quiet-hour campaigns",
        description:
          "Invite the right customers back when the afternoon counter goes quiet.",
      },
    ],
  },
  {
    slug: "salons-and-wellness",
    name: "Salons & wellness",
    shortName: "Wellness",
    eyebrow: "Retention between appointments",
    headline: "Stay remembered after the appointment ends.",
    description:
      "Give clients a clear path back with visit rewards, timely reminders, and personal offers that never feel like a blast message.",
    reward: "5 visits → signature treatment",
    metric: "31%",
    metricLabel: "more repeat bookings",
    challenge:
      "Great service creates loyalty, but busy clients still forget to rebook. KYPStamping makes the next visit visible before they leave.",
    features: [
      {
        title: "Visit-based rewards",
        description:
          "Build rewards around services, appointments, or spend without adding a complex POS workflow.",
      },
      {
        title: "Rebooking reminders",
        description:
          "Reach clients when their usual return window is approaching.",
      },
      {
        title: "Consent built in",
        description:
          "Clients control marketing permissions from their own private profile.",
      },
    ],
  },
  {
    slug: "restaurants",
    name: "Restaurants",
    shortName: "Restaurant",
    eyebrow: "From first table to favorite table",
    headline: "Give good guests a better reason to choose you again.",
    description:
      "Reward visits across dine-in and takeaway, recognize returning guests, and bring slower service windows back to life.",
    reward: "6 visits → house favorite",
    metric: "18%",
    metricLabel: "more returning guests",
    challenge:
      "Guests have endless choices. KYPStamping makes progress tangible and keeps your restaurant present between meals.",
    features: [
      {
        title: "One QR identity",
        description:
          "Guests use the same personal code across every participating location.",
      },
      {
        title: "Flexible reward rules",
        description:
          "Set visit thresholds, expiry rules, and redemption terms that suit service.",
      },
      {
        title: "Segmented invitations",
        description:
          "Reach new, regular, VIP, inactive, or reward-ready guests separately.",
      },
    ],
  },
  {
    slug: "retail",
    name: "Independent retail",
    shortName: "Retail",
    eyebrow: "A loyalty layer for local retail",
    headline: "Make every purchase part of an ongoing relationship.",
    description:
      "Give independent shops an uncomplicated loyalty program that customers understand immediately and staff can run confidently.",
    reward: "10 visits → member reward",
    metric: "2.4×",
    metricLabel: "more identifiable repeat visits",
    challenge:
      "Transactions are easy to count; relationships are harder. KYPStamping connects the two without replacing the tools you already use.",
    features: [
      {
        title: "No POS replacement",
        description:
          "Start alongside your current checkout flow and integrate later when it makes sense.",
      },
      {
        title: "Staff permissions",
        description:
          "Let associates issue stamps while managers retain control of rewards and campaigns.",
      },
      {
        title: "Network discovery",
        description:
          "Help nearby customers find your store and join before their first purchase.",
      },
    ],
  },
];

export type ResourceArticle = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  readTime: string;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
};

export const resources: ResourceArticle[] = [
  {
    slug: "design-a-reward-people-finish",
    category: "Loyalty playbook",
    title: "Design a reward people actually finish",
    summary:
      "Choose a visit target and reward value that feel attainable without giving away the margin you need.",
    readTime: "6 min read",
    intro:
      "The best loyalty program is not the most generous one. It is the one customers can understand at a glance and believe they will complete.",
    sections: [
      {
        heading: "Start with your natural rhythm",
        body: "Look at how often a happy regular already visits. A coffee shop might see someone twice a week; a salon may see them every six weeks. Set the reward just beyond the behavior you want to encourage, not beyond what feels possible.",
      },
      {
        heading: "Make the reward concrete",
        body: "“Member benefit” is vague. “A pastry on us” is visible and immediate. Customers should know what they are earning before they collect the first stamp.",
      },
      {
        heading: "Protect the experience",
        body: "Simple terms prevent awkward counter conversations. Decide whether stamps expire, whether a reward can be transferred, and how soon another stamp can be issued.",
      },
    ],
  },
  {
    slug: "bring-back-quiet-hour-customers",
    category: "Campaign guide",
    title: "Bring customers back during quiet hours",
    summary:
      "Use timing and relevance—not bigger discounts—to create demand when your floor has capacity.",
    readTime: "5 min read",
    intro:
      "A quiet-hour campaign works best when it feels like a useful invitation, not an emergency sale.",
    sections: [
      {
        heading: "Choose the right audience",
        body: "Start with customers who already know the business: recent first-timers, almost-regulars, or people one visit away from a reward. Relevance does more work than reach.",
      },
      {
        heading: "Name the window clearly",
        body: "Give people a specific reason to visit at a specific time. “Double stamp from 2–4 PM today” is easier to act on than “Come back soon.”",
      },
      {
        heading: "Measure the return visit",
        body: "Track visits during the campaign window and compare them with a normal day. Keep the message if it changes behavior; retire it if it only gives away margin.",
      },
    ],
  },
  {
    slug: "privacy-friendly-local-marketing",
    category: "Customer trust",
    title: "A practical guide to privacy-friendly loyalty",
    summary:
      "Collect only what helps the customer, explain why it matters, and make consent easy to change.",
    readTime: "7 min read",
    intro:
      "Customer trust is part of the reward. A loyalty program should make the relationship clearer, not create uncertainty about where personal information goes.",
    sections: [
      {
        heading: "Ask for less",
        body: "A name and secure loyalty identifier may be enough to begin. Request birthday, mobile number, or favorite order only when each field unlocks a clear customer benefit.",
      },
      {
        heading: "Separate service from marketing",
        body: "Reward progress updates are not the same as promotions. Let customers understand and control each type of communication independently.",
      },
      {
        heading: "Make leaving uncomplicated",
        body: "Customers should be able to leave a business program, withdraw marketing consent, and understand what happens to their data without contacting support.",
      },
    ],
  },
];

export const faqs = [
  {
    question: "Do customers need to download an app?",
    answer:
      "No. KYPStamping runs as a fast mobile web app and can be saved to the home screen like an installed app.",
  },
  {
    question: "Do we need to replace our POS?",
    answer:
      "No. Start with QR scanning beside your current checkout. POS integrations can be added later.",
  },
  {
    question: "Can staff use their own phones?",
    answer:
      "Yes. Owners invite staff and control exactly which actions each role can perform.",
  },
  {
    question: "Who owns the customer data?",
    answer:
      "The customer controls their personal profile and consent. Your business sees only the information they choose to share with your program.",
  },
  {
    question: "Can I change my reward later?",
    answer:
      "Yes. You can update future earning rules while preserving rewards customers have already unlocked.",
  },
];
